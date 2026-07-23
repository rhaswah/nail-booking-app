/**
 * byChronos PUBLIC booking API — the same backend that powers the official
 * customer booking page at go.bychronos.com/l/<location>/a/services.
 *
 * This is the consumer-facing API, so READS need no credentials: the location
 * is identified by its public slug via the `X-Location-URL` header. That means
 * the app shows the salon's REAL live catalog, techs, and open times with no
 * merchant login. State-changing POSTs (availability, appointments) require a
 * Laravel CSRF token, which we obtain with a lightweight handshake.
 *
 * Configure with BYCHRONOS_LOCATION_URL (the slug). Defaults target Fairy Nail
 * Spa (the salon this app was built for). Runs SERVER-SIDE ONLY.
 */

const DEFAULT_SITE = "https://go.bychronos.com";
const DEFAULT_LOCATION = "chicago-60657-fairy-nail-spa-805539";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export interface PublicConfig {
  siteOrigin: string; // https://go.bychronos.com
  apiBase: string; // https://go.bychronos.com/api
  locationUrl: string; // the public slug used as X-Location-URL
}

export function readPublicConfig(): PublicConfig {
  const siteOrigin = process.env.BYCHRONOS_SITE_ORIGIN || DEFAULT_SITE;
  return {
    siteOrigin,
    apiBase: process.env.BYCHRONOS_PUBLIC_BASE || `${siteOrigin}/api`,
    locationUrl: process.env.BYCHRONOS_LOCATION_URL || DEFAULT_LOCATION,
  };
}

interface Session {
  cookie: string; // serialized Cookie header
  xsrf: string; // decoded XSRF-TOKEN for the X-XSRF-TOKEN header
  fetchedAt: number;
}

// Cache the CSRF session on globalThis (survives dev reloads). ~20 min TTL.
const g = globalThis as unknown as { __bychronosPublicSession?: Session };
const SESSION_TTL_MS = 20 * 60_000;

export class ByChronosPublicClient {
  constructor(private cfg: PublicConfig) {}

  private baseHeaders(): Record<string, string> {
    return {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      "X-Location-URL": this.cfg.locationUrl,
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${this.cfg.siteOrigin}/l/${this.cfg.locationUrl}/a/services`,
      Origin: this.cfg.siteOrigin,
    };
  }

  async get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.cfg.apiBase}${path}`);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
    const res = await fetch(url, { headers: this.baseHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`byChronos GET ${path} failed (${res.status})`);
    return (await res.json()) as T;
  }

  /** POST with CSRF. Retries once after refreshing the session on a 419. */
  async post<T>(path: string, body: unknown, _retry = false): Promise<T> {
    const session = await this.session();
    const res = await fetch(`${this.cfg.apiBase}${path}`, {
      method: "POST",
      headers: {
        ...this.baseHeaders(),
        "Content-Type": "application/json",
        Cookie: session.cookie,
        "X-XSRF-TOKEN": session.xsrf,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (res.status === 419 && !_retry) {
      g.__bychronosPublicSession = undefined;
      return this.post<T>(path, body, true);
    }
    if (!res.ok) {
      throw new Error(`byChronos POST ${path} failed (${res.status}): ${await safeText(res)}`);
    }
    return (await res.json()) as T;
  }

  /** Obtain (and cache) a Laravel CSRF cookie + token. */
  private async session(): Promise<Session> {
    const cached = g.__bychronosPublicSession;
    if (cached && Date.now() - cached.fetchedAt < SESSION_TTL_MS) return cached;

    const res = await fetch(`${this.cfg.siteOrigin}/sanctum/csrf-cookie`, {
      headers: this.baseHeaders(),
      cache: "no-store",
    });
    const setCookies = collectSetCookies(res.headers);
    const cookie = setCookies
      .map((c) => c.split(";")[0])
      .filter(Boolean)
      .join("; ");
    const xsrfPair = setCookies.map((c) => c.split(";")[0]).find((c) => c.startsWith("XSRF-TOKEN="));
    const xsrf = xsrfPair ? decodeURIComponent(xsrfPair.slice("XSRF-TOKEN=".length)) : "";
    if (!xsrf) throw new Error("byChronos: could not obtain CSRF token");
    const session: Session = { cookie, xsrf, fetchedAt: Date.now() };
    g.__bychronosPublicSession = session;
    return session;
  }
}

/** Read all Set-Cookie headers (Node fetch exposes getSetCookie()). */
function collectSetCookies(headers: Headers): string[] {
  const anyHeaders = headers as unknown as { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === "function") return anyHeaders.getSetCookie();
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "<no body>";
  }
}
