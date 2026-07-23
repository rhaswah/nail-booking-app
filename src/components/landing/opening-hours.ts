import type { DayHours } from "@/lib/salon.config";

/**
 * Wall-clock formatting for opening hours ("HH:MM" strings from salonConfig).
 * These are plain salon-local times — no timezone math involved, so they are
 * formatted directly rather than via the instant-based helpers in @/lib/format.
 */

/** "09:30" → "9:30 AM"; "19:00" → "7 PM". */
export function formatWallTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** { open: "09:30", close: "19:00" } → "9:30 AM – 7 PM". */
export function formatDayHours(hours: DayHours): string {
  return `${formatWallTime(hours.open)} – ${formatWallTime(hours.close)}`;
}
