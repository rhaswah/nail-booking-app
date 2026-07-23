import { salonConfig, type Weekday } from "@/lib/salon.config";
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

/* ────────────────────────────────────────────────────────────────────────────
 * Seed data — realistic nail-salon catalog. Replaced by byChronos data later.
 * ──────────────────────────────────────────────────────────────────────────── */

const CATEGORIES: ServiceCategory[] = [
  {
    id: "manicures",
    name: "Manicures",
    description: "Classic care for hands — shape, cuticles, massage, polish.",
  },
  {
    id: "pedicures",
    name: "Pedicures",
    description: "Soak, exfoliate, and polish — from quick classic to full spa.",
  },
  {
    id: "gel",
    name: "Gel & Shellac",
    description: "Chip-free, high-shine color cured under LED. Lasts 2–3 weeks.",
  },
  {
    id: "extensions",
    name: "Extensions & Acrylics",
    description: "Length and strength — acrylic, dip powder, fills, and removals.",
  },
  {
    id: "addons",
    name: "Add-Ons",
    description: "Finishing touches to pair with any service.",
  },
];

const SERVICES: Service[] = [
  // Manicures
  { id: "classic-manicure", categoryId: "manicures", name: "Classic Manicure", description: "Shape, cuticle care, hand massage, and regular polish.", durationMinutes: 30, priceCents: 2800, popular: true },
  { id: "french-manicure", categoryId: "manicures", name: "French Manicure", description: "Classic manicure finished with a crisp French tip.", durationMinutes: 40, priceCents: 3500 },
  { id: "spa-manicure", categoryId: "manicures", name: "Spa Manicure", description: "Classic manicure plus sugar scrub, mask, and extended massage.", durationMinutes: 45, priceCents: 4000 },
  { id: "mens-manicure", categoryId: "manicures", name: "Men's Manicure", description: "Clean-up, shape, cuticle care, and buff — no polish.", durationMinutes: 30, priceCents: 2500 },
  // Pedicures
  { id: "classic-pedicure", categoryId: "pedicures", name: "Classic Pedicure", description: "Soak, nail and cuticle care, light callus work, and polish.", durationMinutes: 45, priceCents: 4500 },
  { id: "spa-pedicure", categoryId: "pedicures", name: "Spa Pedicure", description: "Classic pedicure plus sugar scrub, hydrating mask, and hot towels.", durationMinutes: 60, priceCents: 6500, popular: true },
  { id: "deluxe-pedicure", categoryId: "pedicures", name: "Deluxe Hot Stone Pedicure", description: "Our most indulgent pedicure with hot stone massage and paraffin.", durationMinutes: 75, priceCents: 8000 },
  { id: "mens-pedicure", categoryId: "pedicures", name: "Men's Pedicure", description: "Soak, trim, callus smoothing, and buff finish.", durationMinutes: 45, priceCents: 4200 },
  // Gel & Shellac
  { id: "gel-manicure", categoryId: "gel", name: "Gel Manicure", description: "Manicure with long-wear gel color cured under LED.", durationMinutes: 45, priceCents: 4800, popular: true },
  { id: "gel-french", categoryId: "gel", name: "Gel French Manicure", description: "Gel manicure with a hand-painted French tip.", durationMinutes: 55, priceCents: 5500 },
  { id: "gel-pedicure", categoryId: "gel", name: "Gel Pedicure", description: "Classic pedicure finished with chip-free gel color.", durationMinutes: 60, priceCents: 6000 },
  { id: "gel-removal", categoryId: "gel", name: "Gel Removal", description: "Gentle soak-off of existing gel with nail conditioning.", durationMinutes: 15, priceCents: 1200 },
  // Extensions & Acrylics
  { id: "full-set-acrylic", categoryId: "extensions", name: "Full Set Acrylic", description: "Sculpted acrylic full set, shaped to your pick, with polish.", durationMinutes: 90, priceCents: 8500, popular: true },
  { id: "acrylic-fill", categoryId: "extensions", name: "Acrylic Fill", description: "Fill-in for grown-out acrylics, rebalanced and re-polished.", durationMinutes: 60, priceCents: 5500 },
  { id: "dip-powder-set", categoryId: "extensions", name: "Dip Powder Set", description: "Lightweight, durable dip powder color on natural nails.", durationMinutes: 60, priceCents: 5500 },
  { id: "acrylic-removal", categoryId: "extensions", name: "Acrylic Removal", description: "Safe removal of acrylics or dip with conditioning treatment.", durationMinutes: 30, priceCents: 2000 },
  // Add-Ons
  { id: "nail-art", categoryId: "addons", name: "Nail Art (per nail)", description: "Hand-painted accent art — chrome, foil, florals, and more.", durationMinutes: 15, priceCents: 800, popular: true },
  { id: "paraffin-hand", categoryId: "addons", name: "Paraffin Hand Treatment", description: "Warm paraffin dip for deep hydration and soft hands.", durationMinutes: 15, priceCents: 1500 },
  { id: "callus-treatment", categoryId: "addons", name: "Callus Treatment", description: "Intensive callus softening and smoothing add-on.", durationMinutes: 15, priceCents: 1200 },
  { id: "polish-change", categoryId: "addons", name: "Polish Change", description: "Fresh regular-polish color, hands or feet — no nail prep.", durationMinutes: 15, priceCents: 1500 },
];

