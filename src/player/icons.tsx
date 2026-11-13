/**
 * Icons for the player controls. Each draws with `currentColor`, so the app's
 * text color colors it, and takes an optional `className`. The kit ships no CSS,
 * so an app that wants a spinning or differently sized icon passes its own
 * classes here (for example `animate-spin`) rather than relying on the kit.
 */

export type IconProps = { className?: string }

/** 16 px square by default; a `className` with a size class overrides these attributes. */
const iconBase = { width: 16, height: 16, viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": true } as const

export const PlayIcon = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}>
    <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.34-5.89a1.5 1.5 0 0 0 0-2.54L6.3 2.84Z" />
  </svg>
)

export const PauseIcon = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}>
    <path d="M5 3.75C5 3.34 5.34 3 5.75 3h1.5c.41 0 .75.34.75.75v12.5c0 .41-.34.75-.75.75h-1.5a.75.75 0 0 1-.75-.75V3.75Zm7 0c0-.41.34-.75.75-.75h1.5c.41 0 .75.34.75.75v12.5c0 .41-.34.75-.75.75h-1.5a.75.75 0 0 1-.75-.75V3.75Z" />
  </svg>
)

export const StopIcon = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}>
    <rect x="4" y="4" width="12" height="12" rx="2" />
  </svg>
)

/** A metronome: a tapering case with a tilted arm. */
export const MetronomeIcon = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}>
    <path d="M7.4 2h5.2l3 14.2c.2.9-.5 1.8-1.5 1.8H5.9c-1 0-1.7-.9-1.5-1.8L7.4 2Zm1.2 1.8L6.2 15.8h7.6L11.4 3.8H8.6Z" />
    <path d="M10.8 6.2 12.4 7 9.9 13.1 8.4 12.4l2.4-6.2Z" />
  </svg>
)

/** Four beats before the score starts, drawn as four dots. */
export const CountInIcon = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}>
    <circle cx="4" cy="10" r="1.8" />
    <circle cx="8.7" cy="10" r="1.8" />
    <circle cx="13.3" cy="10" r="1.8" />
    <circle cx="18" cy="10" r="1.8" />
  </svg>
)

/** A speaker with sound waves, for the track volume. */
export const VolumeIcon = ({ className }: IconProps) => (
  <svg {...iconBase} className={className}>
    <path d="M10 3.75a.75.75 0 00-1.264-.546L5.203 6H2.667a.75.75 0 00-.7.48A6.985 6.985 0 001.5 10c0 1.252.328 2.429.906 3.45a.75.75 0 00.761.55h2.036l3.533 2.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 010 7.778.75.75 0 001.06 1.06 7 7 0 000-9.899z" />
    <path d="M13.829 7.172a.75.75 0 00-1.061 1.06 2.5 2.5 0 010 3.536.75.75 0 001.06 1.06 4 4 0 000-5.656z" />
  </svg>
)

/**
 * A ring with one arc, for work in progress. It draws at the default 16 px like
 * the others; pass `animate-spin` in `className` to turn it.
 */
export const LoadingSpinner = ({ className }: IconProps) => (
  <svg {...iconBase} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
    <path
      opacity={0.75}
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)
