import { type NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/booking/provider";
import { ANY_STAFF } from "@/lib/booking/types";
import { salonConfig } from "@/lib/salon.config";
import { addDaysISO, salonDateISO } from "@/lib/format";
import { isValidDateISO, jsonError, jsonServerError } from "../_lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability?date=YYYY-MM-DD&services=id1,id2&staff=<id|any>
 * → `{ slots: TimeSlot[] }`
 *
 * 400 on missing/malformed params, past dates, dates beyond the booking
 * window, or unknown service/staff ids.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const servicesParam = searchParams.get("services");
  const staffParam = searchParams.get("staff");

  // ── date ────────────────────────────────────────────────────────────────
  if (!date) {
    return jsonError('Missing required "date" query param (YYYY-MM-DD).', 400);
  }
  if (!isValidDateISO(date)) {
    return jsonError(`Invalid "date": "${date}". Expected a real YYYY-MM-DD date.`, 400);
  }
  const today = salonDateISO();
  if (date < today) {
    return jsonError(`"date" is in the past: ${date}.`, 400);
  }
  const lastBookable = addDaysISO(today, salonConfig.maxAdvanceDays);
  if (date > lastBookable) {
    return jsonError(
      `"date" is beyond the booking window — bookings open up to ${salonConfig.maxAdvanceDays} days ahead (through ${lastBookable}).`,
      400,
    );
  }

  // ── services ────────────────────────────────────────────────────────────
  if (!servicesParam) {
    return jsonError('Missing required "services" query param (comma-separated service ids).', 400);
  }
  const serviceIds = servicesParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (serviceIds.length === 0) {
    return jsonError('"services" must contain at least one service id.', 400);
  }

  // ── staff ───────────────────────────────────────────────────────────────
  if (!staffParam) {
    return jsonError(`Missing required "staff" query param (a staff id or "${ANY_STAFF}").`, 400);
  }

  try {
    const provider = getProvider();

    const knownServices = await provider.getServices();
    const knownServiceIds = new Set(knownServices.map((s) => s.id));
    const unknownServices = serviceIds.filter((id) => !knownServiceIds.has(id));
    if (unknownServices.length > 0) {
      return jsonError(`Unknown service id(s): ${unknownServices.join(", ")}.`, 400);
    }

    if (staffParam !== ANY_STAFF) {
      const knownStaff = await provider.getStaff();
      if (!knownStaff.some((t) => t.id === staffParam)) {
        return jsonError(`Unknown staff id: "${staffParam}".`, 400);
      }
    }

    const slots = await provider.getAvailability(date, serviceIds, staffParam);
    return NextResponse.json({ slots });
  } catch (err) {
    return jsonServerError(err);
  }
}
