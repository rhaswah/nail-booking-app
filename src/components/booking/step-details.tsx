"use client";

import { useState } from "react";
import type { CustomerDraft, CustomerField } from "./validation";
import { formatPhoneInput, validateCustomer } from "./validation";

interface StepDetailsProps {
  draft: CustomerDraft;
  onChange: (patch: Partial<CustomerDraft>) => void;
}

const inputClass = (invalid: boolean) =>
  `h-12 w-full rounded-xl border bg-white px-4 text-base text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-blush-200 ${
    invalid ? "border-blush-500" : "border-ink-200 focus:border-blush-400"
  }`;

export default function StepDetails({ draft, onChange }: StepDetailsProps) {
  const [touched, setTouched] = useState<
    Partial<Record<CustomerField, boolean>>
  >({});
  const errors = validateCustomer(draft);

  const touch = (field: CustomerField) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const showError = (field: CustomerField) =>
    touched[field] ? errors[field] : undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-500">
        Almost there — we just need your contact info to hold the appointment.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={showError("firstName")}>
            <input
              type="text"
              autoComplete="given-name"
              placeholder="Jamie"
              value={draft.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              onBlur={() => touch("firstName")}
              aria-invalid={Boolean(showError("firstName"))}
              className={inputClass(Boolean(showError("firstName")))}
            />
          </Field>
          <Field label="Last name" error={showError("lastName")}>
            <input
              type="text"
              autoComplete="family-name"
              placeholder="Rivera"
              value={draft.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              onBlur={() => touch("lastName")}
              aria-invalid={Boolean(showError("lastName"))}
              className={inputClass(Boolean(showError("lastName")))}
            />
          </Field>
        </div>

        <Field label="Mobile phone" error={showError("phone")}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(310) 555-0148"
            value={draft.phone}
            onChange={(e) =>
              onChange({ phone: formatPhoneInput(e.target.value) })
            }
            onBlur={() => touch("phone")}
            aria-invalid={Boolean(showError("phone"))}
            className={`${inputClass(Boolean(showError("phone")))} tabular-nums`}
          />
        </Field>

        <Field label="Email" error={showError("email")}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={draft.email}
            onChange={(e) => onChange({ email: e.target.value })}
            onBlur={() => touch("email")}
            aria-invalid={Boolean(showError("email"))}
            className={inputClass(Boolean(showError("email")))}
          />
        </Field>

        <Field label="Notes for your artist (optional)">
          <textarea
            rows={3}
            placeholder="Allergies, nail art inspo, coming with a friend…"
            value={draft.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-base text-ink-800 placeholder:text-ink-400 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-200"
          />
        </Field>
      </div>

      <p className="text-xs text-ink-400">
        We&apos;ll only use this to confirm your appointment — no spam, ever.
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-blush-700">{error}</span>}
    </label>
  );
}
