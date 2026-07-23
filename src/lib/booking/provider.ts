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
import { ByChronosProvider } from "@/lib/booking/bychronos-provider";
import { ByChronosPublicProvider } from "@/lib/booking/bychronos-public-provider";

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
 *   - 'bychronos-public' (default): live public byChronos booking API — the
 *     salon's real catalog/techs/availability, no credentials. Reads live;
 *     writes gated by BYCHRONOS_ALLOW_WRITE.
 *   - 'mock': in-memory sample data, dev-server persistent (no network).
 *   - 'bychronos': merchant Go3 Schedule API connector (needs BYCHRONOS_* OAuth).
 */
export function getProvider(): BookingProvider {
  if (instance) return instance;
  const kind = process.env.BOOKING_PROVIDER ?? "bychronos-public";
  switch (kind) {
    case "bychronos-public":
      instance = new ByChronosPublicProvider();
      return instance;
    case "mock":
      instance = new MockProvider();
      return instance;
    case "bychronos":
      instance = new ByChronosProvider();
      return instance;
    default:
      throw new Error(`Unknown BOOKING_PROVIDER: "${kind}"`);
  }
}
