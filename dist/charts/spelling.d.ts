/**
 * Reads a chord name into the pitch classes a guitar shape must hold and the ones it
 * may leave out. Pure and free of the DOM, so the view and the tests share it.
 */
/** 0 = C … 11 = B */
export type PitchClass = number;
export type Spelling = {
    readonly root: PitchClass;
    /** The lowest note a shape must sound: the slash note, or the root. */
    readonly bass: PitchClass;
    /** The letter the root was written with: Eb gives E. */
    readonly rootLetter: string;
    /** The letter the bass was written with: D/F# gives F. Without a slash it is the root letter. */
    readonly bassLetter: string;
    /** Notes every shape must hold. Includes root and bass. */
    readonly required: ReadonlyArray<PitchClass>;
    /** Notes a shape may hold or leave out. Disjoint from required. */
    readonly optional: ReadonlyArray<PitchClass>;
    /** Chord degree -> semitones above the root, as the name spelled it. */
    readonly tones: ReadonlyMap<number, number>;
};
export declare function spell(name: string): Spelling | null;
/** Each letter's natural pitch class. */
export declare const NATURALS: Readonly<Record<string, PitchClass>>;
/**
 * The note at `pitch`, spelled on the scale step `step` letters above the tonic's
 * letter: bVI in G is Eb, not D#. A spelling players do not write (Cb, Fb, B#, E#,
 * or a double accidental) gives way to the plain name on the key's side.
 */
export declare function spellNote(pitch: PitchClass, step: number, key: string): string;
