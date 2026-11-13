/**
 * Chord suggestions for one place in a lyrics chart: what is likely to go between
 * the chord before it and the chord after it, in the chart's key.
 *
 * A chord is reduced to its class, the triad numeral of its root in the key
 * (`V`, `vi`, `bVII`, `vii°`), so one count serves every key. The odds of a
 * class come from this song's own chord changes first, with odds counted over the
 * rock corpus as the fallback, each smoothed toward the one below it
 * (docs/adr/0005). Pure and free of the DOM.
 */
import { type ChartDoc } from "./doc.ts";
import { type KeyScale } from "./numeral.ts";
/** Chord-change counts over a corpus, by class: how often each class follows each other class. */
export type Prior = {
    readonly unigram: Readonly<Record<string, number>>;
    readonly bigram: Readonly<Record<string, Readonly<Record<string, number>>>>;
};
/** The counts this module ships, from the rock corpus (rs200, de Clercq and Temperley, CC BY 4.0). */
export declare const ROCK_PRIOR: Prior;
/** Where the chord goes: the song's chords before it and after it, in reading order. */
export type Slot = {
    readonly key: string;
    readonly before: ReadonlyArray<string>;
    readonly after: ReadonlyArray<string>;
    /** The chord at the same place in an earlier or later section of the same name, and that section's label. */
    readonly repeat?: {
        readonly chord: string;
        readonly section: string;
    } | null;
};
export type Suggestion = {
    readonly chord: string;
    /** The chord's numeral before the chord that follows, so an applied chord reads V7/vi. */
    readonly numeral: string | null;
    /** Why it is offered, in a few words. */
    readonly reason: string;
};
/** How strongly each layer leans on the one below it, in pseudo-counts. Fitted on the rock corpus by scripts/checkSuggestions.ts. */
export declare const WEIGHTS: {
    song: number;
    corpus: number;
    trigram: number;
};
/**
 * Chords for `slot`, best first, in two lists with no chord in both. `likely`
 * holds the chords the song uses: the chord at the same place in a repeated
 * section first, then the rest by P(class | chords before) × P(next chord | class).
 * `fresh` holds the chords the song does not use yet: the best `limit` of them
 * by the same odds, then any of the key's own chords not among them, so every
 * unused chord of the key is offered.
 *
 * The two lists exist because the song's own counts favour the chords it already
 * has: on the rock corpus, ranking only the unused chords finds a chord new to
 * the song far more often than the full ranking does (docs/adr/0005).
 */
export declare function suggest(slot: Slot, limit?: number, prior?: Prior, weights?: {
    song: number;
    corpus: number;
    trigram: number;
}): {
    readonly likely: ReadonlyArray<Suggestion>;
    readonly fresh: ReadonlyArray<Suggestion>;
};
/**
 * The slot at column `at` of lyric line `line`: the chart's chords before and
 * after it in reading order, leaving out a chord already at `at` (the one being
 * replaced).
 *
 * The repeat comes from the nearest other section with the same name ("Verse 1"
 * and "Verse 2" share a name), from its lyric line with the same number: its
 * chord X counts when this line's chords, with X at `at`, and that line's chords
 * agree as far as the shorter of them goes. So a line being written left to
 * right follows the other verse, and a word that has no chord in the other verse
 * gets no repeat.
 */
export declare function chartSlot(doc: ChartDoc, key: string, line: number, at: number): Slot;
/**
 * The class of a chord in a key: its root's degree with the case and mark of its
 * triad (`V`, `vi`, `vii°`, `bIII+`). A sus or power chord counts as major. Null
 * for a name that does not spell, such as N.C.
 */
export declare function chordClass(chord: string, scale: KeyScale): string | null;
/**
 * Every class the corpus or the song has, most likely first, for a slot between
 * the classes `before` and `after` (each a run of chord changes).
 */
export declare function rankClasses(before: ReadonlyArray<string>, after: ReadonlyArray<string>, prior: Prior, weights?: {
    song: number;
    corpus: number;
    trigram: number;
}): ReadonlyArray<string>;
/** A run of classes with each held chord counted once: C C G reads as one change, C to G. */
export declare function changes(classes: ReadonlyArray<string>): ReadonlyArray<string>;
