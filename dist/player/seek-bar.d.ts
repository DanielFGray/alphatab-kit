import { type Parts } from "./parts.ts";
export type SeekBarProps = {
    positionMs: number;
    endMs: number;
    disabled?: boolean;
    onSeek: (ms: number) => void;
    parts?: Parts<"root" | "time" | "range">;
};
/**
 * The elapsed and total time with a range input to seek. With no length
 * (`endMs` 0) the range is inert, so a score not yet loaded cannot be seeked.
 */
export declare function SeekBar({ positionMs, endMs, disabled, onSeek, parts }: SeekBarProps): import("react").JSX.Element;
