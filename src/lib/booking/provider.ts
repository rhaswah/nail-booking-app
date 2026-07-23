import type {
  Booking,
  BookingRequest,
  Service,
  ServiceCategory,
  Staff,
  StaffSelection,
  TimeSlot,
} from "@/lib/booking/types";
import { MockProvider } from "@/lib/booking/mock-provider";

/**
 * Abstraction every data source implements. The app only ever talks to a
 * BookingProvider — swapping mock data for the byChronos POS is a config change.
 */
export interface BookingProvider {
  getCategories(): Promise<ServiceCategory[]>;
  getServices(): Promise<Service[]>;
  getStaff(): Promise<Staff[]>;
  /**
   * Free start times on `dateISO` ("YYYY-MM-DD", salon timezone) for the given
   * services. With `staffId: 'any'` returns one slot per start time with an
   * assigned tech; with a concrete id returns that tech's openings only.
   */
  getAvailability(
    dateISO: string,
    serviceIds: string[],
    staffId: StaffSelection,
  ): Promise<TimeSlot[]>;
  /** Validates the slot is still free, then stores the booking. Throws Error with a user-safe message otherwise. */
  createBooking(req: BookingRequest): Promise<Booking>;
  getBooking(id: string): Promise<Booking | null>;
  /** All bookings, or only those on `dateISO` (salon timezone) when given. */
  listBookings(dateISO?: string): Promise<Booking[]>;
}

let instance: BookingProvider | null = null;

/**
 * Provider factory. Controlled by `BOOKING_PROVIDER` env var:
 *   - 'mock' (default): in-memory seed data, dev-server persistent.
 *   - 'bychronos': byChronos POS connector (not configured yet — throws).
 */
export function getProvider(): BookingProvider {
  if (instance) return instance;
  const kind = process.env.BOOKING_PROVIDER ?? "mock";
  switch (kind) {
    case "mock":
      instance = new MockProvider();
      return instance;
    case "bychronos":
      throw new Error(
        "byChronos provider is not configured yet — set BOOKING_PROVIDER=mock or add the byChronos connector.",
      );
    default:
      throw new Error(`Unknown BOOKING_PROVIDER: "${kind}"`);
  }
}
