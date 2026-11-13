import type { Change } from "./changes.ts";
import { type Resolution } from "./follow.ts";
/** One revision of a chart in order, as the browser holds it. */
export type RevisionText = {
    id: string;
    source: string | null;
    changes: ReadonlyArray<Change> | null;
};
/** The part of a mark that says where it was anchored. */
export type MarkAnchor = {
    revision_id: string;
    range_start: number;
    range_end: number;
};
/**
 * Builds a function that finds where a mark is on the newest of `revisions`
 * (oldest first). A mark whose revision is not in the list was made on a
 * revision that no longer exists, so its content is gone.
 */
export declare function markResolver(revisions: ReadonlyArray<RevisionText>): (mark: MarkAnchor) => Resolution;
/** A point of a stroke: x, y, pressure. */
export type InkPoint = readonly [number, number, number];
export type Stroke = ReadonlyArray<InkPoint>;
export type Box = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export declare function boundsOf(strokes: ReadonlyArray<Stroke>): Box;
/** Whether two boxes are within `gap` of each other. */
export declare function near(a: Box, b: Box, gap: number): boolean;
/**
 * The outline of a stroke as an SVG path. perfect-freehand tunes its smoothing
 * for pixel input, so `points` are in px and `em` is the chart's font size.
 */
export declare function inkPath(points: Stroke, em: number): string;
