"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Booking,
  BookingRequest,
  Service,
  ServiceCategory,
  Staff,
  StaffSelection,
  TimeSlot,
} from "@/lib/booking/types";
import { ANY_STAFF } from "@/lib/booking/types";
import { encodeConfirm, toConfirmSummary } from "@/lib/booking/confirm-token";
import { addDaysISO, formatDuration, formatMoney, salonDateISO } from "@/lib/format";
import { salonConfig, type Weekday } from "@/lib/salon.config";
import { Sparkle, WandIcon } from "@/components/decor";
import StepServices from "./step-services";
import StepArtist from "./step-artist";
import StepTime from "./step-time";
import StepDetails from "./step-details";
import StepReview from "./step-review";
import type { CustomerDraft } from "./validation";
import { emptyCustomerDraft, isCustomerValid } from "./validation";

interface BookingWizardProps {
  categories: ServiceCategory[];
  services: Service[];
  staff: Staff[];
}

/** Phone-verification lifecycle on the review step. */
type VerifyPhase = "idle" | "sending" | "sent" | "verifying" | "verified";

const RESEND_COOLDOWN_SECONDS = 30;

/** Step order — hash keeps the browser back button working within the wizard. */
const STEPS = [
  { hash: "services", title: "Choose your services" },
  { hash: "artist", title: "Choose your artist" },
  { hash: "time", title: "Pick a time" },
  { hash: "details", title: "Your details" },
  { hash: "review", title: "Review & confirm" },
] as const;

