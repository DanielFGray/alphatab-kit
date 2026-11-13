import { type Spelling } from "./spelling.ts";
export type StaffNote = {
    readonly letter: string;
    /** Sharps or flats from the letter's natural pitch, -3 (triple flat) to 3 (triple sharp). */
    readonly accidental: number;
    /** Scientific pitch octave: the root sits in 4, extensions above it in 5 and higher. */
    readonly octave: number;
    /** Chord degree the note spells, or null for a slash bass outside the chord. */
    readonly degree: number | null;
};
/**
 * The chord's tones as stacked whole notes on a treble staff, bottom to top.
 * Every tone in spelling.tones sounds, required and optional alike: the staff
 * is a theory picture, the same for every instrument. Degree d sits d-1
 * letter steps above the root, so 9, 11 and 13 sit above the octave; a 6th
 * spells as a 13th and so draws above the octave too. A slash bass different
 * from the root sounds first, at the nearest pitch below the root.
 */
export declare function staffNotes(spelling: Spelling): ReadonlyArray<StaffNote>;
/** The note's height in letter steps from C0: one step per line or space of the staff. */
export declare function staffStep(note: StaffNote): number;
/**
 * Which side of the stem line each note sits on, bottom to top, for notes a
 * second apart. A note a step above the note below it takes the opposite side
 * from that note; a note that starts such a run takes "left"; any other note
 * is "center".
 */
export declare function staffSides(steps: ReadonlyArray<number>): ReadonlyArray<"left" | "right" | "center">;
