import { model } from "@coderline/alphatab";
/** Draws in `css`, the text color around the score, with staff lines and bar lines fainter. */
export function inkFrom(settings, css) {
    const [r, g, b] = rgbOf(css);
    const ink = new model.Color(r, g, b);
    const faint = new model.Color(r, g, b, 110);
    const resources = settings.display.resources;
    resources.mainGlyphColor = ink;
    resources.scoreInfoColor = ink;
    resources.secondaryGlyphColor = faint;
    resources.barNumberColor = faint;
    resources.staffLineColor = faint;
    resources.barSeparatorColor = faint;
}
/**
 * Calls `onChange` when the page's theme may have changed. An app marks its theme with a class, a `data-theme`
 * attribute or an inline style on the root element, so a change to one of them is the signal. Returns the
 * function that stops watching.
 */
export function observeTheme(onChange, root = document.documentElement) {
    const observer = new MutationObserver(onChange);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    return () => observer.disconnect();
}
/**
 * A CSS color as red, green and blue. An app's colors may compute to `oklch()`, which alphaTab cannot read, so the
 * color is drawn and its pixel read back. Without a canvas the ink is black.
 */
function rgbOf(css) {
    const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!context)
        return [0, 0, 0];
    context.fillStyle = css;
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
}
