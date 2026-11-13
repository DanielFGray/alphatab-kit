/**
 * Chords worked out from the notes of a Guitar Pro score, for a file whose
 * author named none (docs/adr/0007). Pure: it reads alphaTab's model and
 * nothing else.
 *
 * Each bar is heard as pitch classes weighted by how long they sound on every
 * pitched track, and by the lowest note sounding. Every root with every
 * quality is scored against that: its notes count for it, notes outside it
 * count against it, a chord note that never sounds costs, and the lowest note
 * on the root adds. A bar is split into halves when two chords explain it
 * clearly better than one.
 */
import type { model } from "@coderline/alphatab";
import { type PitchClass } from "./spelling.ts";
/** A chord without a name yet: the name depends on the song's key. */
export type HeardChord = {
    readonly at: number;
    readonly root: PitchClass;
    readonly quality: Quality;
};
/** A plain major or minor triad, or a power chord (root and fifth). */
export type Quality = "" | "m" | "5";
/**
 * One or two chords for each bar in `played`, the bars in playing order with
 * `at` their start in ticks. A bar where nothing sounds gets none.
 */
export declare function inferChords(score: model.Score, played: ReadonlyArray<{
    readonly bar: model.MasterBar;
    readonly at: number;
}>): Array<HeardChord>;
