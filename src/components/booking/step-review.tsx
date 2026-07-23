"use client";

import type { Service, TimeSlot } from "@/lib/booking/types";
import {
  formatDateLabel,
  formatDuration,
  formatMoney,
  formatSlotTime,
} from "@/lib/format";
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
      <section className="space-y-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold tracking-tight">Your appointment</h2>
          <button
            type="button"
            onClick={() => onEdit(0)}
            className="text-sm font-medium text-blush-700"
          >
            Edit
          </button>
        </div>

        <ul className="space-y-2">
          {services.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-sm">{s.name}</span>
              <span className="text-right text-sm tabular-nums">
                {formatMoney(s.priceCents)}
              </span>
            </li>
          ))}
        </ul>

        <hr className="border-ink-100" />

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-500">Artist</dt>
            <dd className="flex items-center gap-2">
              {artistLabel}
              <button
                type="button"
                onClick={() => onEdit(1)}
                className="text-xs font-medium text-blush-700"
              >
                Edit
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-500">Date &amp; time</dt>
            <dd className="flex items-center gap-2 tabular-nums">
              {formatDateLabel(slot.startISO)} · {formatSlotTime(slot.startISO)}
              <button
                type="button"
                onClick={() => onEdit(2)}
                className="text-xs font-medium text-blush-700"
              >
                Edit
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-500">Duration</dt>
            <dd className="tabular-nums">{formatDuration(totalMinutes)}</dd>
          </div>
        </dl>

        <hr className="border-ink-100" />

        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-right text-lg font-semibold tabular-nums">
            {formatMoney(totalCents)}
          </span>
        </div>
        <p className="text-xs text-ink-400">Pay at the salon after your visit.</p>
      </section>

      {/* Contact summary */}
      <section className="space-y-2 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold tracking-tight">Your info</h2>
          <button
            type="button"
            onClick={() => onEdit(3)}
            className="text-sm font-medium text-blush-700"
          >
            Edit
          </button>
        </div>
        <p className="text-sm">
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
          className="space-y-3 rounded-2xl border border-blush-200 bg-blush-50 p-4"
        >
          <p className="text-sm text-blush-700">{submitError}</p>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="h-12 w-full rounded-xl border border-blush-300 bg-white font-medium text-blush-700"
          >
            Choose a different time
          </button>
        </div>
      )}
    </div>
  );
}
