export const ALPHATAB_PACKAGE = "@coderline/alphatab";
/** Where the Vite plugin serves alphaTab's fonts, sound font and UMD script. */
export const ALPHATAB_BASE = "/alphatab/";
/**
 * The URLs to pass to alphaTab settings (`core.scriptFile`, `core.fontDirectory`,
 * `player.soundFont`), for files the `gigbag.js/vite` plugin serves.
 * `scriptFile` must be absolute: alphaTab loads it inside a worker started from
 * a blob URL, where a relative URL has no base to resolve against.
 * Call it in the browser only; it reads `location`.
 */
export function alphaTabAssetUrls(origin = location.origin) {
    return {
        scriptFile: `${origin}${ALPHATAB_BASE}alphaTab.js`,
        fontDirectory: `${origin}${ALPHATAB_BASE}font/`,
        soundFont: `${origin}${ALPHATAB_BASE}soundfont/sonivox.sf2`,
    };
}
