import Link from "next/link";

/**
 * Mobile-only sticky bottom bar. Page content must reserve bottom padding
 * (`pb-28` on mobile) so it clears this bar.
 */
export function StickyBookCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-ink-100 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <Link
        href="/book"
        className="mx-auto flex h-12 w-full max-w-md items-center justify-center rounded-xl bg-blush-500 font-medium text-white active:bg-blush-600"
      >
        Book now
      </Link>
    </div>
  );
}
