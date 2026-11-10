export const ALPHATAB_PACKAGE = "@coderline/alphatab"

/** Where the Vite plugin serves alphaTab's runtime files. */
export const ALPHATAB_BASE = "/alphatab/"

export interface AlphaTabAssetUrls {
  readonly scriptFile: string
  readonly fontDirectory: string
  readonly soundFont: string
}

/**
 * The URLs to pass to alphaTab settings (`core.scriptFile`, `core.fontDirectory`,
 * `player.soundFont`). They are absolute because alphaTab fetches them from a
 * worker, where a relative URL resolves against the worker's own location.
 */
export function alphaTabAssetUrls(origin: string = location.origin): AlphaTabAssetUrls {
  return {
    scriptFile: `${origin}${ALPHATAB_BASE}alphaTab.js`,
    fontDirectory: `${origin}${ALPHATAB_BASE}font/`,
    soundFont: `${origin}${ALPHATAB_BASE}soundfont/sonivox.sf2`,
  }
}
