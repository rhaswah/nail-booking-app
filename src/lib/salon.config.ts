/**
 * Salon configuration — single source of truth for identity + scheduling rules.
 *
 * NOTE: `name`, `tagline`, `phone`, and `address` are PLACEHOLDERS until the
 * byChronos POS connector is configured; once connected these fields should be
 * hydrated from the POS account instead.
 */

/** JS `Date.getDay()` convention: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Opening window for one day, 24h "HH:MM" local salon time. */
export interface DayHours {
  open: string;
  close: string;
}

export interface SalonConfig {
  name: string;
  tagline: string;
  phone: string;
  address: string;
  /** IANA timezone all scheduling math is done in. */
  timezone: string;
  /** `null` = closed that day. Keyed by JS weekday (0 = Sun). */
  openingHours: Record<Weekday, DayHours | null>;
  /** Granularity of bookable start times, in minutes. */
  slotIntervalMinutes: number;
  /** Earliest bookable slot is now + this many minutes. */
  bookingLeadTimeMinutes: number;
  /** Customers can book at most this many days ahead. */
  maxAdvanceDays: number;
}

export const salonConfig: SalonConfig = {
  // ── Fairy Nail Spa (real byChronos location, id 5539) ─────────────────
  // Identity from the live byChronos /location endpoint. Live availability is
  // pulled from byChronos; the hours below are only used by the offline `mock`
  // provider and for display fallbacks.
  name: "Fairy Nail Spa",
  tagline: "Chicago's home for nails, done beautifully.",
  phone: "(312) 752-9888",
  address: "3418 N Sheffield Ave, Chicago, IL 60657",
  // ── Scheduling rules ──────────────────────────────────────────────────
  timezone: "America/Chicago",
  openingHours: {
    0: { open: "10:00", close: "19:00" }, // Sunday
    1: { open: "10:00", close: "19:30" }, // Monday
    2: { open: "10:00", close: "19:30" }, // Tuesday
    3: { open: "10:00", close: "19:30" }, // Wednesday
    4: { open: "10:00", close: "19:30" }, // Thursday
    5: { open: "10:00", close: "19:30" }, // Friday
    6: { open: "10:00", close: "19:30" }, // Saturday
  },
  slotIntervalMinutes: 15,
  bookingLeadTimeMinutes: 60,
  maxAdvanceDays: 45,
};
