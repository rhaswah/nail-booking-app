/**
 * Stateless confirmation token.
 *
 * On serverless (Vercel) the request that creates a booking and the request that
 * renders /confirmed/[id] run in different function instances, so an in-memory
 * booking store can't be shared between them. To make the confirmation page work
 * without a database, the wizard encodes the booking's DISPLAY fields into the
 * redirect URL and the page renders from that token.
 *
 * Only non-sensitive display fields are included — NO customer name/phone/email.
 * Runs in both the browser (wizard) and Node (server component): btoa/atob exist
 * in both, and every field here is ASCII (ids, ISO timestamps, enums).
 */

import type { Booking, BookingStatus } from "@/lib/booking/types";

export interface ConfirmSummary {
  serviceIds: string[];
  staffId: string;
  startISO: string;
  totalCents: number;
  totalDurationMinutes: number;
  status: BookingStatus;
}

export function toConfirmSummary(b: Booking): ConfirmSummary {
  return {
    serviceIds: b.serviceIds,
    staffId: b.staffId,
    startISO: b.startISO,
    totalCents: b.totalCents,
    totalDurationMinutes: b.totalDurationMinutes,
    status: b.status,
  };
}

export function encodeConfirm(summary: ConfirmSummary): string {
  const b64 = btoa(JSON.stringify(summary));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeConfirm(token: string | undefined): ConfirmSummary | null {
  if (!token) return null;
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const o = JSON.parse(atob(b64)) as ConfirmSummary;
    if (!Array.isArray(o.serviceIds) || typeof o.startISO !== "string") return null;
    return o;
  } catch {
    return null;
  }
}
