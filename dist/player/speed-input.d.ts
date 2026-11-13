import { type Parts } from "./parts.ts";
export type SpeedInputProps = {
    speed: number;
    onSpeed: (speed: number) => void;
    parts?: Parts<"root" | "input">;
};
/**
 * The playback speed as a number the player types, such as 0.75. It holds the
 * typed text until the field loses focus or Enter is pressed, so a half-typed
 * value is not clamped under the player's fingers; Escape puts the speed back.
 */
export declare function SpeedInput({ speed, onSpeed, parts }: SpeedInputProps): import("react").JSX.Element;
