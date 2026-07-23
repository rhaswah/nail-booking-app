"use client";

import type { Service, ServiceCategory } from "@/lib/booking/types";
import { formatDuration, formatMoney } from "@/lib/format";

interface StepServicesProps {
  categories: ServiceCategory[];
  services: Service[];
  selectedIds: string[];
  onToggle: (serviceId: string) => void;
}

export default function StepServices({
  categories,
  services,
  selectedIds,
  onToggle,
}: StepServicesProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-500">
        Pick one or more services — mix and match a mani, pedi, and add-ons in a
        single visit.
      </p>

      {categories.map((cat) => {
        const catServices = services.filter((s) => s.categoryId === cat.id);
        if (catServices.length === 0) return null;
        return (
          <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
            <h2
              id={`cat-${cat.id}`}
              className="text-lg font-semibold tracking-tight"
            >
              {cat.name}
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">{cat.description}</p>
            <div className="mt-3 space-y-3">
              {catServices.map((s) => {
                const selected = selectedIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggle(s.id)}
                    className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                      selected
                        ? "border-blush-500 bg-blush-50"
                        : "border-ink-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{s.name}</span>
                          {s.popular && (
                            <span className="rounded-full bg-blush-100 px-2 py-0.5 text-xs text-blush-700">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-ink-500">
                          {s.description}
                        </p>
                        <p className="mt-1.5 text-xs text-ink-400 tabular-nums">
                          {formatDuration(s.durationMinutes)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-right font-semibold tabular-nums">
                          {formatMoney(s.priceCents)}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                            selected
                              ? "border-blush-500 bg-blush-500 text-white"
                              : "border-ink-200 bg-white text-transparent"
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
