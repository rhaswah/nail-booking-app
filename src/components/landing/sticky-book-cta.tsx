import Link from "next/link";
import { WandIcon } from "@/components/decor";

/**
 * Mobile-only sticky bottom bar. Page content must reserve bottom padding
 * (`pb-28` on mobile) so it clears this bar.
 */
export function StickyBookCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-pink-100 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <Link
        href="/book"
        className="shadow-pink relative mx-auto flex h-12 w-full max-w-md items-center justify-center gap-2 overflow-hidden rounded-cta bg-gradient-to-r from-pink-500 to-lilac-500 font-semibold text-white transition-transform active:scale-[0.99]"
      >
        <WandIcon size={18} color="#fff" />
        <span>Book now</span>
        <span className="shimmer-sweep" />
      </Link>
    </div>
  );
}
