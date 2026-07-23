import Link from "next/link";
import { salonConfig } from "@/lib/salon.config";

interface HeroProps {
  /** e.g. "Open today · 9:30 AM – 7 PM" or "Closed today". */
  openTodayLabel: string;
  isOpenToday: boolean;
}

export function Hero({ openTodayLabel, isOpenToday }: HeroProps) {
  return (
    <header className="pt-14 pb-12 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.35em] text-blush-700">
        Nail Studio
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-900">
        {salonConfig.name}
      </h1>
      <p className="mt-3 text-base leading-7 text-ink-500">{salonConfig.tagline}</p>

      {/* Open / closed status */}
      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3.5 py-1.5 text-xs text-ink-500 shadow-sm">
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${isOpenToday ? "bg-blush-500" : "bg-ink-300"}`}
        />
        <span className="tabular-nums">{openTodayLabel}</span>
      </div>

      {/* Primary CTA */}
      <div className="mt-8 space-y-3">
        <Link
          href="/book"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-blush-500 font-medium text-white shadow-sm transition-colors hover:bg-blush-600 active:bg-blush-600"
        >
          Book an appointment
        </Link>
        <a
          href={`tel:${salonConfig.phone.replace(/[^\d+]/g, "")}`}
          className="flex h-12 w-full items-center justify-center rounded-xl border border-ink-200 bg-white font-medium text-ink-800 transition-colors hover:border-ink-300"
        >
          Call the studio
        </a>
      </div>

      <p className="mt-5 text-xs text-ink-400">{salonConfig.address}</p>
    </header>
  );
}
