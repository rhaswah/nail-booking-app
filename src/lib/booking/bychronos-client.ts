/**
 * byChronos / Go3 Schedule API — low-level HTTP client.
 *
 * byChronos has no public/self-serve API, but its apps run on Go3 Technology's
 * documented Schedule API (OpenAPI 3.0 at https://schedule.go3apis.com/docs —
 * a copy is checked in at docs/go3-schedule-openapi.json). This client speaks
 * that API directly.
 *
 * Access is partnership-gated: the salon owner supplies an Application ID, a
 * Location ID, and an OAuth client (obtained from the byChronos Manager app or
 * by emailing developer@go3technology.com). All credentials come from env — see
 * .env.example. This module runs SERVER-SIDE ONLY; nothing here is ever bundled
 * into the browser.
 */

const DEFAULT_BASE = "https://schedule.go3apis.com";

export interface ByChronosConfig {
  baseUrl: string;
  applicationId: string; // X-APPLICATION-ID
  locationId: string; // X-LOCATION-ID
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

/** Reads config from env. Returns null (with a console warning) if incomplete. */
export function readByChronosConfig(): ByChronosConfig | null {
  const e = process.env;
  const cfg: ByChronosConfig = {
    baseUrl: e.BYCHRONOS_BASE_URL || DEFAULT_BASE,
    applicationId: e.BYCHRONOS_APPLICATION_ID || "",
    locationId: e.BYCHRONOS_LOCATION_ID || "",
    clientId: e.BYCHRONOS_CLIENT_ID || "",
    clientSecret: e.BYCHRONOS_CLIENT_SECRET || "",
    username: e.BYCHRONOS_USERNAME || "",
    password: e.BYCHRONOS_PASSWORD || "",
  };
  const missing = Object.entries({
    BYCHRONOS_APPLICATION_ID: cfg.applicationId,
    BYCHRONOS_LOCATION_ID: cfg.locationId,
    BYCHRONOS_CLIENT_ID: cfg.clientId,
    BYCHRONOS_CLIENT_SECRET: cfg.clientSecret,
    BYCHRONOS_USERNAME: cfg.username,
    BYCHRONOS_PASSWORD: cfg.password,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    console.warn(
      `[byChronos] BOOKING_PROVIDER=bychronos but missing env: ${missing.join(", ")}. ` +
        `Falling back is up to the caller.`,
    );
    return null;
  }
  return cfg;
}

interface TokenState {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // epoch ms
}

// Token cached on globalThis so it survives dev-server module reloads and is
// shared across requests. Never logged, never sent to the client.
const g = globalThis as unknown as { __bychronosToken?: TokenState };

export class ByChronosClient {
  constructor(private cfg: ByChronosConfig) {}

  private async fetchToken(): Promise<string> {
    const now = Date.now();
    const cached = g.__bychronosToken;
    if (cached && cached.expiresAt - 60_000 > now) return cached.accessToken;

    const base = {
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      scope: "read:* write:*",
    };
    const body = cached?.refreshToken
      ? { ...base, grant_type: "refresh_token", refresh_token: cached.refreshToken }
      : { ...base, grant_type: "password", username: this.cfg.username, password: this.cfg.password };

    const res = await fetch(`${this.cfg.baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok && cached?.refreshToken) {
      // Refresh path failed — retry once with a fresh password grant.
      g.__bychronosToken = undefined;
      return this.fetchToken();
    }
    if (!res.ok) {
      throw new Error(`byChronos auth failed (${res.status}): ${await safeText(res)}`);
    }
    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };
    g.__bychronosToken = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      expiresAt: now + (json.expires_in ?? 3600) * 1000,
    };
    return json.access_token;
  }

  async request<T>(
    method: string,
    path: string,
    opts: { query?: Record<string, string | number | undefined>; body?: unknown } = {},
  ): Promise<T> {
    const token = await this.fetchToken();
    const url = new URL(`${this.cfg.baseUrl}${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APPLICATION-ID": this.cfg.applicationId,
        "X-LOCATION-ID": this.cfg.locationId,
        Accept: "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`byChronos ${method} ${path} failed (${res.status}): ${await safeText(res)}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  get<T>(path: string, query?: Record<string, string | number | undefined>) {
    return this.request<T>("GET", path, { query });
  }
  post<T>(path: string, body: unknown) {
    return this.request<T>("POST", path, { body });
  }
  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, { body });
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<no body>";
  }
}