export default function BookingWizard({
  categories,
  services,
  staff,
}: BookingWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffSelection, setStaffSelection] = useState<StaffSelection | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomerDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Optional phone verification ────────────────────────────────────────
  // The catalog endpoint tells us whether byChronos write-back (and therefore
  // phone verification) is switched on. When off, this stays false and the
  // wizard behaves exactly as before.
  const [requireVerification, setRequireVerification] = useState(false);
  // 'idle' → not yet sent · 'sending' · 'sent' (code input shown) · 'verifying'
  // · 'verified' (Confirm unlocked)
  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase>("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Read `requireVerification` from the catalog endpoint on mount. Steps 1–4
  // still use the props passed in from the server component, untouched.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/services");
        if (!res.ok) return;
        const data: unknown = await res.json().catch(() => null);
        const flag = (data as { requireVerification?: unknown } | null)
          ?.requireVerification;
        if (!cancelled && flag === true) setRequireVerification(true);
      } catch {
        // Network hiccup reading the flag → fail open to today's behavior.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const isVerified = verifyPhase === "verified";

  // ── Derived state ──────────────────────────────────────────────────────
  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds],
  );
  const totalCents = selectedServices.reduce((sum, s) => sum + s.priceCents, 0);
  const totalMinutes = selectedServices.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );

  const eligibleStaff = useMemo(
    () =>
      staff.filter((t) =>
        selectedServiceIds.every((id) => t.serviceIds.includes(id)),
      ),
    [staff, selectedServiceIds],
  );

  /** Bookable dates: salon open days (and the chosen tech's workdays). */
  const dates = useMemo(() => {
    const today = salonDateISO();
    const tech =
      staffSelection && staffSelection !== ANY_STAFF
        ? staff.find((t) => t.id === staffSelection)
        : undefined;
    const list: string[] = [];
    for (let i = 0; i < salonConfig.maxAdvanceDays; i++) {
      const d = addDaysISO(today, i);
      const wd = new Date(`${d}T12:00:00Z`).getUTCDay() as Weekday;
      if (!salonConfig.openingHours[wd]) continue; // salon closed
      if (tech && !tech.workDays.includes(wd)) continue; // tech's day off
      list.push(d);
    }
    return list;
  }, [staff, staffSelection]);

  const detailsValid = isCustomerValid(customer);

  /** Furthest step the current selections justify (used to clamp hash nav). */
  const maxStep = useMemo(() => {
    if (selectedServiceIds.length === 0) return 0;
    if (staffSelection === null) return 1;
    if (selectedSlot === null) return 2;
    if (!detailsValid) return 3;
    return 4;
  }, [selectedServiceIds, staffSelection, selectedSlot, detailsValid]);

  const maxStepRef = useRef(maxStep);
  useEffect(() => {
    maxStepRef.current = maxStep;
  }, [maxStep]);

  // ── URL-hash <-> step sync (browser back/forward works) ────────────────
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace(/^#/, "");
      const target = STEPS.findIndex((s) => s.hash === h);
      const wanted = target === -1 ? 0 : target;
      const clamped = Math.min(wanted, maxStepRef.current);
      setStep(clamped);
      if (clamped !== wanted || !window.location.hash) {
        window.history.replaceState(null, "", `#${STEPS[clamped].hash}`);
      }
      window.scrollTo(0, 0);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const goToStep = useCallback(
    (i: number) => {
      if (i === step) return;
      window.location.hash = STEPS[i].hash; // pushes a history entry
    },
    [step],
  );

  const goBack = useCallback(() => {
    if (step > 0) window.history.back();
  }, [step]);

  // ── Selection handlers (reset downstream picks) ────────────────────────
  const toggleService = useCallback(
    (id: string) => {
      const next = selectedServiceIds.includes(id)
        ? selectedServiceIds.filter((x) => x !== id)
        : [...selectedServiceIds, id];
      setSelectedServiceIds(next);
      setSelectedSlot(null);
      if (staffSelection && staffSelection !== ANY_STAFF) {
        const tech = staff.find((t) => t.id === staffSelection);
        if (!tech || !next.every((sid) => tech.serviceIds.includes(sid))) {
          setStaffSelection(null);
        }
      }
    },
    [selectedServiceIds, staffSelection, staff],
  );

  const selectStaff = useCallback((sel: StaffSelection) => {
    setStaffSelection(sel);
    setSelectedSlot(null);
  }, []);

  const selectDate = useCallback((d: string) => {
    setSelectedDate(d);
    setSelectedSlot(null);
  }, []);

  const patchCustomer = useCallback((patch: Partial<CustomerDraft>) => {
    setCustomer((c) => ({ ...c, ...patch }));
  }, []);

  // ── Phone verification handlers ────────────────────────────────────────
  const sendVerification = useCallback(async () => {
    if (verifyPhase === "sending" || verifyPhase === "verifying") return;
    const phone = customer.phone.trim();
    setVerifyError(null);
    setVerifyPhase("sending");
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data: unknown = await res.json().catch(() => null);
      const body = (data ?? {}) as { ok?: boolean; error?: string };
      if (!res.ok || body.ok !== true) {
        throw new Error(
          body.error ?? "Couldn't send a code right now — please try again.",
        );
      }
      setVerifyPhase("sent");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setVerifyPhase("idle");
      setVerifyError(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't send a code right now — please try again.",
      );
    }
  }, [customer.phone, verifyPhase]);

  const checkVerification = useCallback(async () => {
    if (verifyPhase === "verifying") return;
    const code = verifyCode.trim();
    if (code.length === 0) {
      setVerifyError("Enter the 6-digit code we texted you.");
      return;
    }
    setVerifyError(null);
    setVerifyPhase("verifying");
    try {
      const res = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customer.phone.trim(),
          code,
          firstName: customer.firstName.trim(),
          lastName: customer.lastName.trim(),
          email: customer.email.trim(),
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      const body = (data ?? {}) as {
        verified?: boolean;
        error?: string;
      };
      if (res.ok && body.verified === true) {
        setVerifyPhase("verified");
        setVerifyError(null);
        return;
      }
      // Wrong/expired code (200 {verified:false}) or a hard error — keep the
      // input open so the customer can retry.
      setVerifyPhase("sent");
      setVerifyError(
        body.error ?? "That code didn't match. Double-check it or resend one.",
      );
    } catch {
      setVerifyPhase("sent");
      setVerifyError("Couldn't verify the code — please try again.");
    }
  }, [customer, verifyCode, verifyPhase]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (!staffSelection || !selectedSlot || submitting) return;
    // When verification is required, never POST /api/bookings before verified.
    if (requireVerification && !isVerified) return;
    setSubmitting(true);
    setSubmitError(null);
    const notes = customer.notes.trim();
    const request: BookingRequest = {
      serviceIds: selectedServiceIds,
      staffId: staffSelection,
      startISO: selectedSlot.startISO,
      customer: {
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        ...(notes ? { notes } : {}),
      },
    };
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data: unknown = await res.json().catch(() => null);
      const body = (data ?? {}) as Partial<Booking> & {
        booking?: Booking;
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(
          body.error ??
            body.message ??
            "We couldn't complete your booking — that time may have just been taken.",
        );
      }
      const booking = body.booking ?? (body as Booking);
      if (!booking.id) throw new Error("Unexpected response from the server.");
      // Pass the booking summary in the URL so the confirmation renders without
      // relying on server-side memory (which isn't shared across serverless instances).
      const token = encodeConfirm(toConfirmSummary(booking));
      router.push(`/confirmed/${booking.id}?b=${token}`);
      // keep `submitting` true while navigating to prevent double-taps
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }, [
    customer,
    isVerified,
    requireVerification,
    router,
    selectedServiceIds,
    selectedSlot,
    staffSelection,
    submitting,
  ]);

  // ── CTA per step ───────────────────────────────────────────────────────
  const cta = [
    { label: "Choose artist", enabled: selectedServiceIds.length > 0 },
    { label: "Choose time", enabled: staffSelection !== null },
    { label: "Your details", enabled: selectedSlot !== null },
    { label: "Review booking", enabled: detailsValid },
    {
      label: submitting ? "Booking…" : "Confirm booking",
      // Verification (when required) must land before the booking can submit.
      enabled: !submitting && (!requireVerification || isVerified),
    },
  ][step];

  const onCta = () => {
    if (step < 4) goToStep(step + 1);
    else void submit();
  };

  const artistLabel =
    staffSelection === ANY_STAFF
      ? "First available"
      : (staff.find((t) => t.id === staffSelection)?.name ?? "");

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Sticky header: back nav + progress */}
      <header className="sticky top-0 z-20 border-b border-pink-100 bg-cream/90 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="Back"
                className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-pink-500 shadow-pink active:bg-pink-50"
              >
                <BackChevron />
              </button>
            ) : (
              <Link
                href="/"
                aria-label={`Back to ${salonConfig.name}`}
                className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-pink-500 shadow-pink active:bg-pink-50"
              >
                <BackChevron />
              </Link>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-pink-500 tabular-nums">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="flex items-center gap-1.5 truncate font-display text-base font-semibold tracking-tight text-ink-800">
                {STEPS[step].title}
                <Sparkle
                  size={14}
                  color="var(--color-sparkle)"
                  twinkle
                  className="shrink-0"
                />
              </h1>
            </div>
          </div>

          {/* Step indicator — a row of little sparkle stars over a shimmery bar */}
          <div className="mt-3">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-pink-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-400 to-lilac-500 transition-[width] duration-500 ease-out"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 flex justify-between px-0.5" aria-hidden="true">
              {STEPS.map((s, i) => (
                <Sparkle
                  key={s.hash}
                  size={i === step ? 16 : 13}
                  color={
                    i < step
                      ? "var(--color-pink-400)"
                      : i === step
                        ? "var(--color-pink-500)"
                        : "var(--color-pink-200)"
                  }
                  twinkle={i === step}
                  className="transition-all"
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-32 pt-4 sm:px-6">
        {step === 0 && (
          <StepServices
            categories={categories}
            services={services}
            selectedIds={selectedServiceIds}
            onToggle={toggleService}
          />
        )}
        {step === 1 && (
          <StepArtist
            eligibleStaff={eligibleStaff}
            selection={staffSelection}
            onSelect={selectStaff}
          />
        )}
        {step === 2 && staffSelection !== null && (
          <StepTime
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={selectDate}
            serviceIds={selectedServiceIds}
            staffId={staffSelection}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />
        )}
        {step === 3 && (
          <StepDetails draft={customer} onChange={patchCustomer} />
        )}
        {step === 4 && selectedSlot !== null && (
          <StepReview
            services={selectedServices}
            artistLabel={artistLabel}
            slot={selectedSlot}
            totalCents={totalCents}
            totalMinutes={totalMinutes}
            customer={customer}
            submitError={submitError}
            onEdit={goToStep}
            verification={
              requireVerification
                ? {
                    phase: verifyPhase,
                    code: verifyCode,
                    error: verifyError,
                    resendCooldown,
                    onCodeChange: setVerifyCode,
                    onSend: () => void sendVerification(),
                    onVerify: () => void checkVerification(),
                  }
                : null
            }
          />
        )}
      </main>

      {/* Sticky bottom CTA bar — sparkly running total + shimmer confirm */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-pink-100 bg-white/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-pink-lg backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <div className="min-w-0 shrink-0">
            {selectedServiceIds.length > 0 ? (
              <>
                <p className="flex items-center gap-1 text-lg font-semibold text-ink-800 tabular-nums">
                  {formatMoney(totalCents)}
                  <Sparkle size={13} color="var(--color-sparkle)" twinkle />
                </p>
                <p className="text-xs text-ink-500 tabular-nums">
                  {selectedServiceIds.length}{" "}
                  {selectedServiceIds.length === 1 ? "service" : "services"} ·{" "}
                  {formatDuration(totalMinutes)}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-400">No services yet</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCta}
            disabled={!cta.enabled}
            className="relative h-12 flex-1 overflow-hidden rounded-cta bg-gradient-to-r from-pink-500 to-lilac-500 font-medium text-white shadow-pink transition-colors active:from-pink-600 active:to-lilac-600 disabled:from-ink-200 disabled:to-ink-200 disabled:text-ink-400 disabled:shadow-none"
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {step === 4 && !submitting && (
                <WandIcon size={18} className="text-white" />
              )}
              {cta.label}
            </span>
            {cta.enabled && <span className="shimmer-sweep" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function BackChevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
