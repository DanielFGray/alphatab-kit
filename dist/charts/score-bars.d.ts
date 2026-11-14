/** MIDI ticks in a quarter note, as alphaTab counts them (its MidiUtils.QuarterTime, which it does not export). */
export declare const TICKS_PER_QUARTER = 960;
/** A bar's span in MIDI ticks: `start` is inclusive, `end` is where the next bar starts. */
export type BarTicks = {
    readonly start: number;
    readonly end: number;
};
/** A run of bars, counted from 0, with both ends inclusive. */
export type BarSpan = {
    readonly first: number;
    readonly last: number;
};
/** The playback range of a run of bars, from the first bar's start to the last bar's end. */
export declare function ticksOfBars(bars: ReadonlyArray<BarTicks>, span: BarSpan): {
    startTick: number;
    endTick: number;
};
/** Each master bar's span in ticks, from alphaTab's model. */
export declare function barTicksOf(masterBars: ReadonlyArray<{
    readonly start: number;
    calculateDuration(): number;
}>): Array<BarTicks>;
/** The bars a beat selection touches: a selection that covers part of a bar counts that whole bar. */
export declare function barsOfBeatSpan(span: BeatSpan): BarSpan;
/**
 * The tempo in effect at the start of bar `index`: the nearest tempo marking at or before that bar, since a
 * tempo change is stored on the bar that makes it. Null when no bar up to it has one.
 */
export declare function tempoAtBar(bars: ReadonlyArray<{
    readonly tempoAutomations: ReadonlyArray<{
        readonly value: number;
    }>;
}>, index: number): number | null;
/** A span written for a reader, which counts bars from 1: "Bar 3" or "Bars 3–4". */
export declare function barsLabel(span: BarSpan): string;
/** Whether two spans name the same bars. Two nulls are the same: no selection. */
export declare function sameBars(a: BarSpan | null, b: BarSpan | null): boolean;
/** A selected beat's place: its bar and its beat inside its voice, both counted from 0, and how many beats the voice holds. */
export type BeatPlace = {
    readonly bar: number;
    readonly beat: number;
    readonly beatCount: number;
};
/** A selection by beat: the first and the last beat it covers, both inclusive. */
export type BeatSpan = {
    readonly first: BeatPlace;
    readonly last: BeatPlace;
};
/** The part of alphaTab's beat model a selection reads. */
type BeatLike = {
    readonly index: number;
    readonly voice: {
        readonly beats: ReadonlyArray<unknown>;
        readonly bar: {
            readonly masterBar: {
                readonly index: number;
            };
        };
    };
};
/** The span from a selection's first beat to its last. The beat count is what tells the last beat of a bar from a middle one. */
export declare function beatSpanOf(startBeat: BeatLike, endBeat: BeatLike): BeatSpan;
/**
 * A beat span written for a reader, counting bars and beats from 1. A span
 * that starts on a bar's first beat and ends on its last reads as bars ("Bar 3",
 * "Bars 3–5"); any other span names its beats ("Bar 3, beats 1–2").
 */
export declare function selectionLabel(span: BeatSpan): string;
/** Whether two selections name the same beats. Two nulls are the same: no selection. */
export declare function sameBeats(a: BeatSpan | null, b: BeatSpan | null): boolean;
export {};
