/**
 * byChronos phone-verified booking flow (Option B).
 *
 * Creates real appointments in the salon's byChronos calendar WITHOUT the salon's
 * login. It replays exactly what the official booking page does:
 *   1. GET  /sanctum/csrf-cookie          (start a guest session)
 *   2. POST /auth/verification/send {phone}   → byChronos TEXTS the customer a code
 *   3. POST /auth/verification/check {phone,code}  → verify the code
 *   4. POST /auth/account/register {...}      → create the customer (if new)
 *   5. POST /appointments {...}               → book, under the guest session
 *
 * The SMS is sent by byChronos's own (A2P-registered) system — we only trigger it,
 * so the salon needs no A2P registration of its own for these codes.
 *
 * The byChronos guest session lives in cookies (their API uses withCredentials).
 * We keep it out of the browser by serialising it into an HttpOnly cookie on OUR
 * domain (see api/verify routes), so nothing sensitive is exposed and no shared
 * server memory is needed across serverless instances.
 *
 * NOTE — VERIFY-AGAINST-LIVE: the check/register/appointment response shapes and
 * the exact "is this a new account?" signal can only be pinned down with one real
 * test booking (a real texted code). Branch points are marked below.
 */

import { readPublicConfig, type PublicConfig } from "@/lib/booking/bychronos-public";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export interface SerializedSession {
  cookies: Record<string, string>;
  xsrf: string;
}

export class BookingApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

/** A per-customer byChronos guest session (cookie jar + CSRF token). */
export class ByChronosBookingSession {
  private cookies = new Map<string, string>();
  private xsrf = "";

  constructor(private cfg: PublicConfig) {}

  static async start(cfg = readPublicConfig()): Promise<ByChronosBookingSession> {
    const s = new ByChronosBookingSession(cfg);
    const res = await fetch(`${cfg.siteOrigin}/sanctum/csrf-cookie`, {
      headers: s.baseHeaders(),
      cache: "no-store",
    });
    s.absorb(res);
    if (!s.xsrf) throw new BookingApiError(502, "Could not start a byChronos session.");
    return s;
  }

  static restore(data: SerializedSession, cfg = readPublicConfig()): ByChronosBookingSession {
    const s = new ByChronosBookingSession(cfg);
    s.cookies = new Map(Object.entries(data.cookies ?? {}));
    s.xsrf = data.xsrf ?? "";
    return s;
  }

  serialize(): SerializedSession {
    return { cookies: Object.fromEntries(this.cookies), xsrf: this.xsrf };
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.cfg.apiBase}${path}`, {
      method: "POST",
      headers: {
        ...this.baseHeaders(),
        "Content-Type": "application/json",
        Cookie: this.cookieHeader(),
        "X-XSRF-TOKEN": this.xsrf,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    this.absorb(res);
    const data = (await res.json().catch(() => null)) as T;
    if (!res.ok) {
      throw new BookingApiError(res.status, messageFrom(data, res.status), data);
    }
    return data;
  }

  private baseHeaders(): Record<string, string> {
    return {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      "X-Location-URL": this.cfg.locationUrl,
      "X-Requested-With": "XMLHttpRequest",
      Origin: this.cfg.siteOrigin,
      Referer: `${this.cfg.siteOrigin}/l/${this.cfg.locationUrl}/a/services`,
    };
  }

  private cookieHeader(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private absorb(res: Response): void {
    for (const raw of getSetCookies(res.headers)) {
      const pair = raw.split(";")[0];
      const eq = pair.indexOf("=");
      if (eq < 0) continue;
      const name = pair.slice(0, eq).trim();
      const val = pair.slice(eq + 1);
      if (!name) continue;
      this.cookies.set(name, val);
      if (name === "XSRF-TOKEN") this.xsrf = decodeURIComponent(val);
    }
  }
}

function getSetCookies(headers: Headers): string[] {
  const anyH = headers as unknown as { getSetCookie?: () => string[] };
  if (typeof anyH.getSetCookie === "function") return anyH.getSetCookie();
  const one = headers.get("set-cookie");
  return one ? [one] : [];
}

function messageFrom(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const d = data as { message?: string; error?: string };
    if (d.message) return d.message;
    if (d.error) return d.error;
  }
  return `byChronos request failed (${status})`;
}

/* ── flow steps ───────────────────────────────────────────────────────────── */

/** Step 2 — ask byChronos to text a verification code to `phone`. */
export async function sendVerificationCode(phone: string): Promise<SerializedSession> {
  const session = await ByChronosBookingSession.start();
  await session.post("/auth/verification/send", { phone });
  return session.serialize();
}

export interface VerifyInput {
  session: SerializedSession;
  phone: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Steps 3–4 — check the code and make sure a customer account exists. Returns the
 * updated (now authenticated) session to carry into the booking call.
 */
export async function verifyAndEnsureAccount(input: VerifyInput): Promise<SerializedSession> {
  const session = ByChronosBookingSession.restore(input.session);
  // Step 3: verify the texted code (throws BookingApiError on a wrong/expired code).
  await session.post("/auth/verification/check", { phone: input.phone, code: input.code });

  // Step 4: ensure the customer exists. Registration is idempotent-ish here — if
  // the account already exists byChronos returns a 4xx we can safely ignore, since
  // the verified session is what authorises the booking.
  // VERIFY-AGAINST-LIVE: confirm the exact register payload + "already exists" code.
  try {
    await session.post("/auth/account/register", {
      first_name: input.firstName,
      last_name: input.lastName,
      name: `${input.firstName} ${input.lastName}`.trim(),
      email: input.email,
      phone: input.phone,
    });
  } catch (err) {
    if (!(err instanceof BookingApiError) || err.status >= 500) throw err;
    // 4xx (e.g. already registered) — proceed on the verified session.
  }
  return session.serialize();
}

export interface CreateAppointmentInput {
  session: SerializedSession;
  serviceIds: string[];
  resourceId?: number; // omitted for "first available"
  startUnix: number; // seconds
  durationMinutes: number;
  timezone: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  note?: string;
}

/** Step 5 — create the appointment in the salon's byChronos calendar. Returns its id. */
export async function createVerifiedAppointment(
  input: CreateAppointmentInput,
): Promise<{ id: string }> {
  const session = ByChronosBookingSession.restore(input.session);
  const created = await session.post<{ id?: number | string }>("/appointments", {
    location_url: readPublicConfig().locationUrl,
    start_datetime: input.startUnix,
    duration: input.durationMinutes,
    timezone: input.timezone,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone_number: input.phone,
    note: input.note || undefined,
    guests: [
      {
        services: input.serviceIds.map((id) => ({
          service_id: Number(id),
          ...(input.resourceId ? { resource_id: input.resourceId } : {}),
        })),
      },
    ],
  });
  return { id: String(created.id ?? "") };
}
