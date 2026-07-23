"use client";

import { useEffect, useState } from "react";
import type { StaffSelection, TimeSlot } from "@/lib/booking/types";
import { formatDateLabel, formatSlotTime, salonDateISO } from "@/lib/format";
import { salonConfig } from "@/lib/salon.config";
import { Fairy, Sparkle } from "@/components/decor";

interface StepTimeProps {
  /** Open, bookable "YYYY-MM-DD" dates (closed days already skipped). */
  dates: string[];
  selectedDate: string | null;
  onSelectDate: (dateISO: string) => void;
  serviceIds: string[];
  staffId: StaffSelection;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

const hourFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: salonConfig.timezone,
  hour: "numeric",
  hourCycle: "h23",
});

function slotHour(startISO: string): number {
  return Number(hourFmt.format(new Date(startISO)));
}

/** "2026-07-28" → { weekday: "Tue", month: "Jul", day: "28" } via formatDateLabel. */
function dateParts(dateISO: string) {
  const [weekday, monthDay] = formatDateLabel(dateISO).split(", ");
  const [month, day] = (monthDay ?? "").split(" ");
  return { weekday: weekday ?? "", month: month ?? "", day: day ?? "" };
}

/** Result of the latest availability fetch, tagged with its query key. */
type FetchResult =
  | { key: string; status: "loaded"; slots: TimeSlot[] }
  | { key: string; status: "error" };

export default function StepTime({
  dates,
  selectedDate,
  onSelectDate,
  serviceIds,
  staffId,
  selectedSlot,
  onSelectSlot,
}: StepTimeProps) {
  const [result, setResult] = useState<FetchResult | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const todayISO = salonDateISO();
  const servicesKey = serviceIds.join(",");
  const queryKey = selectedDate
    ? `${selectedDate}|${servicesKey}|${staffId}|${retryToken}`
    : null;

  // Default to the first bookable date.
  useEffect(() => {
    if (dates.length === 0) return;
    if (!selectedDate || !dates.includes(selectedDate)) {
      onSelectDate(dates[0]);
    }
  }, [dates, selectedDate, onSelectDate]);

  // Fetch availability whenever the query changes. Loading/error/slots are
  // all derived from whether `result` matches the current query key.
  useEffect(() => {
    if (!selectedDate || !queryKey) return;
    let cancelled = false;
    const qs = new URLSearchParams({
      date: selectedDate,
      services: servicesKey,
      staff: staffId,
    });
    fetch(`/api/availability?${qs.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { slots?: TimeSlot[] }) => {
        if (cancelled) return;
        setResult({
          key: queryKey,
          status: "loaded",
          slots: Array.isArray(data.slots) ? data.slots : [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResult({ key: queryKey, status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, selectedDate, servicesKey, staffId]);

  const current = result && result.key === queryKey ? result : null;
  const loading = queryKey !== null && current === null;
  const fetchError = current?.status === "error";
  const slots = current?.status === "loaded" ? current.slots : [];

  const groups = [
    { label: "Morning", slots: slots.filter((s) => slotHour(s.startISO) < 12) },
    {
      label: "Afternoon",
      slots: slots.filter((s) => {
        const h = slotHour(s.startISO);
        return h >= 12 && h < 17;
      }),
    },
    { label: "Evening", slots: slots.filter((s) => slotHour(s.startISO) >= 17) },
  ].filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-6">
      {/* Date strip — next 30 days, closed days skipped */}
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink-800">
          Pick a day
          <Sparkle size={14} color="var(--color-sparkle)" twinkle />
        </h2>
        <div className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          {dates.map((d) => {
            const sel = d === selectedDate;
            const { weekday, month, day } = dateParts(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={sel}
                onClick={() => onSelectDate(d)}
                className={`relative flex min-h-[44px] w-16 shrink-0 snap-start flex-col items-center rounded-card border px-2 py-2.5 transition-all ${
                  sel
                    ? "border-pink-500 bg-pink-50 shadow-pink"
                    : "border-pink-100 bg-white"
                }`}
              >
                {sel && (
                  <Sparkle
                    size={12}
                    color="var(--color-sparkle)"
                    twinkle
                    className="absolute -right-0.5 -top-0.5"
                  />
                )}
                <span
                  className={`text-[11px] uppercase tracking-wide ${
                    sel ? "font-medium text-pink-700" : "text-ink-500"
                  }`}
                >
                  {d === todayISO ? "Today" : weekday}
                </span>
                <span className="text-lg font-semibold text-ink-800 tabular-nums">
                  {day}
                </span>
                <span className="text-[11px] text-ink-400">{month}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots for the chosen day */}
      <div aria-live="polite">
        {selectedDate && (
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-800">
            Times on {formatDateLabel(selectedDate)}
          </h2>
        )}

        {loading && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-11 animate-pulse rounded-full bg-pink-100/70"
              />
            ))}
          </div>
        )}

        {!loading && fetchError && (
          <div className="mt-3 rounded-card border border-pink-100 bg-white p-4 text-center shadow-pink">
            <p className="text-sm text-ink-500">
              We couldn&apos;t load available times. Please check your
              connection and try again.
            </p>
            <button
              type="button"
              onClick={() => setRetryToken((t) => t + 1)}
              className="mt-3 h-12 w-full rounded-cta border border-pink-200 bg-white font-medium text-pink-700 active:bg-pink-50"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !fetchError && slots.length === 0 && (
          <div className="mt-3 rounded-card border border-pink-100 bg-white p-6 text-center shadow-pink">
            <Fairy size={64} float className="mx-auto" />
            <p className="mt-2 font-display font-semibold text-ink-800">
              No openings this day
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Try another date — weekends and evenings fill up fast.
            </p>
          </div>
        )}

        {!loading && !fetchError && groups.length > 0 && (
          <div className="mt-3 space-y-5">
            {groups.map((g) => (
              <div key={g.label}>
                <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-pink-700">
                  <Sparkle size={11} color="var(--color-pink-400)" />
                  {g.label}
                </h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {g.slots.map((slot) => {
                    const sel =
                      selectedSlot !== null &&
                      selectedSlot.startISO === slot.startISO &&
                      selectedSlot.staffId === slot.staffId;
                    return (
                      <button
                        key={`${slot.startISO}-${slot.staffId}`}
                        type="button"
                        aria-pressed={sel}
                        onClick={() => onSelectSlot(slot)}
                        className={`relative flex min-h-[44px] items-center justify-center gap-1 rounded-full border px-2 py-3 text-sm tabular-nums transition-all ${
                          sel
                            ? "border-pink-500 bg-pink-500 text-white shadow-pink"
                            : "border-pink-200 bg-white text-ink-800 active:bg-pink-50"
                        }`}
                      >
                        {sel && <Sparkle size={12} color="#fff" />}
                        {formatSlotTime(slot.startISO)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
