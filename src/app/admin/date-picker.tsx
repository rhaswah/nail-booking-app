"use client";

import { useRouter } from "next/navigation";

/**
 * Native date input that navigates the admin day view.
 * Controlled by the URL (`/admin?date=YYYY-MM-DD`) — no local state needed.
 */
export function DatePicker({ value }: { value: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => {
        if (e.target.value) {
          router.push(`/admin?date=${e.target.value}`);
        }
      }}
      aria-label="Pick a date"
      className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 tabular-nums focus:border-blush-500 focus:outline-none focus:ring-2 focus:ring-blush-200"
    />
  );
}
