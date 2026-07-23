/**
 * Shared domain types for the booking system.
 * All money is integer cents; all durations are integer minutes.
 * All `*ISO` instants are full ISO-8601 UTC strings (e.g. "2026-07-28T16:30:00.000Z");
 * plain dates (`dateISO` params) are "YYYY-MM-DD" in the salon's timezone.
 */

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  /** Highlight in UI ("Popular" chip). */
  popular?: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** Hex color used for the avatar circle behind the initials. */
  avatarColor: string;
  /** Services this tech performs. */
  serviceIds: string[];
  /** Weekdays this tech works — JS convention, 0 = Sunday … 6 = Saturday. */
  workDays: number[];
}

/** One bookable start time for a specific tech. */
export interface TimeSlot {
  /** UTC instant of the slot start (display via formatters in salon tz). */
  startISO: string;
  staffId: string;
}

export interface BookingCustomer {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes?: string;
}

/** Special staff selector meaning "no preference". */
export const ANY_STAFF = "any" as const;
export type StaffSelection = string | typeof ANY_STAFF;

export interface BookingRequest {
  serviceIds: string[];
  /** A concrete staff id, or 'any' to let the salon assign one. */
  staffId: StaffSelection;
  /** UTC instant of the appointment start. */
  startISO: string;
  customer: BookingCustomer;
}

export type BookingStatus = "confirmed" | "pending_sync" | "synced" | "cancelled";

export interface Booking extends BookingRequest {
  id: string;
  status: BookingStatus;
  createdAtISO: string;
  totalCents: number;
  totalDurationMinutes: number;
  /** True once the byChronos POS connector has picked this booking up. */
  syncedToPos: boolean;
}
