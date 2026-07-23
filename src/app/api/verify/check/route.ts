import { type NextRequest, NextResponse } from "next/server";
import { verifyAndEnsureAccount, BookingApiError } from "@/lib/booking/bychronos-booking";
import {
  decodeSessionCookie,
  encodeSessionCookie,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/booking/session-cookie";
import { isNonEmptyString, jsonError } from "../../_lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/verify/check  { phone, code, firstName, lastName, email }
 * Verifies the texted code and ensures the customer account exists, then refreshes
 * the (now authenticated) session cookie so the booking call can use it.
 * A wrong/expired code returns 200 { verified: false, error } so the UI can retry.
 */
export async function POST(request: NextRequest) {
  const session = decodeSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return jsonError("Your verification session expired — please request a new code.", 440);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }
  const b = body as Record<string, unknown>;
  for (const f of ["phone", "code", "firstName", "lastName", "email"] as const) {
    if (!isNonEmptyString(b[f])) return jsonError(`"${f}" is required.`, 400);
  }

  try {
    const updated = await verifyAndEnsureAccount({
      session,
      phone: (b.phone as string).trim(),
      code: (b.code as string).trim(),
      firstName: (b.firstName as string).trim(),
      lastName: (b.lastName as string).trim(),
      email: (b.email as string).trim(),
    });
    const res = NextResponse.json({ verified: true });
    res.cookies.set(SESSION_COOKIE, encodeSessionCookie(updated), sessionCookieOptions);
    return res;
  } catch (err) {
    // A 4xx from byChronos here almost always means a wrong/expired code — surface
    // it as a retryable result rather than a hard error.
    if (err instanceof BookingApiError && err.status >= 400 && err.status < 500) {
      return NextResponse.json({
        verified: false,
        error: "That code didn't match. Double-check it or request a new one.",
      });
    }
    const message =
      err instanceof Error ? err.message : "Couldn't verify the code — please try again.";
    return jsonError(message, 502);
  }
}
