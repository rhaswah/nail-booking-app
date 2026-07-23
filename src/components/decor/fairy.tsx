import type { CSSProperties } from "react";

export interface FairyProps {
  /** Pixel size (width & height). Default 64. */
  size?: number;
  /** Optional accent color for the dress/body. Default pink. */
  color?: string;
  /** Optional wing color. Default lilac. */
  wingColor?: string;
  /** Gentle floating bob animation. */
  float?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * <Fairy> — a cute little winged fairy silhouette holding a wand,
 * with a tiny sparkle trail. Pink dress + lilac wings by default.
 */
export function Fairy({
  size = 64,
  color = "var(--color-pink-400)",
  wingColor = "var(--color-lilac-300)",
  float = false,
  className,
  style,
}: FairyProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={[float ? "animate-float-soft" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {/* Wings (behind body) */}
      <g fill={wingColor} opacity="0.85">
        <path d="M30 30c-6-10-16-14-22-9-5 5-2 15 6 18 6 2 13-2 16-9Z" />
        <path d="M34 30c6-10 16-14 22-9 5 5 2 15-6 18-6 2-13-2-16-9Z" />
      </g>
      <g fill="#fff" opacity="0.35">
        <path d="M28 30c-4-6-11-9-15-6-3 3-1 9 4 11 4 1 9-1 11-5Z" />
        <path d="M36 30c4-6 11-9 15-6 3 3 1 9-4 11-4 1-9-1-11-5Z" />
      </g>

      {/* Body / dress */}
      <path
        d="M32 26c3 0 5 2 6 5l4 14c.5 2-1 3-3 3H25c-2 0-3.5-1-3-3l4-14c1-3 3-5 6-5Z"
        fill={color}
      />
      {/* Legs */}
      <path
        d="M29 47l-1 8m8-8l1 8"
        stroke="var(--color-ink-400)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Head */}
      <circle cx="32" cy="19" r="6.5" fill="#ffe4d1" />
      {/* Hair */}
      <path
        d="M25.5 18c0-5 3-8 6.5-8s6.5 3 6.5 8c-2-2-4-2.5-6.5-2.5S27.5 16 25.5 18Z"
        fill="var(--color-lilac-500)"
      />
      {/* Little halo of hair tufts */}
      <circle cx="26" cy="15.5" r="2" fill="var(--color-lilac-500)" />
      <circle cx="38" cy="15.5" r="2" fill="var(--color-lilac-500)" />
      {/* Cheeks */}
      <circle cx="29" cy="20.5" r="1.2" fill="var(--color-pink-300)" />
      <circle cx="35" cy="20.5" r="1.2" fill="var(--color-pink-300)" />

      {/* Wand arm + wand with star tip */}
      <path
        d="M40 34l9-9"
        stroke="var(--color-sparkle)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 21.5c.5 2.6 1.4 3.5 4 4-2.6.6-3.5 1.5-4 4-.5-2.5-1.4-3.4-4-4 2.6-.5 3.5-1.4 4-4Z"
        fill="var(--color-sparkle)"
      />
      {/* sparkle trail */}
      <circle cx="46" cy="30" r="1" fill="var(--color-sparkle)" opacity="0.8" />
      <circle cx="43" cy="34" r="0.8" fill="var(--color-sparkle)" opacity="0.6" />
    </svg>
  );
}

export interface FairyWingsProps {
  /** Pixel size. Default 40. */
  size?: number;
  /** Wing color. Default lilac. */
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * <FairyWings> — a standalone pair of pretty fairy wings.
 * Nice as a decorative flourish beside a heading or badge.
 */
export function FairyWings({
  size = 40,
  color = "var(--color-lilac-300)",
  className,
  style,
}: FairyWingsProps) {
  return (
    <svg
      width={size}
      height={(size * 3) / 4}
      viewBox="0 0 48 36"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <g fill={color}>
        {/* upper wings */}
        <path d="M24 18C18 5 9 1 4 6c-4 5-1 14 8 16 5 1 10-1 12-4Z" />
        <path d="M24 18C30 5 39 1 44 6c4 5 1 14-8 16-5 1-10-1-12-4Z" />
        {/* lower wings */}
        <path d="M24 18c-4 9-10 12-14 9-3-3-1-9 5-11 4-1 8 0 9 2Z" opacity="0.9" />
        <path d="M24 18c4 9 10 12 14 9 3-3 1-9-5-11-4-1-8 0-9 2Z" opacity="0.9" />
      </g>
      <g fill="#fff" opacity="0.4">
        <path d="M22 16C17 7 10 4 6 7c-3 4-1 10 6 12 4 1 8-1 10-3Z" />
        <path d="M26 16c5-9 12-12 16-9 3 4 1 10-6 12-4 1-8-1-10-3Z" />
      </g>
    </svg>
  );
}
