/**
 * Guitar shapes for a spelled chord: every playable way to hold its notes in
 * one hand position, best first. Pure, so the chord panel and the tests share it.
 */
import type { Spelling } from "./spelling.ts";
import { type Voicing } from "./fretting.ts";
/** Open-string pitches as MIDI numbers, lowest string first. */
export declare const STANDARD_TUNING: ReadonlyArray<number>;
/**
 * Playable shapes for a chord, best first, at most 8. A shape is playable when
 * it sounds every required note and no note outside the chord, its lowest note
 * is the bass, at least 3 strings sound (2 for a power chord), its fretted
 * notes lie within 4 frets, and one hand can hold it (`fingersNeeded` ≤ 4).
 */
export declare function voicings(chord: Spelling, tuning?: ReadonlyArray<number>): ReadonlyArray<Voicing>;
