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
/**
 * The bars a playback range covers: from the bar its start falls in through the
 * bar its end falls in. The end is exclusive, so a range that ends where a bar
 * begins does not take that bar.
 */
export declare function barsOfTicks(bars: ReadonlyArray<BarTicks>, startTick: number, endTick: number): BarSpan;
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
/**
 * The bars a drag selected, given the playback range alphaTab now holds. The
 * drawn bars are the range a view plays by default, so that range is no
 * selection, and neither is no range at all.
 */
export declare function selectedBars(bars: ReadonlyArray<BarTicks>, playbackRange: {
    readonly startTick: number;
    readonly endTick: number;
} | null, drawn: BarSpan | null): BarSpan | null;
/** A span written for a reader, which counts bars from 1: "Bar 3" or "Bars 3–4". */
export declare function barsLabel(span: BarSpan): string;
/** Whether two spans name the same bars. Two nulls are the same: no selection. */
export declare function sameBars(a: BarSpan | null, b: BarSpan | null): boolean;
