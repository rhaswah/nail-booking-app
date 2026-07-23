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

/** Verification lifecycle, mirrored from the wizard. */
export type VerifyPhase =
  | "idle"
  | "sending"
  | "sent"
  | "verifying"
  | "verified";

export interface ReviewVerification {
  phase: VerifyPhase;
  code: string;
  error: string | null;
  /** Seconds remaining before "Resend code" is tappable again (0 = ready). */
  resendCooldown: number;
  onCodeChange: (code: string) => void;
  onSend: () => void;
  onVerify: () => void;
}

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
  /** Phone-verification panel state; `null` when verification is disabled. */
  verification?: ReviewVerification | null;
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
  verification,
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

      {verification && (
        <VerificationPanel
          verification={verification}
          phone={customer.phone}
        />
      )}

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

/**
 * Sparkly phone-verification panel shown on the review step when byChronos
 * write-back is on. Drives send → enter code → verify, and reports success so
 * the wizard can unlock the Confirm CTA.
 */
function VerificationPanel({
  verification,
  phone,
}: {
  verification: ReviewVerification;
  phone: string;
}) {
  const { phase, code, error, resendCooldown, onCodeChange, onSend, onVerify } =
    verification;
  const sending = phase === "sending";
  const verifying = phase === "verifying";
  const verified = phase === "verified";
  const codeShown = phase === "sent" || phase === "verifying";

  if (verified) {
    return (
      <section className="flex items-center gap-2 rounded-card border border-pink-200 bg-pink-50 p-4 shadow-pink">
        <Sparkle size={18} color="var(--color-pink-500)" twinkle />
        <p className="text-sm font-medium text-pink-700">Phone verified ✓</p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-card border border-pink-100 bg-white p-4 shadow-pink">
      <h2 className="flex items-center gap-1.5 font-display font-semibold tracking-tight text-ink-800">
        <Sparkle size={14} color="var(--color-sparkle)" twinkle />
        Quick confirmation
      </h2>

      {phase === "idle" || phase === "sending" ? (
        <>
          <p className="text-sm text-ink-500">
            We&apos;ll text a quick code to{" "}
            <span className="font-medium text-ink-800 tabular-nums">
              {phone}
            </span>{" "}
            to confirm it&apos;s you.
          </p>
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-cta bg-gradient-to-r from-pink-500 to-lilac-500 font-medium text-white shadow-pink transition-colors active:from-pink-600 active:to-lilac-600 disabled:from-ink-200 disabled:to-ink-200 disabled:text-ink-400 disabled:shadow-none"
          >
            {sending ? (
              <>
                <Spinner /> Sending…
              </>
            ) : (
              "Send code"
            )}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-500">
            Enter the 6-digit code we texted to{" "}
            <span className="font-medium text-ink-800 tabular-nums">
              {phone}
            </span>
            .
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) =>
              onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            aria-label="Verification code"
            aria-invalid={Boolean(error)}
            className={`h-12 w-full rounded-cta border bg-white px-4 text-center text-lg tracking-[0.4em] text-ink-800 tabular-nums placeholder:tracking-normal placeholder:text-ink-400 transition-shadow focus:outline-none focus:ring-4 focus:ring-pink-200/60 ${
              error ? "border-pink-500" : "border-pink-200 focus:border-pink-400"
            }`}
          />
          <button
            type="button"
            onClick={onVerify}
            disabled={verifying || code.length === 0}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-cta bg-gradient-to-r from-pink-500 to-lilac-500 font-medium text-white shadow-pink transition-colors active:from-pink-600 active:to-lilac-600 disabled:from-ink-200 disabled:to-ink-200 disabled:text-ink-400 disabled:shadow-none"
          >
            {verifying ? (
              <>
                <Spinner /> Verifying…
              </>
            ) : (
              "Verify"
            )}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={onSend}
              disabled={resendCooldown > 0 || verifying}
              className="min-h-[44px] px-2 text-sm font-medium text-pink-700 disabled:text-ink-400"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend code"}
            </button>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-pink-700">
          {error}
        </p>
      )}
      {!error && codeShown && (
        <p className="text-xs text-ink-400">
          Didn&apos;t get it? Check your messages, or resend above.
        </p>
      )}
    </section>
  );
}

/** Small on-theme spinner for sending/verifying states. */
function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
