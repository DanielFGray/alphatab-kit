export declare const ALPHATAB_PACKAGE = "@coderline/alphatab";
/** Where the Vite plugin serves alphaTab's fonts, sound font and UMD script. */
export declare const ALPHATAB_BASE = "/alphatab/";
export interface AlphaTabAssetUrls {
    readonly scriptFile: string;
    readonly fontDirectory: string;
    readonly soundFont: string;
}
/**
 * The URLs to pass to alphaTab settings (`core.scriptFile`, `core.fontDirectory`,
 * `player.soundFont`), for files the `gigbag.js/vite` plugin serves.
 * `scriptFile` must be absolute: alphaTab loads it inside a worker started from
 * a blob URL, where a relative URL has no base to resolve against.
 * Call it in the browser only; it reads `location`.
 */
export declare function alphaTabAssetUrls(origin?: string): AlphaTabAssetUrls;
