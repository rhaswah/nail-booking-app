/**
 * Live BookingProvider backed by the byChronos PUBLIC booking API.
 *
 * Reads (services, techs, availability) are pulled live from the salon's real
 * byChronos account with no credentials — the same data the official booking
 * page shows. Writes (creating an appointment in the live POS) are gated behind
 * BYCHRONOS_ALLOW_WRITE so testing never creates real bookings in the salon;
 * with writes off, a booking is captured locally and the confirmation flow still
 * works end-to-end.
 */

import type {
  Booking,
  BookingRequest,
  Service,
  ServiceCategory,
  Staff,
  StaffSelection,
  TimeSlot,
} from "@/lib/booking/types";
import type { BookingProvider } from "@/lib/booking/provider";
import { ByChronosPublicClient, readPublicConfig } from "@/lib/booking/bychronos-public";
import fallbackCatalog from "@/lib/booking/data/fairy-catalog.json";

const AVATAR_COLORS = ["#CE6B69", "#DE908D", "#9A4140", "#524E48", "#B97C78", "#7C4A48", "#C98A6D", "#8C5A57"];
const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const LEAD_MINUTES = 60;
const MAX_ADVANCE_DAYS = 45;

/* ── raw byChronos public shapes ──────────────────────────────────────────── */

interface RawResource {
  id: number;
  name: string;
  resourceable_id: number;
  resourceable_type: string;
  status: number;
}
interface RawService {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: number; // already in cents
  category_id: number;
  sort_order: number;
  status: number;
  pos_only?: number;
  resources?: RawResource[];
}
interface RawCategory {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_package: number;
  status: number;
  services: RawService[];
}
interface RawLocation {
  id: number;
  timezone: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}
interface RawSlotDay {
  date: string; // YYYY-MM-DD (salon tz)
  time_slots: number[]; // seconds past midnight, salon tz
  closed: boolean;
}

/* ── timezone helpers (native Intl only) ──────────────────────────────────── */

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
function salonSecondsToUtc(dateISO: string, secondsPastMidnight: number, tz: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const wallUTC = Date.UTC(y, m - 1, d, 0, 0, secondsPastMidnight);
  let utc = wallUTC;
  for (let i = 0; i < 2; i++) utc = wallUTC - tzOffsetMinutes(new Date(utc), tz) * 60_000;
  return new Date(utc);
}
function salonDateOf(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instant);
}
function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/* ── local capture store (for non-write mode) ─────────────────────────────── */

const store = globalThis as unknown as { __publicBookings?: Map<string, Booking> };
const CAPTURED: Map<string, Booking> = store.__publicBookings ?? new Map();
store.__publicBookings = CAPTURED;

/* ── provider ─────────────────────────────────────────────────────────────── */

export class ByChronosPublicProvider implements BookingProvider {
  private client: ByChronosPublicClient;
  private catalogCache: { at: number; cats: RawCategory[] } | null = null;
  private tz = "America/Chicago";
  private tzLoaded = false;
  private readonly allowWrite = process.env.BYCHRONOS_ALLOW_WRITE === "true";

  constructor() {
    this.client = new ByChronosPublicClient(readPublicConfig());
  }

  private async catalog(): Promise<RawCategory[]> {
    if (this.catalogCache && Date.now() - this.catalogCache.at < 5 * 60_000) {
      return this.catalogCache.cats;
    }
    let cats: RawCategory[];
    try {
      const res = await this.client.get<RawCategory[] | { data: RawCategory[] }>("/service-categories");
      cats = Array.isArray(res) ? res : res.data;
    } catch {
      // Offline / API hiccup: fall back to the catalog snapshot bundled at build.
      cats = fallbackCatalog as unknown as RawCategory[];
    }
    this.catalogCache = { at: Date.now(), cats };
    return cats;
  }

  private async timezone(): Promise<string> {
    if (this.tzLoaded) return this.tz;
    try {
      const loc = await this.client.get<RawLocation | { data: RawLocation }>("/location");
      const l = "data" in loc ? loc.data : loc;
      if (l?.timezone) this.tz = l.timezone;
    } catch {
      /* keep default */
    }
    this.tzLoaded = true;
    return this.tz;
  }

