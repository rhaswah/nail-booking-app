/**
 * byChronos POS — live BookingProvider implementation.
 *
 * Maps our domain model (string ids, integer cents, integer minutes, UTC ISO
 * instants) onto the Go3 Schedule API (integer ids, dollar amounts, UNIX
 * timestamps). Availability is derived from the salon's opening hours minus the
 * appointments byChronos already holds, so the booking flow reflects the real
 * POS calendar.
 *
 * Enable by setting BOOKING_PROVIDER=bychronos plus the BYCHRONOS_* env vars.
 *
 * VERIFY-AGAINST-LIVE: a few response field names (staff service/day mappings,
 * the appointment resource shape) are read defensively because they can only be
 * pinned down against a live account. Each such spot is marked below; run the
 * connector against a UAT location once credentials exist and tighten the
 * mappers if the payload differs.
 */

import { salonConfig, type Weekday } from "@/lib/salon.config";
import type {
  Booking,
  BookingRequest,
  BookingStatus,
  Service,
  ServiceCategory,
  Staff,
  StaffSelection,
  TimeSlot,
} from "@/lib/booking/types";
import type { BookingProvider } from "@/lib/booking/provider";
import { ByChronosClient, readByChronosConfig, type ByChronosConfig } from "@/lib/booking/bychronos-client";

/* ── timezone + schedule helpers (self-contained; native Intl only) ────────── */

const TZ = salonConfig.timezone;
const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const AVATAR_COLORS = ["#CE6B69", "#DE908D", "#9A4140", "#524E48", "#B97C78", "#7C4A48"];

function tzOffsetMinutes(utcDate: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(utcDate)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return (asUTC - utcDate.getTime()) / 60_000;
}

function salonTimeToUtc(dateISO: string, minutesPastMidnight: number): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const wallUTC = Date.UTC(y, m - 1, d, 0, minutesPastMidnight);
  let utc = wallUTC;
  for (let i = 0; i < 2; i++) utc = wallUTC - tzOffsetMinutes(new Date(utc), TZ) * 60_000;
  return new Date(utc);
}

function salonDateOf(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instant);
}

function weekdayOf(dateISO: string): Weekday {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as Weekday;
}

function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/* ── raw byChronos payload shapes (partial; only what we consume) ──────────── */

interface Paginated<T> {
  data: T[];
}
interface RawCategory {
  id: number | string;
  name: string;
  description?: string | null;
}
interface RawService {
  id: number | string;
  name: string;
  category_name?: string | null;
  category_id?: number | string | null;
  description?: string | null;
  duration?: number | null;
  price?: number | null;
}
interface RawStaff {
  id: number | string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  title?: string | null;
  role?: string | null;
  position?: string | null;
  bio?: string | null;
  description?: string | null;
  service_ids?: (number | string)[] | null;
  services?: { id: number | string }[] | null;
  work_days?: number[] | null;
}
interface RawAppointment {
  id: number | string;
  start_datetime?: number | null; // UNIX seconds
  end_datetime?: number | null;
  duration?: number | null; // minutes
  status?: string | null;
  note?: string | null;
  staff_id?: number | string | null;
  staffer_id?: number | string | null;
  resource_ids?: (number | string)[] | null;
  service_ids?: (number | string)[] | null;
  services?: { id: number | string }[] | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  created_at?: string | null;
}

/* ── provider ─────────────────────────────────────────────────────────────── */

const dollarsToCents = (price: number | null | undefined): number =>
  Math.round((price ?? 0) * 100);

function mapAppointmentStatus(raw?: string | null): BookingStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "cancelled":
    case "canceled":
    case "no_show":
    case "no-show":
      return "cancelled";
    default:
      // Anything live in byChronos is, from our app's perspective, synced.
      return "synced";
  }
}

export class ByChronosProvider implements BookingProvider {
  private client: ByChronosClient;
  // Small in-request caches so availability doesn't refetch the catalog per slot.
  private servicesCache: Service[] | null = null;
  private staffCache: Staff[] | null = null;

  constructor(config?: ByChronosConfig) {
    const cfg = config ?? readByChronosConfig();
    if (!cfg) {
      throw new Error(
        "byChronos is not configured. Set BOOKING_PROVIDER=mock, or provide the BYCHRONOS_* env vars (see .env.example).",
      );
    }
    this.client = new ByChronosClient(cfg);
  }

  async getCategories(): Promise<ServiceCategory[]> {
    const res = await this.client.get<Paginated<RawCategory>>("/v1/service-categories", {
      is_package: 0,
    });
    return (res.data ?? []).map((c) => ({
      id: String(c.id),
      name: c.name,
      description: c.description ?? "",
    }));
  }

