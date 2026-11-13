/**
 * Reading a phrase: a short piece of real notation in a lyrics chart, written
 * in alphaTex (docs/adr/0003). The browser draws and plays the score this
 * gives; it needs no DOM, so tests read phrases directly.
 */
import { model, Settings } from "@coderline/alphatab";
/** A place in the alphaTex where alphaTab stopped reading, 1-based. */
export type PhraseProblem = {
    readonly line: number;
    readonly column: number;
    readonly message: string;
};
export type ReadPhrase = {
    readonly score: model.Score;
} | {
    readonly problems: ReadonlyArray<PhraseProblem>;
};
/**
 * The score of a phrase. With a `tempo` (the song's, or its setlist entry's),
 * the phrase starts at that tempo whatever its own text says, so it plays at
 * the speed the band plays the song.
 */
export declare function readPhrase(tex: string, tempo: number | null, settings?: Settings): ReadPhrase;
