import type { Staff } from "@/lib/booking/types";
import { Sparkle, HandNailsIcon } from "@/components/decor";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ArtistsStrip({ staff }: { staff: Staff[] }) {
  return (
    <section aria-labelledby="artists-heading" className="space-y-4">
      <div>
        <h2
          id="artists-heading"
          className="font-display flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink-900"
        >
          <HandNailsIcon size={24} className="text-pink-500" />
          Meet the artists
          <Sparkle size={16} color="var(--color-sparkle)" twinkle />
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Pick a favorite when you book — or choose any available technician.
        </p>
      </div>

      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {staff.map((tech) => (
          <li
            key={tech.id}
            className="w-44 shrink-0 snap-start space-y-2.5 rounded-card border border-pink-100 bg-white p-4 shadow-pink"
          >
            <span className="relative inline-flex">
              <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white shadow-pink"
                style={{ backgroundColor: tech.avatarColor }}
              >
                {initials(tech.name)}
              </span>
              <Sparkle
                size={13}
                color="var(--color-sparkle)"
                twinkle
                className="absolute -right-1 -top-1"
              />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-800">{tech.name}</p>
              <p className="mt-0.5 text-xs font-medium text-pink-600">{tech.role}</p>
            </div>
            <p className="text-xs leading-5 text-ink-500">{tech.bio}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
