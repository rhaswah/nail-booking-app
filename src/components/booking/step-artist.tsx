"use client";

import type { Staff, StaffSelection } from "@/lib/booking/types";
import { ANY_STAFF } from "@/lib/booking/types";
import { Sparkle, WandIcon } from "@/components/decor";

interface StepArtistProps {
  /** Techs who can perform ALL currently selected services. */
  eligibleStaff: Staff[];
  selection: StaffSelection | null;
  onSelect: (selection: StaffSelection) => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function StepArtist({
  eligibleStaff,
  selection,
  onSelect,
}: StepArtistProps) {
  const cardClass = (selected: boolean) =>
    `w-full rounded-card border p-4 text-left transition-all ${
      selected
        ? "border-pink-500 bg-pink-50 shadow-pink"
        : "border-pink-100 bg-white shadow-pink active:bg-pink-50/50"
    }`;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-500">
        Showing artists who can do everything you picked.
      </p>

      {eligibleStaff.length === 0 && (
        <div className="rounded-card border border-pink-200 bg-pink-50 p-4 text-sm text-pink-700 shadow-pink">
          No single artist offers this exact combination of services. Try
          removing a service, or choose First available and we&apos;ll do our
          best to accommodate you.
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          aria-pressed={selection === ANY_STAFF}
          onClick={() => onSelect(ANY_STAFF)}
          className={cardClass(selection === ANY_STAFF)}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-lilac-500 text-white shadow-pink"
            >
              <WandIcon size={22} className="text-white" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-medium text-ink-800">
                First available
                <Sparkle size={13} color="var(--color-sparkle)" twinkle />
              </p>
              <p className="mt-0.5 text-sm text-ink-500">
                Fastest way in — we&apos;ll match you with a free artist.
              </p>
            </div>
            <SelectedCheck selected={selection === ANY_STAFF} />
          </div>
        </button>

        {eligibleStaff.map((tech) => {
          const selected = selection === tech.id;
          return (
            <button
              key={tech.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(tech.id)}
              className={cardClass(selected)}
            >
              <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white shadow-pink ring-2 ring-white"
                    style={{ backgroundColor: tech.avatarColor }}
                  >
                    {initials(tech.name)}
                  </span>
                  <Sparkle
                    size={14}
                    color="var(--color-sparkle)"
                    twinkle
                    className="absolute -right-0.5 -top-0.5"
                  />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-ink-800">{tech.name}</p>
                  <p className="text-xs font-medium text-pink-700">
                    {tech.role}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink-500">
                    {tech.bio}
                  </p>
                </div>
                <SelectedCheck selected={selected} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectedCheck({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
        selected
          ? "border-pink-500 bg-pink-500 text-white shadow-pink"
          : "border-pink-200 bg-white text-transparent"
      }`}
    >
      {selected ? (
        <Sparkle size={15} color="#fff" />
      ) : (
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
      )}
    </span>
  );
}
