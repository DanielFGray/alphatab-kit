/**
 * Turns frames into timing. The mic hears the click and the player on one
 * clock, so a note's error is its arrival minus the click's arrival. Output
 * and input latency appear in both and cancel out.
 */
/** Notes per beat that the player aims at: 1 for quarter notes at a 4/4 beat, 2 for eighths, and so on. */
export type Subdivision = 1 | 2 | 3 | 4;
export interface Hit {
    /** Signed error in milliseconds: negative is early, positive is late. */
    readonly offsetMs: number;
    /** Beats since the first beat after the count-in. */
    readonly beat: number;
    /** Which note within the beat the hit aimed at, from 0. */
    readonly step: number;
}
/**
 * Places a note on the nearest grid point. `atMs` is the note's time after
 * the first beat after the count-in, as the mic heard that beat.
 */
export declare const placeHit: (atMs: number, beatMs: number, subdivision: Subdivision) => Hit;
/**
 * The listener's delay on the clean click: the frame it reports minus the
 * frame where the click sounds (CLICK_ONSET_SECONDS into the waveform).
 * Subtracting it from each measured arrival gives the time the click sounded
 * at the mic.
 */
export declare const clickBias: (sampleRate: number) => number;
export declare const median: (values: ReadonlyArray<number>) => number;
export interface Summary {
    readonly count: number;
    /** Mean error: negative means the player rushes, positive means the player drags. */
    readonly meanMs: number;
    /** Standard deviation of the error: how consistent the player is. */
    readonly spreadMs: number;
    /** Share of hits within ±10 ms, from 0 to 1. */
    readonly tight: number;
}
export declare const TIGHT_MS = 10;
export declare const summarize: (hits: ReadonlyArray<Pick<Hit, "offsetMs">>) => Summary;
