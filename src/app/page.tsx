import { getProvider } from "@/lib/booking/provider";
import { salonConfig, type Weekday } from "@/lib/salon.config";
import { salonDateISO } from "@/lib/format";
import { Hero } from "@/components/landing/hero";
import { ServicesPreview } from "@/components/landing/services-preview";
import { ArtistsStrip } from "@/components/landing/artists-strip";
import { HoursLocationCard } from "@/components/landing/hours-location-card";
import { StickyBookCta } from "@/components/landing/sticky-book-cta";
import { formatDayHours } from "@/components/landing/opening-hours";

// "Open today" status + hours highlight depend on the current date in the
// salon timezone — render per request, never bake at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const provider = getProvider();
  const [categories, services, staff] = await Promise.all([
    provider.getCategories(),
    provider.getServices(),
    provider.getStaff(),
  ]);

  // Today's weekday in the salon timezone (plain date → timezone-safe weekday).
  const todayWeekday = new Date(`${salonDateISO()}T12:00:00Z`).getUTCDay() as Weekday;
  const todayHours = salonConfig.openingHours[todayWeekday];
  const openTodayLabel = todayHours
    ? `Open today · ${formatDayHours(todayHours)}`
    : "Closed today";

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 sm:px-6 sm:pb-16">
      <Hero openTodayLabel={openTodayLabel} isOpenToday={todayHours !== null} />

      <div className="space-y-12">
        <ServicesPreview categories={categories} services={services} />
        <ArtistsStrip staff={staff} />
        <HoursLocationCard todayWeekday={todayWeekday} />

        <footer className="pb-2 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} {salonConfig.name} · {salonConfig.address}
        </footer>
      </div>

      <StickyBookCta />
    </main>
  );
}
