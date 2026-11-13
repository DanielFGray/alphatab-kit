/**
 * How large alphaTab draws a score: its `display.scale`, where 1 is 100%. Pure
 * and free of the DOM, so the player and the tests share it.
 */
export declare const MIN_ZOOM = 0.5;
export declare const MAX_ZOOM = 2.5;
/** A zoom inside the supported range, rounded to a hundredth. */
export declare function clampZoom(zoom: number): number;
/** The zoom one step larger (`direction` 1) or smaller (-1). */
export declare function stepZoom(zoom: number, direction: 1 | -1): number;