const ids = (...categoryIds: string[]): string[] =>
  SERVICES.filter((s) => categoryIds.includes(s.categoryId)).map((s) => s.id);

const STAFF: Staff[] = [
  {
    id: "mia",
    name: "Mia Tran",
    role: "Senior Nail Artist",
    bio: "Acrylic sculpting and intricate nail art are Mia's signature — 9 years behind the table.",
    avatarColor: "#CE6B69",
    serviceIds: [...ids("extensions", "gel"), "nail-art", "polish-change", "classic-manicure", "french-manicure"],
    workDays: [2, 3, 4, 5, 6], // Tue–Sat
  },
  {
    id: "lena",
    name: "Lena Park",
    role: "Nail Technician",
    bio: "Precise, gentle, and fast — Lena is the go-to for flawless gel manicures.",
    avatarColor: "#DE908D",
    serviceIds: [...ids("manicures"), "gel-manicure", "gel-french", "gel-removal", "nail-art", "paraffin-hand", "polish-change"],
    workDays: [0, 2, 3, 4, 5], // Sun, Tue–Fri
  },
  {
    id: "sofia",
    name: "Sofia Reyes",
    role: "Pedicure Specialist",
    bio: "Spa pedicures and foot care with a therapist's touch. Ask for the hot stones.",
    avatarColor: "#9A4140",
    serviceIds: [...ids("pedicures"), "gel-pedicure", "callus-treatment", "paraffin-hand", "polish-change"],
    workDays: [0, 3, 4, 5, 6], // Sun, Wed–Sat
  },
  {
    id: "anh",
    name: "Anh Nguyen",
    role: "Owner & Master Technician",
    bio: "Founder of Lume. 15+ years of everything nails — if it can be done, Anh does it.",
    avatarColor: "#524E48",
    serviceIds: SERVICES.map((s) => s.id),
    workDays: [0, 2, 4, 6], // Sun, Tue, Thu, Sat
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Timezone helpers (native Intl only — no libraries).
 * ──────────────────────────────────────────────────────────────────────────── */

const TZ = salonConfig.timezone;

/** Minutes the given timezone is ahead of UTC at `utcDate` (negative for LA). */
function tzOffsetMinutes(utcDate: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(utcDate)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - utcDate.getTime()) / 60_000;
}

/** Convert salon-local wall time (dateISO "YYYY-MM-DD" + minutes past midnight) to a UTC Date. */
function salonTimeToUtc(dateISO: string, minutesPastMidnight: number): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const wallUTC = Date.UTC(y, m - 1, d, 0, minutesPastMidnight);
  let utc = wallUTC;
  // Two passes converge across DST transitions.
  for (let i = 0; i < 2; i++) {
    utc = wallUTC - tzOffsetMinutes(new Date(utc), TZ) * 60_000;
  }
  return new Date(utc);
}

