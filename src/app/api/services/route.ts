import { NextResponse } from "next/server";
import { getProvider } from "@/lib/booking/provider";
import { jsonServerError } from "../_lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/services
 * Full catalog for the booking flow: `{ categories, services, staff }`.
 */
export async function GET() {
  try {
    const provider = getProvider();
    const [categories, services, staff] = await Promise.all([
      provider.getCategories(),
      provider.getServices(),
      provider.getStaff(),
    ]);
    // When write-back is on, the wizard must collect a phone verification code.
    const requireVerification = process.env.BYCHRONOS_ALLOW_WRITE === "true";
    return NextResponse.json({ categories, services, staff, requireVerification });
  } catch (err) {
    return jsonServerError(err);
  }
}
