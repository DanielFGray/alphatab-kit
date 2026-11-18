import { model, type Settings } from "@coderline/alphatab"

/** Draws in `css`, the text color around the score, with staff lines and bar lines fainter. */
export function inkFrom(settings: Settings, css: string) {
  const [r, g, b] = rgbOf(css)
  const ink = new model.Color(r, g, b)
  const faint = new model.Color(r, g, b, 110)
  const resources = settings.display.resources
  resources.mainGlyphColor = ink
  resources.scoreInfoColor = ink
  resources.secondaryGlyphColor = faint
  resources.barNumberColor = faint
  resources.staffLineColor = faint
  resources.barSeparatorColor = faint
}

/**
 * Calls `onChange` when the page's theme may have changed. An app marks its theme with a class, a `data-theme`
 * attribute or an inline style on the root element, so a change to one of them is the signal. An app that follows
 * the OS color scheme through `prefers-color-scheme` changes its colors with no attribute change, so the dark-scheme
 * query's change event is a signal too. Returns the function that stops watching.
 */
export function observeTheme(onChange: () => void, root: HTMLElement = document.documentElement): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme", "style"] })
  const scheme = window.matchMedia("(prefers-color-scheme: dark)")
  scheme.addEventListener("change", onChange)
  return () => {
    observer.disconnect()
    scheme.removeEventListener("change", onChange)
  }
}

/**
 * A CSS color as red, green and blue. An app's colors may compute to `oklch()`, which alphaTab cannot read, so the
 * color is drawn and its pixel read back. Without a canvas the ink is black.
 */
function rgbOf(css: string): readonly [number, number, number] {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  if (!context) return [0, 0, 0]
  context.fillStyle = css
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}
