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
import { addDaysISO, formatDuration, formatMoney, salonDateISO } from "@/lib/format";
import { salonConfig, type Weekday } from "@/lib/salon.config";
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

  // ── Submit ─────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (!staffSelection || !selectedSlot || submitting) return;
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
      router.push(`/confirmed/${booking.id}`);
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
      enabled: !submitting,
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
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-cream/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="Back"
                className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-500 active:bg-ink-100"
              >
                <BackChevron />
              </button>
            ) : (
              <Link
                href="/"
                aria-label={`Back to ${salonConfig.name}`}
                className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-500 active:bg-ink-100"
              >
                <BackChevron />
              </Link>
            )}
            <div className="min-w-0">
              <p className="text-xs text-ink-500 tabular-nums">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="truncate text-base font-semibold tracking-tight">
                {STEPS[step].title}
              </h1>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <div
                key={s.hash}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-blush-500" : "bg-ink-100"
                }`}
              />
            ))}
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
          />
        )}
      </main>

      {/* Sticky bottom CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <div className="min-w-0 shrink-0">
            {selectedServiceIds.length > 0 ? (
              <>
                <p className="text-base font-semibold tabular-nums">
                  {formatMoney(totalCents)}
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
            className="h-12 flex-1 rounded-xl bg-blush-500 font-medium text-white transition-colors active:bg-blush-600 disabled:bg-ink-200 disabled:text-ink-400"
          >
            {cta.label}
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
