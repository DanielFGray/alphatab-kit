/**
 * Chords over lyrics from a Guitar Pro score, for the player to correct before
 * it becomes a lyrics chart (docs/adr/0007). Pure: it reads alphaTab's model
 * and nothing else, so the upload form and the tests share it.
 *
 * Chords and lyrics often sit on different tracks, so both are placed on one
 * timeline: the bars in the order they are played (repeats unrolled), and each
 * beat at its bar's start plus its own start. A chord goes over the syllable
 * sounding when it starts, as a player writes it over a held word; a chord in
 * a rest goes over the next syllable, and one more than a bar before the next
 * line is instrumental and goes on a chord-only line.
 */
import type { model } from "@coderline/alphatab";
import type { MusicalKey } from "./key.ts";
export type ScoreChart = {
    /** Chords over lyrics, in the form `importPasted` reads. */
    readonly text: string;
    /** The key the chords suggest, which the chart is written in. */
    readonly key: MusicalKey | null;
    /** True when the chords were worked out from the notes, not named by the file's author. */
    readonly inferred: boolean;
    /** True when the score has lyrics; without them the chart is chord-only lines. */
    readonly sung: boolean;
};
/**
 * The score as chords over lyrics, or null when it has neither. The chords are
 * the ones the author named when they cover at least half the bars played;
 * otherwise they are worked out from the notes (`inferChords`) and spelled in
 * the key they suggest.
 */
export declare function chartFromScore(score: model.Score): ScoreChart | null;
