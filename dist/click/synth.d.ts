/**
 * Synthetic mic recordings for the listener's tests: the click as a room and
 * a cheap speaker colour it, and instrument notes with known start frames.
 */
export declare const SAMPLE_RATE = 48000;
/** A small deterministic random source, so a failing test fails the same way twice. */
export declare const random: (seed: number) => () => number;
/** Adds `sound` into `signal` from frame `at` on, times `gain`. */
export declare const mix: (signal: Float32Array, sound: Float32Array, at: number, gain?: number) => void;
/** Adds the room click into `signal` so that it sounds at frame `at`, times `gain`. */
export declare const mixClick: (signal: Float32Array, at: number, gain: number) => void;
/** The click as the mic hears it from a speaker: some distortion, then three room reflections. */
export declare const roomClick: (sampleRate: number) => Float32Array;
export declare const noise: (length: number, level: number, seed: number) => Float32Array;
/** A drum hit: a decaying noise burst over a low decaying thump. */
export declare const drum: (sampleRate: number, seed: number) => Float32Array;
/** A plucked string by Karplus-Strong: a noise burst through a damped delay line. */
export declare const pluck: (sampleRate: number, pitchHz: number, seed: number) => Float32Array;
/** A piano-like note: decaying harmonics after a 2 ms attack, with a short hammer knock. */
export declare const keyNote: (sampleRate: number, pitchHz: number, seed: number) => Float32Array;
/**
 * A bass note: a fundamental under the thump band (see click.ts) with five
 * harmonics, swelling over a 15 ms attack, as a finger on a heavy string does.
 * Most of its energy lies where the listener does not look.
 */
export declare const bassNote: (sampleRate: number, pitchHz: number) => Float32Array;
