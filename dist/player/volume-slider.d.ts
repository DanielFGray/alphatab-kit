import { type Parts } from "./parts.ts";
export type VolumeSliderProps = {
    /** The track volume, from MIN_VOLUME to MAX_VOLUME. */
    volume: number;
    disabled?: boolean;
    onVolume: (volume: number) => void;
    parts?: Parts<"root" | "input">;
};
/** A labelled range input for the volume, in steps of 0.05. */
export declare function VolumeSlider({ volume, disabled, onVolume, parts }: VolumeSliderProps): import("react").JSX.Element;
