import { type PitchClass, type Spelling } from "./spelling.ts";
/** Which of a chord's two names a chart shows: the name, the numeral, or both. */
export type NumeralDisplay = "names" | "numerals" | "both";
/**
 * Returns the Roman numeral for `chord` in `key`, or null when the key is null or
 * either name cannot be read.
 *
 * The degree counts semitones from the tonic against the major scale, in minor
 * keys too, so C in A minor is bIII (the rock-corpus convention). Case shows the
 * 3rd: lowercase for minor. Diminished reads °, half-diminished ø7, augmented +.
 * A slash bass that is the 3rd, 5th or 7th of a triad or seventh chord reads as
 * figured bass (V6, V65, I64); any other slash bass reads as its key degree in
 * Arabic numerals (Iadd9/3, IV/5).
 *
 * `next` is the chord that follows. A chord outside the key that resolves to it
 * (a dominant a 5th above it, or a diminished chord a half step below) reads as
 * an applied chord: A7 then D in G is V7/V. Without that resolution the chord
 * keeps its own degree, so A7 then C in G stays II7. See appliedTo.
 */
export declare function numeral(chord: string, key: string | null, next?: string | null): string | null;
/**
 * The numeral of each of `chords`, given in reading order. Each is read against
 * the next chord with another name, so an applied chord shows as one.
 */
export declare function chordNumerals(chords: ReadonlyArray<string>, key: string | null): ReadonlyArray<string | null>;
/** The tonic, and the pitch classes a chord may use and still count as in the key. */
export type KeyScale = {
    readonly tonic: PitchClass;
    readonly minor: boolean;
    readonly pitches: ReadonlySet<PitchClass>;
};
/**
 * Reads a key name ("G", "F#m"). A minor key holds the natural minor scale plus
 * the raised 7th, so its V and vii° are in the key, as in harmonic minor.
 */
export declare function keyScale(key: string): KeyScale | null;
/** True when every note of the chord is in the key. */
export declare function inKey(spelling: Spelling, scale: KeyScale): boolean;
/** Roman numeral names for each semitone above the tonic. */
export declare const DEGREE_NAME: ReadonlyArray<string>;
/** Letters above the tonic's letter for each numeral. */
export declare const ROMAN_STEP: Readonly<Record<string, number>>;
/** The note at `pitch` as the key spells its degree (`DEGREE_NAME`): Db in Ab, A# in E, Bb in C. */
export declare function noteInKey(pitch: PitchClass, key: string): string;
