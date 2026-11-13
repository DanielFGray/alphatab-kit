/**
 * Change sets: how one revision of a chart became the next (docs/adr/0001).
 *
 * A change replaces `[from, to)` of the earlier revision's anchor text with
 * `insert` characters. A change set is sorted and has no overlapping changes.
 * The editor records one per edit; a marks module maps anchors through them.
 */
export type Change = {
    readonly from: number;
    readonly to: number;
    readonly insert: number;
    readonly source?: number;
};
/**
 * The change set that does `first`, then `second`, as one change set against
 * the text `first` started from. Text that `first` inserted and `second`
 * deleted again leaves no trace; text that either moved keeps its link, and a
 * move that is undone leaves no change.
 */
export declare function composeChanges(first: ReadonlyArray<Change>, second: ReadonlyArray<Change>): Array<Change>;
/** A stretch of a rearranged text: a copy of `[from, from + n)` of the earlier text, or `n` new characters when `from` is absent. */
export type Part = {
    readonly n: number;
    readonly from?: number;
};
/**
 * The change set for a later text made of `parts`, in order, from an earlier
 * text of `length` characters. Earlier text that no part copies is deleted,
 * and a part that copies text from before the one before it is a move with its
 * `source`.
 */
export declare function rearranged(length: number, parts: ReadonlyArray<Part>): Array<Change>;
/** Whether `changes` is a valid change set: sorted, without overlap, with no empty change. */
export declare function isChangeSet(changes: ReadonlyArray<Change>): boolean;
/**
 * Whether `changes` turns `before` into `after`: the text outside the changes
 * is the same in both. The changed stretches themselves are not compared, so
 * this proves where the text kept its place, which is what marks rely on.
 */
export declare function explains(before: string, after: string, changes: ReadonlyArray<Change>): boolean;
/** The length of the later text, given the length of the earlier one. */
export declare function lengthAfter(length: number, changes: ReadonlyArray<Change>): number;
