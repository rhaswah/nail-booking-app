import { salonConfig, type Weekday } from "@/lib/salon.config";
import { formatDayHours } from "@/components/landing/opening-hours";
import { Sparkle, PaintedNailIcon } from "@/components/decor";

/** Display order Monday → Sunday (JS weekday indices). */
const DAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const DAY_NAMES: Record<Weekday, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export function HoursLocationCard({ todayWeekday }: { todayWeekday: Weekday }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${salonConfig.name} ${salonConfig.address}`,
  )}`;

  return (
    <section aria-labelledby="hours-heading" className="space-y-4">
      <h2
        id="hours-heading"
        className="font-display flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink-900"
      >
        <PaintedNailIcon size={24} className="text-pink-500" />
        Hours &amp; location
        <Sparkle size={16} color="var(--color-sparkle)" twinkle />
      </h2>

      <div className="rounded-card border border-pink-100 bg-white p-4 shadow-pink">
        <ul className="space-y-2">
          {DAY_ORDER.map((day) => {
            const hours = salonConfig.openingHours[day];
            const isToday = day === todayWeekday;
            return (
              <li
                key={day}
                className={`flex items-center justify-between gap-4 text-sm ${
                  isToday ? "font-semibold text-ink-900" : "text-ink-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  {DAY_NAMES[day]}
                  {isToday && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700">
                      <Sparkle size={10} color="var(--color-pink-500)" />
                      Today
                    </span>
                  )}
                </span>
                <span
                  className={`text-right tabular-nums ${
                    !hours && !isToday ? "text-ink-400" : ""
                  }`}
                >
                  {hours ? formatDayHours(hours) : "Closed"}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Sparkle divider */}
        <div
          aria-hidden
          className="my-4 flex items-center gap-2 text-pink-200"
        >
          <span className="h-px flex-1 bg-pink-100" />
          <Sparkle size={13} color="var(--color-pink-300)" twinkle />
          <span className="h-px flex-1 bg-pink-100" />
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-ink-800">{salonConfig.name}</p>
            <p className="mt-0.5 text-sm leading-6 text-ink-500">{salonConfig.address}</p>
          </div>
          <div className="flex gap-3 text-sm font-medium text-pink-700">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Get directions
            </a>
            <span aria-hidden className="text-pink-200">
              ·
            </span>
            <a
              href={`tel:${salonConfig.phone.replace(/[^\d+]/g, "")}`}
              className="tabular-nums underline-offset-4 hover:underline"
            >
              {salonConfig.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
