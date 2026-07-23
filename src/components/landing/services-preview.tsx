import type { ComponentType } from "react";
import type { Service, ServiceCategory } from "@/lib/booking/types";
import { formatDuration, formatMoney } from "@/lib/format";
import {
  Sparkle,
  HeartIcon,
  NailPolishIcon,
  PaintedNailIcon,
  HandNailsIcon,
  WandIcon,
  type IconProps,
} from "@/components/decor";

interface ServicesPreviewProps {
  categories: ServiceCategory[];
  services: Service[];
}

// Rotating set of themed icons so each category header gets its own little motif.
const CATEGORY_ICONS: ComponentType<IconProps>[] = [
  PaintedNailIcon,
  NailPolishIcon,
  HandNailsIcon,
  WandIcon,
];

export function ServicesPreview({ categories, services }: ServicesPreviewProps) {
  return (
    <section id="services" aria-labelledby="services-heading" className="space-y-6">
      <div>
        <h2
          id="services-heading"
          className="font-display flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink-900"
        >
          <NailPolishIcon size={24} className="text-pink-500" />
          Services
          <Sparkle size={16} color="var(--color-sparkle)" twinkle />
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Transparent pricing — combine any services in a single visit.
        </p>
      </div>

      {categories.map((category, i) => {
        const items = services.filter((s) => s.categoryId === category.id);
        if (items.length === 0) return null;
        const CategoryIcon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
        return (
          <div key={category.id} className="space-y-3">
            <div>
              <h3 className="font-display flex items-center gap-2 text-base font-semibold text-ink-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                  <CategoryIcon size={16} />
                </span>
                {category.name}
              </h3>
              <p className="mt-0.5 text-sm text-ink-500">{category.description}</p>
            </div>

            <ul className="divide-y divide-pink-100 overflow-hidden rounded-card border border-pink-100 bg-white shadow-pink">
              {items.map((service) => (
                <li
                  key={service.id}
                  className="flex items-baseline justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800">
                      {service.name}
                      {service.popular && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 align-middle text-xs font-medium text-pink-700">
                          <HeartIcon size={11} color="var(--color-pink-500)" />
                          Popular
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-ink-400">
                      {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                  <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-pink-700">
                    {formatMoney(service.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
