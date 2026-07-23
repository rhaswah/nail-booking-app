import { type NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/booking/provider";
import { isNonEmptyString, jsonError, jsonServerError } from "../../_lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/[id] — one booking (confirmation page). 404 if not found.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!isNonEmptyString(id)) {
    return jsonError("Booking id is required.", 400);
  }

  try {
    const booking = await getProvider().getBooking(id.trim());
    if (!booking) return jsonError("Booking not found.", 404);
    return NextResponse.json(booking);
  } catch (err) {
    return jsonServerError(err);
  }
}
