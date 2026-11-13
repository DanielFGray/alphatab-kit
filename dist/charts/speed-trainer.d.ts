/**
 * The speed trainer repeats a passage and plays it a little faster each time.
 * This is the arithmetic: pure and free of the DOM, so the player and the tests
 * share it.
 */
/** How much a trainer step adds: a percentage of the current speed, or beats per minute of the song's tempo. */
export type StepMode = "percent" | "bpm";
export declare const MIN_SPEED = 0.25;
export declare const MAX_SPEED = 3;
/** A speed inside what alphaTab plays well, rounded to a thousandth. */
export declare function clampSpeed(speed: number): number;
/**
 * The speed for the next round. A percent step multiplies the current speed; a
 * BPM step adds that many beats per minute to the song's tempo, so it needs the
 * tempo and leaves the speed alone without one.
 */
export declare function nextSpeed(current: number, mode: StepMode, step: number, tempo: number | null): number;
/** Minutes and seconds of a time in milliseconds: `3:07`. */
export declare function formatClock(ms: number): string;
