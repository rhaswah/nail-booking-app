"use client";

import type { Staff, StaffSelection } from "@/lib/booking/types";
import { ANY_STAFF } from "@/lib/booking/types";

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
    `w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
      selected ? "border-blush-500 bg-blush-50" : "border-ink-100 bg-white"
    }`;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-500">
        Showing artists who can do everything you picked.
      </p>

      {eligibleStaff.length === 0 && (
        <div className="rounded-2xl border border-blush-200 bg-blush-50 p-4 text-sm text-blush-700">
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
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blush-100 text-blush-700"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="font-medium">First available</p>
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
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: tech.avatarColor }}
                >
                  {initials(tech.name)}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{tech.name}</p>
                  <p className="text-xs text-blush-700">{tech.role}</p>
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
  );
}