/** "YYYY-MM-DD" in the salon timezone for a given instant. */
function salonDateOf(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Weekday (0=Sun) of a plain "YYYY-MM-DD" — timezone-independent for a plain date. */
function weekdayOf(dateISO: string): Weekday {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as Weekday;
}

function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ────────────────────────────────────────────────────────────────────────────
 * In-memory store — kept on globalThis so state survives Next.js dev-server
 * module reloads. The byChronos connector will later drain `pending_sync` rows.
 * ──────────────────────────────────────────────────────────────────────────── */

const store = globalThis as unknown as { __lumeBookings?: Map<string, Booking> };
const BOOKINGS: Map<string, Booking> = store.__lumeBookings ?? new Map();
store.__lumeBookings = BOOKINGS;

/* ────────────────────────────────────────────────────────────────────────────
 * Provider
 * ──────────────────────────────────────────────────────────────────────────── */

export class MockProvider implements BookingProvider {
  async getCategories(): Promise<ServiceCategory[]> {
    return CATEGORIES;
  }

  async getServices(): Promise<Service[]> {
    return SERVICES;
  }

  async getStaff(): Promise<Staff[]> {
    return STAFF;
  }

  async getAvailability(
    dateISO: string,
    serviceIds: string[],
    staffId: StaffSelection,
  ): Promise<TimeSlot[]> {
    if (!DATE_ISO_RE.test(dateISO) || serviceIds.length === 0) return [];

    const services = serviceIds.map((id) => SERVICES.find((s) => s.id === id));
    if (services.some((s) => !s)) return [];
    const totalDuration = services.reduce((sum, s) => sum + (s?.durationMinutes ?? 0), 0);

    // Window: today … today + maxAdvanceDays (salon timezone).
    const now = new Date();
    const today = salonDateOf(now);
    if (dateISO < today || dateISO > addDays(today, salonConfig.maxAdvanceDays)) return [];

    // Salon hours for that weekday.
    const weekday = weekdayOf(dateISO);
    const hours = salonConfig.openingHours[weekday];
    if (!hours) return [];

    // Eligible techs: perform ALL requested services and work that weekday.
    const eligible = STAFF.filter(
      (t) =>
        (staffId === "any" || t.id === staffId) &&
        t.workDays.includes(weekday) &&
        serviceIds.every((id) => t.serviceIds.includes(id)),
    );
    if (eligible.length === 0) return [];

    const openMin = parseHHMM(hours.open);
    const lastStartMin = parseHHMM(hours.close) - totalDuration;
    const earliestAllowed = now.getTime() + salonConfig.bookingLeadTimeMinutes * 60_000;

    const slots: TimeSlot[] = [];
    for (let m = openMin; m <= lastStartMin; m += salonConfig.slotIntervalMinutes) {
      const start = salonTimeToUtc(dateISO, m);
      if (start.getTime() < earliestAllowed) continue; // lead time + never in the past
      const end = start.getTime() + totalDuration * 60_000;

      const freeTech = eligible.find((t) => this.isStaffFree(t.id, start.getTime(), end));
      if (freeTech) {
        // For 'any' this dedupes to one slot per start time with an assigned tech.
        slots.push({ startISO: start.toISOString(), staffId: freeTech.id });
      }
    }
    return slots;
  }

  async createBooking(req: BookingRequest): Promise<Booking> {
    if (req.serviceIds.length === 0) throw new Error("Select at least one service.");
    const services = req.serviceIds.map((id) => {
      const svc = SERVICES.find((s) => s.id === id);
      if (!svc) throw new Error(`Unknown service: ${id}`);
      return svc;
    });
    const { firstName, lastName, phone, email } = req.customer;
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !email?.trim()) {
      throw new Error("Please fill in your name, phone, and email.");
    }

    const start = new Date(req.startISO);
    if (Number.isNaN(start.getTime())) throw new Error("Invalid appointment time.");
    const startISO = start.toISOString();

    // Re-derive availability for that day; the requested instant must still be free.
    // This enforces salon hours, lead time, advance window, and conflicts in one place.
    const dateISO = salonDateOf(start);
    const openSlots = await this.getAvailability(dateISO, req.serviceIds, req.staffId);
    const slot = openSlots.find((s) => s.startISO === startISO);
    if (!slot) {
      throw new Error("That time is no longer available — please pick another slot.");
    }

    const booking: Booking = {
      id: `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      serviceIds: [...req.serviceIds],
      staffId: slot.staffId, // concrete tech, even when requested as 'any'
      startISO,
      customer: { ...req.customer },
      status: "pending_sync", // byChronos connector flips this to 'synced'
      createdAtISO: new Date().toISOString(),
      totalCents: services.reduce((sum, s) => sum + s.priceCents, 0),
      totalDurationMinutes: services.reduce((sum, s) => sum + s.durationMinutes, 0),
      syncedToPos: false,
    };
    BOOKINGS.set(booking.id, booking);
    return { ...booking, customer: { ...booking.customer }, serviceIds: [...booking.serviceIds] };
  }

  async getBooking(id: string): Promise<Booking | null> {
    const b = BOOKINGS.get(id);
    return b ? { ...b, customer: { ...b.customer }, serviceIds: [...b.serviceIds] } : null;
  }

  async listBookings(dateISO?: string): Promise<Booking[]> {
    const all = [...BOOKINGS.values()]
      .filter((b) => !dateISO || salonDateOf(new Date(b.startISO)) === dateISO)
      .sort((a, b) => a.startISO.localeCompare(b.startISO));
    return all.map((b) => ({ ...b, customer: { ...b.customer }, serviceIds: [...b.serviceIds] }));
  }

  /** True when `staffId` has no active booking overlapping [startMs, endMs). */
  private isStaffFree(staffId: string, startMs: number, endMs: number): boolean {
    for (const b of BOOKINGS.values()) {
      if (b.staffId !== staffId || b.status === "cancelled") continue;
      const bStart = new Date(b.startISO).getTime();
      const bEnd = bStart + b.totalDurationMinutes * 60_000;
      if (startMs < bEnd && endMs > bStart) return false;
    }
    return true;
  }
}
