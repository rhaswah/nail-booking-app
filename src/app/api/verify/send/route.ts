import { type NextRequest, NextResponse } from "next/server";
import { sendVerificationCode, BookingApiError } from "@/lib/booking/bychronos-booking";
import { encodeSessionCookie, SESSION_COOKIE, sessionCookieOptions } from "@/lib/booking/session-cookie";
import { isNonEmptyString, jsonError } from "../../_lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/verify/send  { phone }
 * Asks byChronos to text a verification code to the customer, and stashes the
 * resulting guest session in an HttpOnly cookie for the follow-up steps.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }
  const phone = (body as { phone?: unknown }).phone;
  if (!isNonEmptyString(phone) || phone.replace(/\D/g, "").length < 7) {
    return jsonError("Please enter a valid phone number.", 400);
  }

  try {
    const session = await sendVerificationCode(phone.trim());
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, encodeSessionCookie(session), sessionCookieOptions);
    return res;
  } catch (err) {
    const status = err instanceof BookingApiError ? err.status : 502;
    const message =
      err instanceof Error ? err.message : "Couldn't send a code right now — please try again.";
    return jsonError(message, status >= 400 && status < 500 ? status : 502);
  }
}
