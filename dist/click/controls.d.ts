import { type Parts } from "../player/parts.ts";
import type { Subdivision } from "./timing.ts";
import type { Mic } from "./use-click-track.ts";
export declare const MIN_BPM = 30;
export declare const MAX_BPM = 300;
/** The bar lengths the bar picker offers, in clicks. */
export declare const MAX_BEATS_PER_BAR = 12;
export type ClickButtonProps = {
    /** What the button starts: "Click", "Listen". */
    label: string;
    pressed: boolean;
    /** The take's beat (`Take.beat`), shown as the place in the bar while pressed. */
    beat: number | null;
    beatsPerBar: number;
    onToggle: () => void;
    parts?: Parts<"root">;
};
/**
 * Starts and stops one click mode. While pressed it counts the bar, "Listen · 3",
 * and carries the beat in `data-beat` for a stylesheet that flashes on the click.
 */
export declare function ClickButton({ label, pressed, beat, beatsPerBar, onToggle, parts }: ClickButtonProps): import("react").JSX.Element;
export type BpmInputProps = {
    bpm: number;
    onBpm: (bpm: number) => void;
    parts?: Parts<"root" | "input">;
};
/**
 * The click's tempo, typed. Like the speed input, it holds the typed text
 * until the field loses focus or Enter is pressed, because each change of
 * tempo restarts the take; Escape puts the tempo back.
 */
export declare function BpmInput({ bpm, onBpm, parts }: BpmInputProps): import("react").JSX.Element;
/** A tempo the click plays: a whole number of beats per minute within MIN_BPM and MAX_BPM. */
export declare const clampBpm: (bpm: number) => number;
export type BeatsPerBarSelectProps = {
    beatsPerBar: number;
    onBeatsPerBar: (beatsPerBar: number) => void;
    parts?: Parts<"root" | "select">;
};
/** Clicks in a bar, from 1 to MAX_BEATS_PER_BAR. */
export declare function BeatsPerBarSelect({ beatsPerBar, onBeatsPerBar, parts }: BeatsPerBarSelectProps): import("react").JSX.Element;
export type SubdivisionSelectProps = {
    subdivision: Subdivision;
    onSubdivision: (subdivision: Subdivision) => void;
    parts?: Parts<"root" | "select">;
};
/** The grid the notes are scored against, in notes per click. */
export declare function SubdivisionSelect({ subdivision, onSubdivision, parts }: SubdivisionSelectProps): import("react").JSX.Element;
export type MicPickerProps = {
    /** `UseClickTrack.mics`. */
    mics: ReadonlyArray<Mic>;
    /** The chosen mic, or null for the browser's default. */
    micId: string | null;
    onMic: (micId: string | null) => void;
    parts?: Parts<"root" | "select">;
};
/**
 * The input to listen on. A chosen mic the browser does not list (unplugged,
 * or the list not read yet) stays chosen and shows as "Chosen microphone", so a
 * saved choice is not lost on a page load.
 */
export declare function MicPicker({ mics, micId, onMic, parts }: MicPickerProps): import("react").JSX.Element;
