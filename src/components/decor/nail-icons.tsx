import type { CSSProperties } from "react";

export interface IconProps {
  /** Pixel size (width & height). Default 24. */
  size?: number;
  /** Color — defaults to currentColor. */
  color?: string;
  className?: string;
  style?: CSSProperties;
  /** Accessible label. If omitted the icon is decorative (aria-hidden). */
  title?: string;
}

function iconBase(size: number, title?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg",
    ...(title
      ? { role: "img" as const, "aria-label": title }
      : { "aria-hidden": true as const }),
  };
}

/** Nail-polish bottle with a little sparkle. */
export function NailPolishIcon({
  size = 24,
  color = "currentColor",
  className,
  style,
  title,
}: IconProps) {
  return (
    <svg {...iconBase(size, title)} fill="none" className={className} style={style}>
      {/* cap */}
      <rect x="10" y="1.5" width="4" height="4.5" rx="1.2" fill={color} />
      {/* neck */}
      <rect x="10.6" y="6" width="2.8" height="2" fill={color} opacity="0.7" />
      {/* body */}
      <path
        d="M8 10.5c0-1.4 1.1-2.5 2.5-2.5h3c1.4 0 2.5 1.1 2.5 2.5v9c0 1.4-1.1 2.5-2.5 2.5h-3A2.5 2.5 0 0 1 8 19.5v-9Z"
        fill={color}
      />
      {/* label shine */}
      <rect x="9.6" y="12" width="4.8" height="4" rx="1" fill="#fff" opacity="0.55" />
      {/* sparkle */}
      <path
        d="M18.5 4c.3 1.4.8 1.9 2.2 2.2-1.4.3-1.9.8-2.2 2.2-.3-1.4-.8-1.9-2.2-2.2 1.4-.3 1.9-.8 2.2-2.2Z"
        fill={color}
        opacity="0.8"
      />
    </svg>
  );
}

/** A single glossy almond-shaped painted nail. */
export function PaintedNailIcon({
  size = 24,
  color = "currentColor",
  className,
  style,
  title,
}: IconProps) {
  return (
    <svg {...iconBase(size, title)} fill="none" className={className} style={style}>
      {/* almond nail */}
      <path
        d="M12 2c3 0 5.2 3 5.2 8.5S15 22 12 22s-5.2-6-5.2-11.5S9 2 12 2Z"
        fill={color}
      />
      {/* half-moon cuticle */}
      <path
        d="M12 19.8c-1.7 0-3-1.1-3-2.5 0-1 1.3-1.8 3-1.8s3 .8 3 1.8c0 1.4-1.3 2.5-3 2.5Z"
        fill="#fff"
        opacity="0.35"
      />
      {/* glossy highlight */}
      <path
        d="M10.4 5.5c-.8 1.6-1.2 3.8-1.2 6"
        stroke="#fff"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/** A hand with painted nails. */
export function HandNailsIcon({
  size = 24,
  color = "currentColor",
  className,
  style,
  title,
}: IconProps) {
  const nail = "var(--color-pink-400)";
  return (
    <svg {...iconBase(size, title)} fill="none" className={className} style={style}>
      {/* palm + fingers */}
      <path
        d="M6.5 12V6.2a1.3 1.3 0 0 1 2.6 0V11m0 0V4.4a1.3 1.3 0 0 1 2.6 0V11m0 0V4.8a1.3 1.3 0 0 1 2.6 0V11m0 0V6.6a1.3 1.3 0 0 1 2.6 0V14c0 4-2.6 7-6.5 7-2.4 0-4-1-5.4-3.2l-2-3.1a1.35 1.35 0 0 1 2.1-1.7L6.5 14.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* painted nail tips */}
      <circle cx="7.8" cy="5.6" r="1.05" fill={nail} />
      <circle cx="10.4" cy="3.8" r="1.05" fill={nail} />
      <circle cx="13" cy="4.2" r="1.05" fill={nail} />
      <circle cx="15.6" cy="6" r="1.05" fill={nail} />
    </svg>
  );
}

/** Magic wand with a star tip and sparkles. */
export function WandIcon({
  size = 24,
  color = "currentColor",
  className,
  style,
  title,
}: IconProps) {
  return (
    <svg {...iconBase(size, title)} fill="none" className={className} style={style}>
      {/* handle */}
      <path
        d="M14 10 4.5 19.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* star tip */}
      <path
        d="M16.5 3.5c.55 2.9 1.6 3.95 4.5 4.5-2.9.55-3.95 1.6-4.5 4.5-.55-2.9-1.6-3.95-4.5-4.5 2.9-.55 3.95-1.6 4.5-4.5Z"
        fill={color}
      />
      {/* little sparkles */}
      <path
        d="M8 4c.25 1.1.6 1.45 1.7 1.7C8.6 5.95 8.25 6.3 8 7.4c-.25-1.1-.6-1.45-1.7-1.7C7.4 5.45 7.75 5.1 8 4Z"
        fill={color}
        opacity="0.7"
      />
      <path
        d="M20 14c.2.9.5 1.2 1.4 1.4-.9.2-1.2.5-1.4 1.4-.2-.9-.5-1.2-1.4-1.4.9-.2 1.2-.5 1.4-1.4Z"
        fill={color}
        opacity="0.7"
      />
    </svg>
  );
}

/** A rounded heart. */
export function HeartIcon({
  size = 24,
  color = "currentColor",
  className,
  style,
  title,
}: IconProps) {
  return (
    <svg {...iconBase(size, title)} fill="none" className={className} style={style}>
      <path
        d="M12 20.5c-.4 0-.8-.14-1.1-.4l-6.2-5.6C2.5 12.5 2 10.2 3.1 8.3 4.5 5.9 7.7 5.5 9.6 7.4l.5.5.5-.5c1.9-1.9 5.1-1.5 6.5.9 1.1 1.9.6 4.2-1.6 6.2l-6.2 5.6c-.3.26-.7.4-1.1.4Z"
        fill={color}
      />
      <path
        d="M8.2 9.4c-.9.1-1.6.7-1.9 1.6"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