  async getServices(): Promise<Service[]> {
    if (this.servicesCache) return this.servicesCache;
    const [svcRes, categories] = await Promise.all([
      this.client.get<Paginated<RawService>>("/v1/services"),
      this.getCategories(),
    ]);
    const byName = new Map(categories.map((c) => [c.name, c.id]));
    const services = (svcRes.data ?? []).map((s): Service => ({
      id: String(s.id),
      // byChronos returns category_name on the service; fall back to category_id.
      categoryId: s.category_id != null ? String(s.category_id) : byName.get(s.category_name ?? "") ?? "",
      name: s.name,
      description: s.description ?? "",
      durationMinutes: Math.round(s.duration ?? 0),
      priceCents: dollarsToCents(s.price),
    }));
    this.servicesCache = services;
    return services;
  }

  async getStaff(): Promise<Staff[]> {
    if (this.staffCache) return this.staffCache;
    const res = await this.client.get<Paginated<RawStaff>>("/v1/staffs");
    const allServiceIds = (await this.getServices()).map((s) => s.id);
    const allOpenDays = (Object.entries(salonConfig.openingHours) as [string, unknown][])
      .filter(([, h]) => h !== null)
      .map(([d]) => Number(d));

    const staff = (res.data ?? []).map((s, i): Staff => {
      const name =
        s.name?.trim() ||
        [s.first_name, s.last_name].filter(Boolean).join(" ").trim() ||
        "Nail Technician";
      // VERIFY-AGAINST-LIVE: byChronos may expose per-staff services/work-days
      // under different keys. Until confirmed, a tech who lists none is treated
      // as able to perform every service on every open day (safe, permissive).
      const serviceIds =
        s.service_ids?.map(String) ??
        s.services?.map((x) => String(x.id)) ??
        allServiceIds;
      const workDays = s.work_days && s.work_days.length ? s.work_days : allOpenDays;
      return {
        id: String(s.id),
        name,
        role: s.title || s.role || s.position || "Nail Technician",
        bio: s.bio || s.description || "",
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        serviceIds,
        workDays,
      };
    });
    this.staffCache = staff;
    return staff;
  }

  async getAvailability(
    dateISO: string,
    serviceIds: string[],
    staffId: StaffSelection,
  ): Promise<TimeSlot[]> {
    if (!DATE_ISO_RE.test(dateISO) || serviceIds.length === 0) return [];

    const services = await this.getServices();
    const chosen = serviceIds.map((id) => services.find((s) => s.id === id));
    if (chosen.some((s) => !s)) return [];
    const totalDuration = chosen.reduce((sum, s) => sum + (s?.durationMinutes ?? 0), 0);
    if (totalDuration <= 0) return [];

    const now = new Date();
    const today = salonDateOf(now);
    if (dateISO < today || dateISO > addDays(today, salonConfig.maxAdvanceDays)) return [];

    const weekday = weekdayOf(dateISO);
    const hours = salonConfig.openingHours[weekday];
    if (!hours) return [];

    const staff = await this.getStaff();
    const eligible = staff.filter(
      (t) =>
        (staffId === "any" || t.id === staffId) &&
        t.workDays.includes(weekday) &&
        serviceIds.every((id) => t.serviceIds.includes(id)),
    );
    if (eligible.length === 0) return [];

    // Existing appointments on that date, grouped by tech, to exclude conflicts.
    const busyByStaff = await this.busyIntervals(dateISO);

    const openMin = parseHHMM(hours.open);
    const lastStartMin = parseHHMM(hours.close) - totalDuration;
    const earliestAllowed = now.getTime() + salonConfig.bookingLeadTimeMinutes * 60_000;

    const slots: TimeSlot[] = [];
    for (let m = openMin; m <= lastStartMin; m += salonConfig.slotIntervalMinutes) {
      const start = salonTimeToUtc(dateISO, m);
      if (start.getTime() < earliestAllowed) continue;
      const startMs = start.getTime();
      const endMs = startMs + totalDuration * 60_000;
      const freeTech = eligible.find((t) => {
        const busy = busyByStaff.get(t.id) ?? [];
        return !busy.some(([bStart, bEnd]) => startMs < bEnd && endMs > bStart);
      });
      if (freeTech) slots.push({ startISO: start.toISOString(), staffId: freeTech.id });
    }
    return slots;
  }

  async createBooking(req: BookingRequest): Promise<Booking> {
    const services = await this.getServices();
    const chosen = req.serviceIds.map((id) => {
      const svc = services.find((s) => s.id === id);
      if (!svc) throw new Error(`Unknown service: ${id}`);
      return svc;
    });
    const { firstName, lastName, phone, email } = req.customer;
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !email?.trim()) {
      throw new Error("Please fill in your name, phone, and email.");
    }

    const start = new Date(req.startISO);
    if (Number.isNaN(start.getTime())) throw new Error("Invalid appointment time.");

    // Confirm the slot is still open on the live calendar before writing.
    const dateISO = salonDateOf(start);
    const open = await this.getAvailability(dateISO, req.serviceIds, req.staffId);
    const slot = open.find((s) => s.startISO === start.toISOString());
    if (!slot) throw new Error("That time is no longer available — please pick another slot.");

