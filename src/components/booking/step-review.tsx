"use client";

import type { Service, TimeSlot } from "@/lib/booking/types";
import {
  formatDateLabel,
  formatDuration,
  formatMoney,
  formatSlotTime,
} from "@/lib/format";
import { HeartIcon, Sparkle } from "@/components/decor";
import type { CustomerDraft } from "./validation";

interface StepReviewProps {
  services: Service[];
  artistLabel: string;
  slot: TimeSlot;
  totalCents: number;
  totalMinutes: number;
  customer: CustomerDraft;
  submitError: string | null;
  /** Jump back to an earlier step (0-based index). */
  onEdit: (step: number) => void;
}

export default function StepReview({
  services,
  artistLabel,
  slot,
  totalCents,
  totalMinutes,
  customer,
  submitError,
  onEdit,
}: StepReviewProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-500">
        One last look — everything correct?
      </p>

      {/* Appointment summary */}
      <section className="space-y-3 rounded-card border border-pink-100 bg-white p-4 shadow-pink">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-display font-semibold tracking-tight text-ink-800">
            Your appointment
            <Sparkle size={13} color="var(--color-sparkle)" twinkle />
          </h2>
          <button
            type="button"
            onClick={() => onEdit(0)}
            className="text-sm font-medium text-pink-700"
          >
            Edit
          </button>
        </div>

        <ul className="space-y-2">
          {services.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-sm text-ink-800">{s.name}</span>
              <span className="text-right text-sm text-ink-800 tabular-nums">
                {formatMoney(s.priceCents)}
              </span>
            </li>
          ))}
        </ul>

        <hr className="border-pink-100" />

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-500">Artist</dt>
            <dd className="flex items-center gap-2 text-ink-800">
              {artistLabel}
              <button
                type="button"
                onClick={() => onEdit(1)}
                className="text-xs font-medium text-pink-700"
              >
                Edit
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-500">Date &amp; time</dt>
            <dd className="flex items-center gap-2 text-ink-800 tabular-nums">
              {formatDateLabel(slot.startISO)} · {formatSlotTime(slot.startISO)}
              <button
                type="button"
                onClick={() => onEdit(2)}
                className="text-xs font-medium text-pink-700"
              >
                Edit
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-500">Duration</dt>
            <dd className="text-ink-800 tabular-nums">
              {formatDuration(totalMinutes)}
            </dd>
          </div>
        </dl>

        <hr className="border-pink-100" />

        <div className="flex items-baseline justify-between rounded-cta bg-pink-50 px-3 py-2.5">
          <span className="flex items-center gap-1.5 font-semibold text-ink-800">
            <Sparkle size={14} color="var(--color-pink-400)" twinkle />
            Total
          </span>
          <span className="text-right text-lg font-semibold text-pink-700 tabular-nums">
            {formatMoney(totalCents)}
          </span>
        </div>
        <p className="text-xs text-ink-400">Pay at the salon after your visit.</p>
      </section>

      {/* Contact summary */}
      <section className="space-y-2 rounded-card border border-pink-100 bg-white p-4 shadow-pink">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-display font-semibold tracking-tight text-ink-800">
            <HeartIcon size={16} className="text-pink-500" />
            Your info
          </h2>
          <button
            type="button"
            onClick={() => onEdit(3)}
            className="text-sm font-medium text-pink-700"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-ink-800">
          {customer.firstName.trim()} {customer.lastName.trim()}
        </p>
        <p className="text-sm text-ink-500 tabular-nums">{customer.phone}</p>
        <p className="text-sm text-ink-500">{customer.email.trim()}</p>
        {customer.notes.trim() && (
          <p className="text-sm text-ink-500">
            <span className="text-ink-400">Notes:</span> {customer.notes.trim()}
          </p>
        )}
      </section>

      {submitError && (
        <div
          role="alert"
          className="space-y-3 rounded-card border border-pink-200 bg-pink-50 p-4 shadow-pink"
        >
          <p className="text-sm text-pink-700">{submitError}</p>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="h-12 w-full rounded-cta border border-pink-300 bg-white font-medium text-pink-700 active:bg-pink-50"
          >
            Choose a different time
          </button>
        </div>
      )}
    </div>
  );
}
