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
import {
  Fairy,
  SparkleField,
  Sparkle,
  PaintedNailIcon,
  HeartIcon,
} from "@/components/decor";

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
      <div className="relative flex flex-col items-center text-center">
        {/* Sparkle burst backdrop (only for the happy path) */}
        {!cancelled && (
          <SparkleField
            count={16}
            className="-inset-x-6 -top-4 bottom-auto h-64"
          />
        )}

        <div className="relative flex flex-col items-center space-y-4">
          {cancelled ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 text-ink-400 ring-8 ring-ink-50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                className="h-9 w-9"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </div>
          ) : (
            <div className="relative">
              {/* soft glow halo behind the fairy */}
              <div
                className="absolute inset-0 -z-10 mx-auto my-auto h-24 w-24 rounded-full bg-pink-200/50 blur-2xl"
                aria-hidden="true"
              />
              <Fairy size={104} float />
            </div>
          )}

          {cancelled ? (
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-800">
              This booking was cancelled
            </h1>
          ) : (
            <h1 className="font-script text-4xl leading-tight text-gradient-pink">
              You&rsquo;re booked!
            </h1>
          )}

          <p className="max-w-xs text-sm text-ink-500">
            {cancelled
              ? "Give us a call if you'd like to rebook."
              : "We can't wait to pamper you. A sparkly confirmation is on its way to your inbox."}
          </p>

          <p className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700">
            <Sparkle size={12} color="var(--color-sparkle)" twinkle />
            Confirmation&nbsp;#{booking.id}
          </p>
        </div>
      </div>

      {/* ── Booking summary ────────────────────────────────────────── */}
      <section className="rounded-card border border-pink-100 bg-white p-4 shadow-pink space-y-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-ink-800">
          <PaintedNailIcon size={18} className="text-pink-500" />
          Your appointment
          <Sparkle size={12} color="var(--color-sparkle)" twinkle />
        </h2>

        <ul className="space-y-2">
          {bookedServices.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-800">{s.name}</span>
              <span className="text-right text-sm tabular-nums text-ink-500">
                {formatMoney(s.priceCents)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-pink-100 pt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Date</span>
            <span className="font-medium text-ink-800">
              {formatDateLabel(booking.startISO)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Time</span>
            <span className="font-medium tabular-nums text-ink-800">
              {formatSlotTime(booking.startISO)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Duration</span>
            <span className="font-medium tabular-nums text-ink-800">
              {formatDuration(booking.totalDurationMinutes)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Nail artist</span>
            <span className="flex items-center gap-2 font-medium text-ink-800">
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

        <div className="flex items-baseline justify-between gap-3 border-t border-pink-100 pt-3">
          <span className="flex items-center gap-1.5 font-semibold text-ink-800">
            <HeartIcon size={14} className="text-pink-400" />
            Total
          </span>
          <span className="text-right text-lg font-semibold tabular-nums text-pink-600">
            {formatMoney(booking.totalCents)}
          </span>
        </div>
      </section>

      {/* ── Salon info ─────────────────────────────────────────────── */}
      <section className="rounded-card border border-pink-100 bg-white p-4 shadow-pink space-y-1.5">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-ink-800">
          <Sparkle size={14} className="text-lilac-400" />
          Where to find us
        </h2>
        <p className="text-sm font-medium text-ink-800">{salonConfig.name}</p>
        <p className="text-sm text-ink-500">{salonConfig.address}</p>
        <a
          href={`tel:${salonConfig.phone.replace(/[^\d+]/g, "")}`}
          className="inline-block text-sm font-medium text-pink-700 underline underline-offset-2"
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
          className="flex h-12 w-full items-center justify-center gap-2 rounded-cta border border-pink-200 bg-white font-medium text-ink-800 shadow-pink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-pink-500"
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
        className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-cta bg-gradient-to-r from-pink-500 to-lilac-500 font-medium text-white shadow-pink active:from-pink-600 active:to-lilac-600"
      >
        <Sparkle size={16} color="#fff" twinkle />
        Back to home
        <span className="shimmer-sweep" />
      </Link>
    </main>
  );
}