    const totalDurationMinutes = chosen.reduce((sum, s) => sum + s.durationMinutes, 0);
    const body = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      service_ids: req.serviceIds.map(Number),
      resource_ids: slot.staffId ? [Number(slot.staffId)] : undefined,
      start_datetime: Math.floor(start.getTime() / 1000),
      duration: totalDurationMinutes,
      timezone: TZ,
      group_size: 1,
      note: req.customer.notes || undefined,
      preferred: req.staffId !== "any",
    };
    const created = await this.client.post<RawAppointment>("/v1/appointments", body);

    return {
      id: String(created.id),
      serviceIds: [...req.serviceIds],
      staffId: slot.staffId,
      startISO: start.toISOString(),
      customer: { ...req.customer },
      status: mapAppointmentStatus(created.status) === "cancelled" ? "cancelled" : "synced",
      createdAtISO: created.created_at ?? new Date().toISOString(),
      totalCents: chosen.reduce((sum, s) => sum + s.priceCents, 0),
      totalDurationMinutes,
      syncedToPos: true, // written straight to the POS
    };
  }

  async getBooking(id: string): Promise<Booking | null> {
    let raw: RawAppointment;
    try {
      raw = await this.client.get<RawAppointment>(`/v1/appointments/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
    return this.toBooking(raw, await this.getServices());
  }

  async listBookings(dateISO?: string): Promise<Booking[]> {
    // byChronos filters appointments by a time range; when a date is given we
    // ask for that salon-day, otherwise a wide default window.
    const query: Record<string, string | number | undefined> = {};
    if (dateISO && DATE_ISO_RE.test(dateISO)) {
      query.start = Math.floor(salonTimeToUtc(dateISO, 0).getTime() / 1000);
      query.end = Math.floor(salonTimeToUtc(addDays(dateISO, 1), 0).getTime() / 1000);
    }
    const res = await this.client.get<Paginated<RawAppointment> | RawAppointment[]>(
      "/v1/appointments",
      query,
    );
    const rows = Array.isArray(res) ? res : res.data ?? [];
    const services = await this.getServices();
    return rows
      .map((r) => this.toBooking(r, services))
      .filter((b): b is Booking => b !== null)
      .sort((a, b) => a.startISO.localeCompare(b.startISO));
  }

  /* ── internals ──────────────────────────────────────────────────────────── */

  /** Busy [startMs, endMs) intervals per staff id for the given salon date. */
  private async busyIntervals(dateISO: string): Promise<Map<string, [number, number][]>> {
    const map = new Map<string, [number, number][]>();
    let rows: RawAppointment[] = [];
    try {
      const res = await this.client.get<Paginated<RawAppointment> | RawAppointment[]>(
        "/v1/appointments",
        {
          start: Math.floor(salonTimeToUtc(dateISO, 0).getTime() / 1000),
          end: Math.floor(salonTimeToUtc(addDays(dateISO, 1), 0).getTime() / 1000),
        },
      );
      rows = Array.isArray(res) ? res : res.data ?? [];
    } catch {
      // If the calendar can't be read, fail open (offer slots) rather than block booking.
      return map;
    }
    for (const r of rows) {
      if (mapAppointmentStatus(r.status) === "cancelled") continue;
      const startMs = (r.start_datetime ?? 0) * 1000;
      if (!startMs) continue;
      const endMs = r.end_datetime
        ? r.end_datetime * 1000
        : startMs + (r.duration ?? 0) * 60_000;
      const staffId = r.staff_id ?? r.staffer_id ?? r.resource_ids?.[0];
      if (staffId == null) continue;
      const key = String(staffId);
      const list = map.get(key) ?? [];
      list.push([startMs, endMs]);
      map.set(key, list);
    }
    return map;
  }

  private toBooking(raw: RawAppointment, services: Service[]): Booking | null {
    const startMs = (raw.start_datetime ?? 0) * 1000;
    if (!startMs) return null;
    const serviceIds =
      raw.service_ids?.map(String) ?? raw.services?.map((s) => String(s.id)) ?? [];
    const chosen = serviceIds
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is Service => Boolean(s));
    const totalDurationMinutes =
      raw.duration ??
      (raw.end_datetime ? Math.round((raw.end_datetime * 1000 - startMs) / 60_000) : 0) ??
      chosen.reduce((sum, s) => sum + s.durationMinutes, 0);
    const staffId = String(raw.staff_id ?? raw.staffer_id ?? raw.resource_ids?.[0] ?? "");
    const firstName = raw.first_name ?? raw.name?.split(" ")[0] ?? "";
    const lastName = raw.last_name ?? raw.name?.split(" ").slice(1).join(" ") ?? "";

    return {
      id: String(raw.id),
      serviceIds,
      staffId,
      startISO: new Date(startMs).toISOString(),
      customer: {
        firstName,
        lastName,
        phone: raw.phone_number ?? "",
        email: raw.email ?? "",
        notes: raw.note ?? undefined,
      },
      status: mapAppointmentStatus(raw.status),
      createdAtISO: raw.created_at ?? new Date(startMs).toISOString(),
      totalCents: chosen.reduce((sum, s) => sum + s.priceCents, 0),
      totalDurationMinutes,
      syncedToPos: true,
    };
  }
}
