import type { TrackOption } from "../charts/score-tracks.ts";
import { type Parts } from "./parts.ts";
export type TrackSelectProps = {
    tracks: ReadonlyArray<TrackOption>;
    /** The index of the selected track, as in `TrackOption.index`. */
    track: number;
    disabled?: boolean;
    onTrack: (index: number) => void;
    parts?: Parts<"root" | "select">;
};
/** A labelled dropdown of the score's tracks. The app decides when to show it; with one track it is noise. */
export declare function TrackSelect({ tracks, track, disabled, onTrack, parts }: TrackSelectProps): import("react").JSX.Element;
