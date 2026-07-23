import { salonConfig } from "@/lib/salon.config";

/**
 * Display formatters — all timezone-aware (salon timezone), native Intl only.
 * Pair money/duration output with the `tabular-nums` class in UI.
 */

const TZ = salonConfig.timezone;

const wholeMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const centsMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 2800 → "$28"; 2850 → "$28.50". */
export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return cents % 100 === 0 ? wholeMoney.format(dollars) : centsMoney.format(dollars);
}

/** 30 → "30 min"; 60 → "1 hr"; 75 → "1 hr 15 min". */
export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

const slotTime = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
});

/** UTC instant ISO → "9:30 AM" in the salon timezone. */
export function formatSlotTime(startISO: string): string {
  return slotTime.format(new Date(startISO));
}

const dateLabelSalonTz = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const dateLabelUTC = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  month: "short",
  day: "numeric",
});

const PLAIN_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * "2026-07-28" or a full ISO instant → "Tue, Jul 28".
 * Plain dates are treated as salon-local calendar dates (no timezone shift).
 */
export function formatDateLabel(iso: string): string {
  if (PLAIN_DATE_RE.test(iso)) {
    return dateLabelUTC.format(new Date(`${iso}T12:00:00Z`));
  }
  return dateLabelSalonTz.format(new Date(iso));
}

const isoDateInTz = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" for the given instant (default: now) in the salon timezone. */
export function salonDateISO(date: Date = new Date()): string {
  return isoDateInTz.format(date);
}

/** Add whole days to a plain "YYYY-MM-DD" date string. */
export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
