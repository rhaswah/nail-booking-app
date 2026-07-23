import type { Service, ServiceCategory } from "@/lib/booking/types";
import { formatDuration, formatMoney } from "@/lib/format";

interface ServicesPreviewProps {
  categories: ServiceCategory[];
  services: Service[];
}

export function ServicesPreview({ categories, services }: ServicesPreviewProps) {
  return (
    <section id="services" aria-labelledby="services-heading" className="space-y-6">
      <div>
        <h2
          id="services-heading"
          className="text-2xl font-semibold tracking-tight text-ink-900"
        >
          Services
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Transparent pricing — combine any services in a single visit.
        </p>
      </div>

      {categories.map((category) => {
        const items = services.filter((s) => s.categoryId === category.id);
        if (items.length === 0) return null;
        return (
          <div key={category.id} className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-ink-800">{category.name}</h3>
              <p className="mt-0.5 text-sm text-ink-500">{category.description}</p>
            </div>

            <ul className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white shadow-sm">
              {items.map((service) => (
                <li
                  key={service.id}
                  className="flex items-baseline justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800">
                      {service.name}
                      {service.popular && (
                        <span className="ml-2 inline-block rounded-full bg-blush-100 px-2 py-0.5 align-middle text-xs text-blush-700">
                          Popular
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-ink-400">
                      {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                  <span className="shrink-0 text-right text-sm font-medium tabular-nums text-ink-800">
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
