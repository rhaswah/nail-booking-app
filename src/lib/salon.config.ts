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
  // ── Placeholder identity (replace via byChronos connect) ──────────────
  name: "Lume Nail Studio",
  tagline: "Hands & feet, beautifully kept.",
  phone: "(310) 555-0148",
  address: "2214 Abbot Kinney Blvd, Venice, CA 90291",
  // ── Scheduling rules ──────────────────────────────────────────────────
  timezone: "America/Los_Angeles",
  openingHours: {
    0: { open: "10:00", close: "17:00" }, // Sunday
    1: null, //                              Monday — closed
    2: { open: "09:30", close: "19:00" }, // Tuesday
    3: { open: "09:30", close: "19:00" }, // Wednesday
    4: { open: "09:30", close: "19:00" }, // Thursday
    5: { open: "09:30", close: "19:00" }, // Friday
    6: { open: "09:30", close: "19:00" }, // Saturday
  },
  slotIntervalMinutes: 15,
  bookingLeadTimeMinutes: 60,
  maxAdvanceDays: 30,
};
