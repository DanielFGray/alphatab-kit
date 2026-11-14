/**
 * What a score asks a player to play, in time: each moment one or more notes
 * start, with their pitches, in milliseconds from the start of a run of bars.
 * The score practice view pairs these with the notes the click engine hears.
 *
 * alphaTab's MIDI generator does the reading, so the onsets follow playback
 * exactly: repeats and alternate endings in play order, tied notes as one
 * note, grace notes before their beat, strums, and tempo changes.
 */
import { type model } from "@coderline/alphatab";
import { type BarSpan } from "./score-bars.ts";
export type ScoreOnset = {
    /**
     * When the notes start, in ms after the first beat of the run at the
     * practice speed, like the click engine's `Note.atMs`. A strum starts at its
     * first string; a grace note before the run's first beat is negative.
     */
    readonly atMs: number;
    /** The MIDI keys that start here, low to high. */
    readonly pitches: ReadonlyArray<number>;
    /** How long the longest of them sounds, in ms at the practice speed; a tie lengthens it. */
    readonly durationMs: number;
    /** The written beats these notes come from: one per voice and staff that plays here. */
    readonly beats: ReadonlyArray<model.Beat>;
};
export type ScoreOnsetOptions = {
    /** The track's index in `score.tracks`. All its staves and voices count. */
    readonly track: number;
    /**
     * Master bars, counted from 0. The run starts the first time playback
     * enters `first` and ends the first time it leaves `last`, so a repeat
     * inside the run plays as written, and a run inside a repeat plays once.
     */
    readonly bars: BarSpan;
    /** The practice speed: 1 is the score's tempo, 0.5 half of it. */
    readonly speed: number;
};
/** The onsets of `track` over `bars`, in play order. Empty when the run never plays. */
export declare function scoreOnsets(score: model.Score, { track, bars, speed }: ScoreOnsetOptions): ReadonlyArray<ScoreOnset>;
