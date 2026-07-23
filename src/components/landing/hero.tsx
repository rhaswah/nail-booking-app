import Link from "next/link";
import { salonConfig } from "@/lib/salon.config";
import { Fairy, SparkleField, Sparkle, WandIcon } from "@/components/decor";

interface HeroProps {
  /** e.g. "Open today · 9:30 AM – 7 PM" or "Closed today". */
  openTodayLabel: string;
  isOpenToday: boolean;
}

export function Hero({ openTodayLabel, isOpenToday }: HeroProps) {
  return (
    <header className="relative overflow-hidden pt-14 pb-12 text-center">
      {/* Twinkling sparkle scatter behind the wordmark */}
      <SparkleField count={14} className="opacity-80" />

      {/* Floating fairy mascot */}
      <Fairy
        size={72}
        float
        className="relative mx-auto mb-2 drop-shadow-[0_8px_18px_rgba(242,78,151,0.28)]"
      />

      <p className="relative text-xs font-medium uppercase tracking-[0.35em] text-pink-600">
        <Sparkle
          size={12}
          color="var(--color-sparkle)"
          twinkle
          className="mr-1 inline-block align-middle"
        />
        Nail Studio
      </p>

      <h1 className="font-script text-gradient-pink relative mt-2 text-5xl leading-[1.15] tracking-tight">
        {salonConfig.name}
      </h1>
      <p className="relative mt-3 text-base leading-7 text-ink-500">
        {salonConfig.tagline}
      </p>

      {/* Open / closed status — sparkly chip */}
      <div
        className={`relative mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium shadow-pink ${
          isOpenToday
            ? "border-pink-200 bg-pink-50 text-pink-700"
            : "border-ink-100 bg-white text-ink-500"
        }`}
      >
        {isOpenToday ? (
          <Sparkle size={13} color="var(--color-pink-500)" twinkle />
        ) : (
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink-300" />
        )}
        <span className="tabular-nums">{openTodayLabel}</span>
      </div>

      {/* Primary CTA */}
      <div className="relative mt-8 space-y-3">
        <Link
          href="/book"
          className="shadow-pink-lg relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-cta bg-gradient-to-r from-pink-500 to-lilac-500 font-semibold text-white transition-transform active:scale-[0.99]"
          style={{ height: "3.25rem" }}
        >
          <WandIcon size={20} color="#fff" />
          <span>Book an appointment</span>
          <span className="shimmer-sweep" />
        </Link>
        <a
          href={`tel:${salonConfig.phone.replace(/[^\d+]/g, "")}`}
          className="flex h-12 w-full items-center justify-center rounded-cta border border-pink-200 bg-white font-medium text-ink-800 transition-colors hover:border-pink-300"
        >
          Call the studio
        </a>
      </div>

      <p className="relative mt-5 text-xs text-ink-400">{salonConfig.address}</p>
    </header>
  );
}
