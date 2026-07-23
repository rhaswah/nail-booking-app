import { NextResponse } from "next/server";

/**
 * Shared helpers for API route handlers. Lives in an underscore folder so the
 * App Router does not treat it as a route segment.
 */

/** JSON error body every route uses: `{ error: string }`. */
export function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}

/** Uniform 500 for unexpected provider/config failures (e.g. byChronos not configured). */
export function jsonServerError(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : "Something went wrong.";
  return jsonError(message, 500);
}

const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `value` is a real "YYYY-MM-DD" calendar date (rejects 2026-02-30 etc.). */
export function isValidDateISO(value: string): boolean {
  if (!DATE_ISO_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

/** True for a non-empty string after trimming. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
