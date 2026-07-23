import type { CSSProperties } from "react";

export interface SparkleProps {
  /** Pixel size (width & height). Default 16. */
  size?: number;
  /** Fill color — defaults to currentColor so it inherits text color. */
  color?: string;
  /** Add the gentle twinkle animation. */
  twinkle?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * <Sparkle> — a crisp 4-point twinkle star with a soft inner glow.
 * Color via `color` prop or surrounding `currentColor`.
 */
export function Sparkle({
  size = 16,
  color = "currentColor",
  twinkle = false,
  className,
  style,
}: SparkleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={[twinkle ? "animate-twinkle" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {/* 4-point concave star */}
      <path
        d="M12 1.5c.7 4.9 2.6 6.8 9 8.5-6.4 1.7-8.3 3.6-9 8.5-.7-4.9-2.6-6.8-9-8.5 6.4-1.7 8.3-3.6 9-8.5Z"
        fill={color}
      />
      {/* soft highlight core */}
      <circle cx="12" cy="10" r="1.6" fill="#fff" opacity="0.65" />
    </svg>
  );
}

export interface SparkleFieldProps {
  /** Number of scattered sparkles. Default 12. */
  count?: number;
  /** Base color for the sparkles. Default soft gold. */
  color?: string;
  className?: string;
}

/**
 * <SparkleField> — absolutely-positioned scatter of twinkling sparkles
 * for decorating a section/hero background. Purely decorative:
 * aria-hidden + pointer-events-none. Place inside a `relative` parent.
 */
export function SparkleField({
  count = 12,
  color = "var(--color-sparkle)",
  className,
}: SparkleFieldProps) {
  // Deterministic pseudo-scatter so SSR + client markup match.
  const stars = Array.from({ length: count }, (_, i) => {
    const seed = (i + 1) * 9301;
    const top = (seed % 97) / 97; // 0..1
    const left = ((seed * 7) % 89) / 89; // 0..1
    const size = 8 + ((seed >> 3) % 12); // 8..19px
    const delay = ((seed >> 5) % 24) / 10; // 0..2.4s
    const dur = 2 + ((seed >> 7) % 18) / 10; // 2..3.7s
    const op = 0.5 + ((seed >> 9) % 5) / 10; // 0.5..0.9
    return { top, left, size, delay, dur, op, key: i };
  });

  return (
    <div
      aria-hidden="true"
      className={["pointer-events-none absolute inset-0 overflow-hidden", className]
        .filter(Boolean)
        .join(" ")}
    >
      {stars.map((s) => (
        <span
          key={s.key}
          className="animate-twinkle absolute"
          style={{
            top: `${s.top * 100}%`,
            left: `${s.left * 100}%`,
            opacity: s.op,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        >
          <Sparkle size={s.size} color={color} />
        </span>
      ))}
    </div>
  );
}