  async getCategories(): Promise<ServiceCategory[]> {
    const cats = await this.catalog();
    return cats
      .filter((c) => c.status === 1 && !c.is_package)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({ id: String(c.id), name: c.name, description: c.description ?? "" }));
  }

  async getServices(): Promise<Service[]> {
    const cats = await this.catalog();
    const out: Service[] = [];
    for (const c of cats) {
      if (c.status !== 1 || c.is_package) continue;
      for (const s of (c.services ?? []).sort((a, b) => a.sort_order - b.sort_order)) {
        if (s.status !== 1 || s.pos_only) continue;
        out.push({
          id: String(s.id),
          categoryId: String(c.id),
          name: s.name.trim(),
          description: (s.description ?? "").trim(),
          durationMinutes: Math.round(s.duration),
          priceCents: Math.round(s.price), // byChronos already returns cents
        });
      }
    }
    return out;
  }

  async getStaff(): Promise<Staff[]> {
    // The ONLINE-BOOKABLE techs come from /resources (their `id` is the value the
    // availability + appointment endpoints expect as resource_id). This is a
    // smaller, different set than the resources embedded in the service catalog —
    // using the catalog ids makes per-tech availability come back empty.
    let rows: RawResource[];
    try {
      const res = await this.client.get<RawResource[] | { data: RawResource[] }>("/resources");
      rows = Array.isArray(res) ? res : res.data ?? [];
    } catch {
      return [];
    }
    // Every bookable tech can be offered; real per-service/day filtering happens
    // when we ask the availability endpoint, so serviceIds is left permissive.
    const allServiceIds = (await this.getServices()).map((s) => s.id);
    let i = 0;
    return rows
      .filter((r) => r.resourceable_type === "person" && r.status === 1)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r) => ({
        id: String(r.id),
        name: titleCase(r.name),
        role: "Nail Technician",
        bio: "",
        avatarColor: AVATAR_COLORS[i++ % AVATAR_COLORS.length],
        serviceIds: allServiceIds,
        workDays: [0, 1, 2, 3, 4, 5, 6], // availability comes from the live endpoint
      }));
  }

  async getAvailability(
    dateISO: string,
    serviceIds: string[],
    staffId: StaffSelection,
  ): Promise<TimeSlot[]> {
    if (!DATE_ISO_RE.test(dateISO) || serviceIds.length === 0) return [];
    const tz = await this.timezone();
    const now = new Date();
    const today = salonDateOf(now, tz);
    if (dateISO < today || dateISO > addDays(today, MAX_ADVANCE_DAYS)) return [];

    const resourceId = staffId !== "any" ? Number(staffId) : undefined;
    const guests = [
      {
        services: serviceIds.map((id) => ({
          service_id: Number(id),
          ...(resourceId ? { resource_id: resourceId } : {}),
        })),
      },
    ];
    const from = Math.floor(salonSecondsToUtc(dateISO, 0, tz).getTime() / 1000);
    const to = Math.floor(salonSecondsToUtc(addDays(dateISO, 1), 0, tz).getTime() / 1000);

    let days: RawSlotDay[];
    try {
      days = await this.client.post<RawSlotDay[]>("/timeslots-availability", {
        appointmentIds: [],
        guests,
        from,
        to,
      });
    } catch {
      return [];
    }
    const day = days.find((d) => d.date === dateISO);
    if (!day || day.closed) return [];

    const earliest = now.getTime() + LEAD_MINUTES * 60_000;
    const slots: TimeSlot[] = [];
    for (const secs of day.time_slots) {
      const start = salonSecondsToUtc(dateISO, secs, tz);
      if (start.getTime() < earliest) continue;
      slots.push({ startISO: start.toISOString(), staffId: staffId === "any" ? "any" : String(staffId) });
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

    const totalCents = chosen.reduce((sum, s) => sum + s.priceCents, 0);
    const totalDurationMinutes = chosen.reduce((sum, s) => sum + s.durationMinutes, 0);
    const resourceId = req.staffId !== "any" ? Number(req.staffId) : undefined;

    const base: Booking = {
      id: `bk_${start.getTime().toString(36)}_${req.serviceIds.join("-").slice(0, 12)}`,
      serviceIds: [...req.serviceIds],
      staffId: req.staffId,
      startISO: start.toISOString(),
      customer: { ...req.customer },
      status: "pending_sync",
      createdAtISO: new Date().toISOString(),
      totalCents,
      totalDurationMinutes,
      syncedToPos: false,
    };

    if (!this.allowWrite) {
      // Safe default: capture locally so we never create a real appointment in
      // the live salon during demos/tests. Set BYCHRONOS_ALLOW_WRITE=true to push.
      CAPTURED.set(base.id, base);
      return base;
    }

    // VERIFY-AGAINST-LIVE: the exact /appointments payload (and whether it needs
    // a verified-customer token) can only be confirmed with a real test booking.
    // This mirrors the fields the official booking page sends.
    const payload = {
      location_url: readPublicConfig().locationUrl,
      start_datetime: Math.floor(start.getTime() / 1000),
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      note: req.customer.notes || undefined,
      guests: [
        {
          services: req.serviceIds.map((id) => ({
            service_id: Number(id),
            ...(resourceId ? { resource_id: resourceId } : {}),
          })),
        },
      ],
    };
    const created = await this.client.post<{ id: number | string }>("/appointments", payload);
    return { ...base, id: String(created.id), status: "synced", syncedToPos: true };
  }

  async getBooking(id: string): Promise<Booking | null> {
    return CAPTURED.get(id) ?? null;
  }

  async listBookings(dateISO?: string): Promise<Booking[]> {
    const tz = await this.timezone();
    return [...CAPTURED.values()]
      .filter((b) => !dateISO || salonDateOf(new Date(b.startISO), tz) === dateISO)
      .sort((a, b) => a.startISO.localeCompare(b.startISO));
  }
}

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}
