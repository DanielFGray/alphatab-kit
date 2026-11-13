/**
 * Icons for the player controls. Each draws with `currentColor`, so the app's
 * text color colors it, and takes an optional `className`. The kit ships no CSS,
 * so an app that wants a spinning or differently sized icon passes its own
 * classes here (for example `animate-spin`) rather than relying on the kit.
 */
export type IconProps = {
    className?: string;
};
export declare const PlayIcon: ({ className }: IconProps) => import("react").JSX.Element;
export declare const PauseIcon: ({ className }: IconProps) => import("react").JSX.Element;
export declare const StopIcon: ({ className }: IconProps) => import("react").JSX.Element;
/** A metronome: a tapering case with a tilted arm. */
export declare const MetronomeIcon: ({ className }: IconProps) => import("react").JSX.Element;
/** Four beats before the score starts, drawn as four dots. */
export declare const CountInIcon: ({ className }: IconProps) => import("react").JSX.Element;
/** A speaker with sound waves, for the track volume. */
export declare const VolumeIcon: ({ className }: IconProps) => import("react").JSX.Element;
/**
 * A ring with one arc, for work in progress. It draws at the default 16 px like
 * the others; pass `animate-spin` in `className` to turn it.
 */
export declare const LoadingSpinner: ({ className }: IconProps) => import("react").JSX.Element;
