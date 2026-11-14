/**
 * Scoring a take against written notes: each written onset (a moment the
 * score asks for one or more notes, such as `ScoreOnset`) is paired with the
 * note the player played for it, so the score itself says which beat a note
 * aimed at. Rests, ties and syncopation need no grid.
 *
 * The listener hears notes that start within MERGE_SECONDS of each other as
 * one, timed at the first of them or at the loudest. So written onsets that
 * close (a grace note and its beat, a flam) form one group: they share one
 * played note, timed from the onset in the group it lands nearest.
 *
 * Each group reaches halfway to its neighbours, and no further than
 * MAX_REACH_MS. The reaches do not overlap, so a played note belongs to one
 * group at most, and the pairs keep their order. Within a reach the played
 * note closest to the group is the one played for it; other notes there are
 * extra, and a group with no note in its reach was missed.
 *
 * Fixed reaches assume the player is off by less than half the gap between
 * notes: 16th notes at 200 BPM are 75 ms apart, so a note 40 ms late is paired
 * with the next onset, as 35 ms early.
 */
/** One written onset and the note played for it. */
export type PairedOnset<Written> = {
    readonly written: Written;
    /** The played note, or null when the player missed this onset. Onsets in one group share it. */
    readonly played: PlayedNote | null;
};
export type PlayedNote = {
    readonly atMs: number;
    /** How far the note lands from the nearest written onset of its group: negative is early. */
    readonly offsetMs: number;
};
export type Pairing<Written> = {
    /** Every written onset in order, each with its played note or null. */
    readonly onsets: ReadonlyArray<PairedOnset<Written>>;
    /** Each played note paired with a group, once, in order: what `summarize` and the offset chart take. */
    readonly hits: ReadonlyArray<PlayedNote>;
    /** Played notes that no written onset asked for, as their `atMs`. */
    readonly extra: ReadonlyArray<number>;
};
/** A note further than this from every written onset is an extra note, not a late or early one. */
export declare const MAX_REACH_MS = 250;
/**
 * Pairs the notes a player played, at `playedMs` after the first written beat
 * as the player heard it (a take's note times minus its measured latency), with
 * the `written` onsets, at their `atMs` on the same clock. Both are in time order.
 */
export declare function pairTake<Written extends {
    readonly atMs: number;
}>(playedMs: ReadonlyArray<number>, written: ReadonlyArray<Written>): Pairing<Written>;
