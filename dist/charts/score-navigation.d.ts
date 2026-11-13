/**
 * Beat navigation for the score player: the playable beats of every track in
 * playback order, the beat under a playback tick, and the first or last beat
 * of a bar. Pure: alphaTab is used for types only.
 */
import type { model } from "@coderline/alphatab";
/** A beat in playback order, with the tick it starts on and the bar it sits in. */
export interface NavBeat {
    beat: model.Beat;
    startTick: number;
    masterBarIndex: number;
}
/**
 * Every beat of the given tracks, one entry per start tick, sorted by tick.
 * Tracks are scanned in order, so when two tracks have a beat on the same
 * tick, the earlier track's beat is kept.
 */
export declare function collectBeats(tracks: readonly model.Track[]): NavBeat[];
/**
 * Index of the last beat that starts at or before `tick`. Returns 0 when the
 * tick comes before the first beat, and -1 when there are no beats at all.
 * Binary search, so `beats` must already be sorted by `startTick`.
 */
export declare function beatIndexAt(beats: readonly NavBeat[], tick: number): number;
/**
 * The first or last beat of the bar that holds `beats[currentIndex]`, or null
 * when the index is out of range. Stops at the bar boundary, so a bar with
 * one beat returns that beat for both edges.
 */
export declare function barEdgeBeat(beats: readonly NavBeat[], currentIndex: number, edge: "start" | "end"): NavBeat | null;
