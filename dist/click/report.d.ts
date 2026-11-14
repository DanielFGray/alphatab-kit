import type { Take } from "./take.ts";
import { type Hit, type Subdivision } from "./timing.ts";
/**
 * The words and numbers a take shows the player, shared by the click parts and
 * any app that lays out its own. Nothing is saved: a take lives while it is shown.
 */
/** One line on what the player should do now. `beatsPerBar` is the click's, which sets the count-in's length. */
export declare const takeStatus: (take: Take, running: boolean, beatsPerBar: number) => string;
/** The summary of a take's notes: a label and a value each. */
export declare const hitTiles: (hits: ReadonlyArray<Hit>) => ReadonlyArray<readonly [string, string]>;
/**
 * The grids a player can aim at, counted in notes per click: the click may be
 * a quarter note, or a dotted quarter in 6/8, so a note value would mislead.
 */
export declare const SUBDIVISIONS: ReadonlyArray<readonly [Subdivision, string]>;
/** A note's offset as the player reads it: "+4.2 ms", "−3.0 ms". */
export declare const signedMs: (ms: number) => string;
export declare const judgement: (ms: number) => string;
/** A mic meter's fill, 0 to 1, for a peak sample from 0 to 1: empty at -60 dBFS, full at 0 dBFS. */
export declare const meterFill: (peak: number) => number;
/**
 * How far either side of 0 the offset chart reaches, in ms: twice the tight
 * band at least, and otherwise the widest offset rounded up to 10 ms.
 */
export declare const chartRangeMs: (hits: ReadonlyArray<Hit>) => number;
