import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProvider } from "@/lib/booking/provider";
import { salonConfig } from "@/lib/salon.config";
import {
  formatDateLabel,
  formatDuration,
  formatMoney,
  formatSlotTime,
} from "@/lib/format";
import type { Booking, Service, Staff } from "@/lib/booking/types";

export const metadata: Metadata = {
  title: `Booking confirmed — ${salonConfig.name}`,
};

/** "2026-07-28T16:30:00.000Z" → "20260728T163000Z" (Google Calendar format). */
function gcalStamp(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[-:]/g, "");
}

function googleCalendarUrl(booking: Booking, serviceNames: string[]): string {
  const start = new Date(booking.startISO);
  const end = new Date(start.getTime() + booking.totalDurationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${salonConfig.name} — ${serviceNames.join(", ")}`,
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
    details: `Appointment at ${salonConfig.name} (booking ${booking.id}). Questions or changes? Call ${salonConfig.phone}.`,
    location: `${salonConfig.name}, ${salonConfig.address}`,
    ctz: salonConfig.timezone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export default async function ConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = getProvider();
  const booking = await provider.getBooking(id);
  if (!booking) notFound();

  const [services, staff] = await Promise.all([
    provider.getServices(),
    provider.getStaff(),
  ]);

  const bookedServices = booking.serviceIds
    .map((sid) => services.find((s) => s.id === sid))
    .filter((s): s is Service => Boolean(s));
  const serviceNames = bookedServices.map((s) => s.name);
  const tech: Staff | undefined = staff.find((t) => t.id === booking.staffId);
  const cancelled = booking.status === "cancelled";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 space-y-6">
      {/* ── Celebration header ─────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-sm ring-8 ${
            cancelled ? "bg-ink-300 ring-ink-100" : "bg-blush-500 ring-blush-100"
          }`}
        >
          {cancelled ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {cancelled ? "This booking was cancelled" : "You're booked!"}
        </h1>
        <p className="text-sm text-ink-500">
          {cancelled
            ? "Give us a call if you'd like to rebook."
            : "We can't wait to see you. A confirmation is on its way to your inbox."}
        </p>
        <p className="rounded-full bg-blush-100 px-3 py-1 text-xs font-medium text-blush-700">
          Confirmation&nbsp;#{booking.id}
        </p>
      </div>

      {/* ── Booking summary ────────────────────────────────────────── */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          Your appointment
        </h2>

        <ul className="space-y-2">
          {bookedServices.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-3">
              <span className="text-sm">{s.name}</span>
              <span className="text-right text-sm tabular-nums text-ink-500">
                {formatMoney(s.priceCents)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-ink-100 pt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Date</span>
            <span className="font-medium">{formatDateLabel(booking.startISO)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Time</span>
            <span className="font-medium tabular-nums">
              {formatSlotTime(booking.startISO)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Duration</span>
            <span className="font-medium tabular-nums">
              {formatDuration(booking.totalDurationMinutes)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Nail artist</span>
            <span className="flex items-center gap-2 font-medium">
              {tech && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: tech.avatarColor }}
                  aria-hidden="true"
                >
                  {initials(tech.name)}
                </span>
              )}
              {tech?.name ?? "Assigned on arrival"}
            </span>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3 border-t border-ink-100 pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-right text-lg font-semibold tabular-nums">
            {formatMoney(booking.totalCents)}
          </span>
        </div>
      </section>

      {/* ── Salon info ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm space-y-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          Where to find us
        </h2>
        <p className="text-sm font-medium">{salonConfig.name}</p>
        <p className="text-sm text-ink-500">{salonConfig.address}</p>
        <a
          href={`tel:${salonConfig.phone.replace(/[^\d+]/g, "")}`}
          className="inline-block text-sm font-medium text-blush-700 underline underline-offset-2"
        >
          {salonConfig.phone}
        </a>
      </section>

      {/* ── Actions ────────────────────────────────────────────────── */}
      {!cancelled && (
        <a
          href={googleCalendarUrl(booking, serviceNames)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white font-medium text-ink-800"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blush-500"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4M12 14v4M10 16h4" />
          </svg>
          Add to calendar
        </a>
      )}
      <Link
        href="/"
        className="flex h-12 w-full items-center justify-center rounded-xl bg-blush-500 font-medium text-white active:bg-blush-600"
      >
        Back to home
      </Link>
    </main>
  );
}
