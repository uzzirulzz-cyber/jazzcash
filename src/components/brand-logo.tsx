'use client';

import { cn } from '@/lib/utils';

/**
 * Stream2Arena brand logo — a circular dark badge with a stylized white "S"
 * and an emerald "live" accent dot. Matches the reference brand identity:
 * dark circle + white S + green accent.
 *
 * Replaces all /logo.png image references with a crisp, scalable inline SVG.
 */
interface BrandLogoProps {
  size?: number;
  className?: string;
  /** Show the wordmark next to the badge */
  withWordmark?: boolean;
  /** Show the tagline under the wordmark */
  withTagline?: boolean;
  /** Variant: "default" (dark badge) | "light" (for dark backgrounds, lighter badge) */
  variant?: 'default' | 'light';
  wordmarkClassName?: string;
  taglineClassName?: string;
}

export function BrandLogo({
  size = 40,
  className,
  withWordmark = false,
  withTagline = false,
  variant = 'default',
  wordmarkClassName,
  taglineClassName,
}: BrandLogoProps) {
  const uniqueId = `s2a-logo-${variant}`;
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Stream2Arena logo"
        className="shrink-0"
      >
        <defs>
          {/* Dark radial gradient for the badge — deep black center, slightly lifted edge */}
          <radialGradient id={`${uniqueId}-bg`} cx="50%" cy="38%" r="70%">
            {variant === 'light' ? (
              <>
                <stop offset="0%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#000000" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#161616" />
                <stop offset="100%" stopColor="#050505" />
              </>
            )}
          </radialGradient>
          {/* Emerald gradient stroke for the ring */}
          <linearGradient id={`${uniqueId}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          {/* Subtle white→emerald gradient for the S glyph */}
          <linearGradient id={`${uniqueId}-s`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e6fff5" />
          </linearGradient>
        </defs>

        {/* Outer emerald ring */}
        <circle
          cx="24"
          cy="24"
          r="22.5"
          stroke={`url(#${uniqueId}-ring)`}
          strokeWidth="1.5"
          fill={`url(#${uniqueId}-bg)`}
        />
        {/* Inner hairline ring for depth */}
        <circle
          cx="24"
          cy="24"
          r="19.5"
          stroke="#ffffff"
          strokeOpacity="0.06"
          strokeWidth="0.75"
          fill="none"
        />

        {/* Stylized "S" — a bold, modern S with a slight forward lean */}
        <path
          d="M30.5 17.2c-1.3-1.7-3.5-2.7-6.3-2.7-3.9 0-6.7 2-6.7 5.1 0 2.7 1.9 4.1 5.6 4.9l2.1 0.45c2.3 0.5 3.2 1.1 3.2 2.3 0 1.4-1.3 2.3-3.5 2.3-2.4 0-3.9-1-4.5-2.8l-3.6 1.4c1.1 3.2 3.9 4.8 8 4.8 4.3 0 7.3-2.1 7.3-5.5 0-2.9-1.8-4.3-5.9-5.2l-2.1-0.46c-2.1-0.47-3-1-3-2.2 0-1.3 1.2-2.1 3.1-2.1 1.9 0 3.2 0.78 3.9 2.2l3.4-1.5z"
          fill={`url(#${uniqueId}-s)`}
        />

        {/* Emerald "live" accent dot — top-right, signals streaming/live */}
        <circle cx="34.5" cy="13.5" r="3" fill="#10b981" />
        <circle cx="34.5" cy="13.5" r="3" fill="#10b981" className="live-dot" opacity="0.6" />
      </svg>

      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-extrabold tracking-tight text-foreground',
              wordmarkClassName,
            )}
          >
            Stream2Arena
          </span>
          {withTagline && (
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500',
                taglineClassName,
              )}
            >
              Live Sports &amp; TV
            </span>
          )}
        </span>
      )}
    </span>
  );
}
