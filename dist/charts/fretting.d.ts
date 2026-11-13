/**
 * Guitar shapes: the fretted positions a hand holds, the fingers they need,
 * and the window of frets a diagram shows them in.
 * Pure and free of the DOM, so the diagram and the shape generator share it.
 */
/** A fretted shape: one entry per string, lowest-pitched string first; null = not played, 0 = open. */
export type Voicing = {
    readonly frets: ReadonlyArray<number | null>;
};
/** One finger laid across several strings at one fret. */
type Barre = {
    readonly fret: number;
    readonly from: number;
    readonly to: number;
};
/**
 * The barre of a shape, or null when it needs none.
 *
 * A shape has a barre only when it needs one. It needs one when more than
 * four strings are fretted (fret > 0) — a barre is how a hand plays more
 * than four fretted strings — and the fretted strings fit the ordinary
 * span rule: at fret `f`, the lowest fret > 0, at least two strings sound
 * `f`, and every string between the lowest and the highest of them sounds
 * a fret ≥ `f` — none open, none muted, since the barre presses every
 * string it covers. A chart draws separate dots otherwise, even for the
 * fretted spans of shapes like `x 0 2 2 2 0` and `x x 0 2 3 2`.
 */
export declare function barreOf(frets: Voicing["frets"]): Barre | null;
/**
 * How many fingers the shape needs: one per fretted string (fret > 0), with
 * the strings the barre holds at its fret counted as the barre's one finger.
 */
export declare function fingersNeeded(frets: Voicing["frets"]): number;
/**
 * The frets a diagram shows: from `first`, `rows` frets tall. A shape whose
 * highest fret sits low shows the nut (first = 1); a higher one starts the
 * box at its lowest fretted fret.
 */
export declare function fretWindow(frets: Voicing["frets"]): {
    readonly first: number;
    readonly rows: number;
};
/** `x 3 2 0 1 0`: the usual written form, also the diagram's data-frets. */
export declare function writeFrets(frets: Voicing["frets"]): string;
export {};
