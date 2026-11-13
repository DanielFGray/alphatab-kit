/**
 * Marks on a lyrics chart: where one sits now, and the geometry of ink.
 * Pure and free of the DOM, so the view and the tests share it.
 */
import { getStroke } from "perfect-freehand";
import { anchorText, parseDoc } from "./doc.js";
import { follow } from "./follow.js";
/**
 * Builds a function that finds where a mark is on the newest of `revisions`
 * (oldest first). A mark whose revision is not in the list was made on a
 * revision that no longer exists, so its content is gone.
 */
export function markResolver(revisions) {
    const texts = new Map();
    const textOf = (revision) => {
        let text = texts.get(revision.id);
        if (text === undefined) {
            text = anchorText(parseDoc(revision.source ?? ""));
            texts.set(revision.id, text);
        }
        return text;
    };
    return (mark) => {
        const from = revisions.findIndex((revision) => revision.id === mark.revision_id);
        if (from < 0)
            return { state: "orphaned", reason: "deleted" };
        const steps = revisions.slice(from + 1).map((revision, i) => ({
            before: textOf(revisions[from + i]),
            after: textOf(revision),
            recorded: revision.changes,
        }));
        return follow({ start: mark.range_start, end: mark.range_end }, steps);
    };
}
export function boundsOf(strokes) {
    const points = strokes.flat();
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
/** Whether two boxes are within `gap` of each other. */
export function near(a, b, gap) {
    return b.x < a.x + a.w + gap && b.x + b.w > a.x - gap && b.y < a.y + a.h + gap && b.y + b.h > a.y - gap;
}
/**
 * The outline of a stroke as an SVG path. perfect-freehand tunes its smoothing
 * for pixel input, so `points` are in px and `em` is the chart's font size.
 */
export function inkPath(points, em) {
    const outline = getStroke(points.map((p) => [...p]), { size: 0.16 * em, thinning: 0.6, smoothing: 0.5, streamline: 0.4 });
    if (outline.length === 0)
        return "";
    return `M ${outline.map(([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`).join(" L ")} Z`;
}
