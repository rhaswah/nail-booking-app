/**
 * Serialises a byChronos guest session into an HttpOnly cookie on OUR domain.
 *
 * The value is base64url(JSON) with an HMAC signature so it can't be tampered
 * with. It's HttpOnly + Secure so browser JS can't read it and it only travels
 * to our server over HTTPS — the byChronos session never touches the client.
 */

import crypto from "node:crypto";
import type { SerializedSession } from "@/lib/booking/bychronos-booking";

export const SESSION_COOKIE = "bc_sess";
export const SESSION_MAX_AGE = 15 * 60; // seconds — verification codes are short-lived

function secret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(payload: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update(payload).digest());
}

export function encodeSessionCookie(session: SerializedSession): string {
  const payload = b64url(Buffer.from(JSON.stringify(session), "utf8"));
  return `${payload}.${sign(payload)}`;
}

export function decodeSessionCookie(value: string | undefined): SerializedSession | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = sign(payload);
  // Constant-time compare; guard against length mismatch.
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
    return null;
  }
  try {
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json) as SerializedSession;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
