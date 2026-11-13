import { type Spelling } from "./spelling.ts";
/** A key the chord presses: its pitch, the name the chord spells it with, and its degree. */
export type PianoNote = {
    /** MIDI number: C4 is 60. */
    readonly pitch: number;
    /** The note name as the chord spells it: `Eb`, `F#`, `G`. */
    readonly name: string;
    /** `R`, `3`, `b7` and so on; null for a slash bass the chord does not name. */
    readonly degree: string | null;
};
/**
 * The keys one chord presses, lowest first. They are the notes the staff view
 * stacks, so both views agree on the octave, the spelling and the slash bass.
 * Pure and free of the DOM, so the diagram and the tests share it.
 */
export declare function pianoNotes(chord: Spelling): ReadonlyArray<PianoNote>;
/**
 * The pitches a keyboard drawn for these notes spans: from the white key at or
 * below the lowest note, less one white key, to the white key at or above the
 * highest, plus one. Both ends are white keys, so no black key hangs off an edge.
 */
export declare function keyRange(pitches: ReadonlyArray<number>): {
    readonly low: number;
    readonly high: number;
};
export declare function isBlack(pitch: number): boolean;
