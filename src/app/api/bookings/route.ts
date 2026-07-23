import { type NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/booking/provider";
import { ANY_STAFF, type Booking, type BookingCustomer, type BookingRequest } from "@/lib/booking/types";
import { createVerifiedAppointment } from "@/lib/booking/bychronos-booking";
import { decodeSessionCookie, SESSION_COOKIE } from "@/lib/booking/session-cookie";
import { salonConfig } from "@/lib/salon.config";
import { isNonEmptyString, isValidDateISO, jsonError, jsonServerError } from "../_lib/http";

/** Real bookings write to byChronos only when this is explicitly enabled. */
const WRITE_ENABLED = process.env.BYCHRONOS_ALLOW_WRITE === "true";

export const dynamic = "force-dynamic";

/* ────────────────────────────────────────────────────────────────────────────
 * Body validation
 * ──────────────────────────────────────────────────────────────────────────── */

type ParseResult = { ok: true; req: BookingRequest } | { ok: false; error: string };

function parseBookingRequest(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  // serviceIds
  if (!Array.isArray(b.serviceIds) || b.serviceIds.length === 0) {
    return { ok: false, error: '"serviceIds" must be a non-empty array of service ids.' };
  }
  if (!b.serviceIds.every(isNonEmptyString)) {
    return { ok: false, error: '"serviceIds" must contain only non-empty strings.' };
  }
  const serviceIds = b.serviceIds.map((s) => s.trim());

  // staffId
  if (!isNonEmptyString(b.staffId)) {
    return { ok: false, error: `"staffId" must be a staff id or "${ANY_STAFF}".` };
  }
  const staffId = b.staffId.trim();

  // startISO
  if (!isNonEmptyString(b.startISO)) {
    return { ok: false, error: '"startISO" must be an ISO-8601 datetime string.' };
  }
  const start = new Date(b.startISO);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: `"startISO" is not a valid datetime: "${b.startISO}".` };
  }
  if (start.getTime() < Date.now()) {
    return { ok: false, error: "Appointment time is in the past — please pick a future slot." };
  }

  // customer
  const c = b.customer;
  if (typeof c !== "object" || c === null || Array.isArray(c)) {
    return { ok: false, error: '"customer" must be an object with firstName, lastName, phone, and email.' };
  }
  const cu = c as Record<string, unknown>;
  for (const field of ["firstName", "lastName", "phone", "email"] as const) {
    if (!isNonEmptyString(cu[field])) {
      return { ok: false, error: `"customer.${field}" is required.` };
    }
  }
  const email = (cu.email as string).trim();
  if (!email.includes("@") || email.length < 5) {
    return { ok: false, error: "Please provide a valid email address." };
  }
  const phoneDigits = (cu.phone as string).replace(/\D/g, "");
  if (phoneDigits.length < 7) {
    return { ok: false, error: "Please provide a valid phone number." };
  }
  if (cu.notes !== undefined && typeof cu.notes !== "string") {
    return { ok: false, error: '"customer.notes" must be a string when provided.' };
  }

  const customer: BookingCustomer = {
    firstName: (cu.firstName as string).trim(),
    lastName: (cu.lastName as string).trim(),
    phone: (cu.phone as string).trim(),
    email,
    ...(isNonEmptyString(cu.notes) ? { notes: cu.notes.trim() } : {}),
  };

  return { ok: true, req: { serviceIds, staffId, startISO: start.toISOString(), customer } };
}

/* ────────────────────────────────────────────────────────────────────────────
 * POST /api/bookings — create a booking. 201 with the Booking on success,
 * 400 { error } on invalid input, 409 { error } if the slot is taken.
 * ──────────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = parseBookingRequest(body);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const req = parsed.req;

  try {
    const provider = getProvider();

    // Unknown-id checks up front so they come back as 400s, not conflicts.
    const knownServices = await provider.getServices();
    const knownServiceIds = new Set(knownServices.map((s) => s.id));
    const unknown = req.serviceIds.filter((id) => !knownServiceIds.has(id));
    if (unknown.length > 0) {
      return jsonError(`Unknown service id(s): ${unknown.join(", ")}.`, 400);
    }
    if (req.staffId !== ANY_STAFF) {
      const knownStaff = await provider.getStaff();
      if (!knownStaff.some((t) => t.id === req.staffId)) {
        return jsonError(`Unknown staff id: "${req.staffId}".`, 400);
      }
    }

    // Real write-back to byChronos (Option B): requires the customer to have
    // completed phone verification, which set the HttpOnly session cookie.
    if (WRITE_ENABLED) {
      const session = decodeSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);
      if (!session) {
        return jsonError("Please verify your phone number before booking.", 428);
      }
      const chosen = knownServices.filter((s) => req.serviceIds.includes(s.id));
      const totalCents = chosen.reduce((n, s) => n + s.priceCents, 0);
      const totalDurationMinutes = chosen.reduce((n, s) => n + s.durationMinutes, 0);
      const start = new Date(req.startISO);
      const { id } = await createVerifiedAppointment({
        session,
        serviceIds: req.serviceIds,
        resourceId: req.staffId !== ANY_STAFF ? Number(req.staffId) : undefined,
        startUnix: Math.floor(start.getTime() / 1000),
        durationMinutes: totalDurationMinutes,
        timezone: salonConfig.timezone,
        firstName: req.customer.firstName,
        lastName: req.customer.lastName,
        email: req.customer.email,
        phone: req.customer.phone,
        note: req.customer.notes,
      });
      const booking: Booking = {
        id: id || `bc_${start.getTime().toString(36)}`,
        serviceIds: req.serviceIds,
        staffId: req.staffId,
        startISO: start.toISOString(),
        customer: { ...req.customer },
        status: "synced",
        createdAtISO: new Date().toISOString(),
        totalCents,
        totalDurationMinutes,
        syncedToPos: true,
      };
      return NextResponse.json(booking, { status: 201 });
    }

    const booking = await provider.createBooking(req);
    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      // Provider errors carry user-safe messages. After the pre-validation
      // above, a rejection here means the requested slot isn't bookable
      // (taken, outside hours/lead-time/window) → conflict.
      return jsonError(err.message, 409);
    }
    return jsonServerError(err);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * GET /api/bookings[?date=YYYY-MM-DD] — list bookings (admin), optionally
 * filtered to one salon-timezone calendar date. → { bookings: Booking[] }
 * ──────────────────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (date !== null && !isValidDateISO(date)) {
    return jsonError(`Invalid "date": "${date}". Expected a real YYYY-MM-DD date.`, 400);
  }

  try {
    const bookings = await getProvider().listBookings(date ?? undefined);
    return NextResponse.json({ bookings });
  } catch (err) {
    return jsonServerError(err);
  }
}
