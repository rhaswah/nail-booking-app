import type { Metadata } from "next";
import Link from "next/link";

import { getProvider } from "@/lib/booking/provider";
import { salonConfig } from "@/lib/salon.config";
import {
  addDaysISO,
  formatDateLabel,
  formatDuration,
  formatMoney,
  formatSlotTime,
  salonDateISO,
} from "@/lib/format";
import type { Booking, BookingStatus, Service, Staff } from "@/lib/booking/types";
import { DatePicker } from "./date-picker";
import { PaintedNailIcon, Sparkle } from "@/components/decor";

// NOTE(auth): This page is intentionally unauthenticated for the demo.
// Staff auth (salon login / SSO) ships together with the byChronos POS
// connector — the same credentials will gate this view and drive sync.

export const metadata: Metadata = {
  title: `Admin · Day view — ${salonConfig.name}`,
  robots: { index: false, follow: false },
};

const PLAIN_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_STYLE: Record<
  BookingStatus,
  { label: string; className: string; dot: string }
> = {
  // amber = waiting for the byChronos connector to push it to the POS
  pending_sync: {
    label: "Pending sync",
    className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/70",
    dot: "bg-amber-500",
  },
  // green = the POS has acknowledged this booking
  synced: {
    label: "Synced",
    className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70",
    dot: "bg-emerald-500",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-pink-50 text-pink-700 ring-1 ring-pink-200/70",
    dot: "bg-pink-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-ink-50 text-ink-500 ring-1 ring-ink-200/70",
    dot: "bg-ink-300",
  },
};

function StatusPill({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

function endTime(b: Booking): string {
  const end = new Date(
    new Date(b.startISO).getTime() + b.totalDurationMinutes * 60_000,
  );
  return formatSlotTime(end.toISOString());
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = salonDateISO();
  const dateISO = date && PLAIN_DATE_RE.test(date) ? date : today;

  const provider = getProvider();
  const [bookings, services, staff] = await Promise.all([
    provider.listBookings(dateISO),
    provider.getServices(),
    provider.getStaff(),
  ]);

  const serviceById = new Map<string, Service>(services.map((s) => [s.id, s]));
  const staffById = new Map<string, Staff>(staff.map((t) => [t.id, t]));

  const active = bookings.filter((b) => b.status !== "cancelled");
  const revenueCents = active.reduce((sum, b) => sum + b.totalCents, 0);
  const pendingSync = active.filter((b) => b.status === "pending_sync").length;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink-800">
            <PaintedNailIcon size={20} className="text-pink-500" />
            {salonConfig.name} · Day view
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-pink-700 underline underline-offset-2"
          >
            Booking site
          </Link>
        </div>
        <div className="flex items-start gap-2 rounded-cta border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          <p>
            <span className="font-medium">byChronos sync: not connected yet.</span>{" "}
            Bookings marked “Pending sync” will push to the POS automatically once
            the connector lands.
          </p>
        </div>
      </header>

      {/* ── Date controls ──────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin?date=${addDaysISO(dateISO, -1)}`}
            aria-label="Previous day"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-cta border border-pink-200 bg-white text-ink-800 active:bg-pink-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </Link>
          <DatePicker value={dateISO} />
          <Link
            href={`/admin?date=${addDaysISO(dateISO, 1)}`}
            aria-label="Next day"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-cta border border-pink-200 bg-white text-ink-800 active:bg-pink-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
        <div className="flex items-baseline justify-between gap-3 px-1">
          <p className="text-sm text-ink-500">
            <span className="font-medium text-ink-800">
              {formatDateLabel(dateISO)}
            </span>
            {dateISO === today ? (
              " · today"
            ) : (
              <>
                {" · "}
                <Link
                  href="/admin"
                  className="font-medium text-pink-700 underline underline-offset-2"
                >
                  jump to today
                </Link>
              </>
            )}
          </p>
          <p className="text-right text-sm text-ink-500 tabular-nums">
            {active.length} appt{active.length === 1 ? "" : "s"} ·{" "}
            {formatMoney(revenueCents)}
            {pendingSync > 0 && ` · ${pendingSync} pending sync`}
          </p>
        </div>
      </section>

      {/* ── Bookings ───────────────────────────────────────────────── */}
      {bookings.length === 0 ? (
        <section className="rounded-card border border-pink-100 bg-white p-8 text-center shadow-pink">
          <div className="mb-2 flex justify-center">
            <Sparkle size={22} color="var(--color-pink-300)" twinkle />
          </div>
          <p className="font-display font-medium text-ink-800">
            No bookings for this day
          </p>
          <p className="mt-1 text-sm text-ink-500">
            New appointments made on the booking site show up here instantly.
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
            const tech = staffById.get(b.staffId);
            const names = b.serviceIds.map(
              (sid) => serviceById.get(sid)?.name ?? sid,
            );
            const cancelled = b.status === "cancelled";
            return (
              <li
                key={b.id}
                className={`rounded-card border border-pink-100 bg-white p-4 shadow-pink ${
                  cancelled ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tabular-nums text-ink-800">
                      {formatSlotTime(b.startISO)} – {endTime(b)}
                      <span className="ml-2 font-normal text-ink-400">
                        {formatDuration(b.totalDurationMinutes)}
                      </span>
                    </p>
                    <p className="mt-1 truncate font-medium text-ink-800">
                      {b.customer.firstName} {b.customer.lastName}
                    </p>
                    <p className="truncate text-sm text-ink-500 tabular-nums">
                      {b.customer.phone}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusPill status={b.status} />
                    <p className="text-right text-base font-semibold tabular-nums text-pink-600">
                      {formatMoney(b.totalCents)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t border-pink-100 pt-3 space-y-1.5">
                  <p className="text-sm text-ink-800">{names.join(" · ")}</p>
                  <p className="flex items-center gap-1.5 text-sm text-ink-500">
                    {tech && (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: tech.avatarColor }}
                        aria-hidden="true"
                      />
                    )}
                    {tech?.name ?? b.staffId}
                  </p>
                  {b.customer.notes && (
                    <p className="text-sm italic text-ink-400">
                      “{b.customer.notes}”
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
