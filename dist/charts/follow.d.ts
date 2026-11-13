import type { Change } from "./changes.ts";
export type Range = {
    readonly start: number;
    readonly end: number;
};
/** Two consecutive revisions. `recorded` is the editor's change set, or null for a revision from outside the editor. */
export type Step = {
    readonly before: string;
    readonly after: string;
    readonly recorded: ReadonlyArray<Change> | null;
};
/**
 * `kept`: the marked content is unchanged.
 * `changed`: the marked content was edited; the view flags the mark.
 * `orphaned`: the content was deleted, or a derived diff cannot say where it went (`uncertain`); the mark goes to the tray.
 */
export type Resolution = {
    readonly state: "kept" | "changed";
    readonly start: number;
    readonly end: number;
} | {
    readonly state: "orphaned";
    readonly reason: "deleted" | "uncertain";
};
export declare function follow(range: Range, steps: ReadonlyArray<Step>): Resolution;
/** The range after the changes, or null when they deleted all of it. */
export declare function mapRange(range: Range, changes: ReadonlyArray<Change>): Range | null;
