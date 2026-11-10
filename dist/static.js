import { Schema } from "effect";
/**
 * One horizontal band of a drawn score, as alphaTab's renderer emits it: the
 * title block, or one system of staves. `svg` is a complete `<svg>` in the
 * band's own coordinates; `y` places it in the score.
 */
export const StaticPart = Schema.Struct({
    y: Schema.Finite,
    height: Schema.Finite,
    svg: Schema.String,
});
/**
 * A score drawn once at a fixed width, kept as its parts so that printing can
 * break pages between systems. The music symbols are text in alphaTab's music
 * font, sized relative to `musicFontSize`: show the score with
 * {@link staticScoreHtml} on a page that carries {@link staticScoreCss}, or as
 * one file with {@link standaloneSvg}. A plain structure, so it passes through
 * JSON and server-rendering loaders as it is.
 */
export const StaticScore = Schema.Struct({
    width: Schema.Finite,
    height: Schema.Finite,
    musicFontSize: Schema.Finite,
    parts: Schema.Array(StaticPart),
});
/**
 * The parts stacked as block-level `<svg>` elements inside one
 * `.at-surface.at` element. Each part's view box also covers the gap above it,
 * so the stack keeps the score's spacing at any width. alphaTab escapes the
 * text it draws, so the markup is safe to insert into a page.
 */
export const staticScoreHtml = (score) => {
    const bands = score.parts.map((part, index) => {
        const top = index === 0 ? 0 : bottom(score.parts[index - 1]);
        const end = index === score.parts.length - 1 ? score.height : bottom(part);
        return `<svg class="at-static-part" xmlns="http://www.w3.org/2000/svg" viewBox="0 ${top} ${score.width} ${end - top}">${placed(part)}</svg>`;
    });
    return `<div class="at-surface at at-static" style="font-size:${score.musicFontSize}px">${bands.join("")}</div>`;
};
/** The score as one `<svg>` element, for a file or an image. */
export const scoreSvg = (score) => `<svg xmlns="http://www.w3.org/2000/svg" class="at-surface at" viewBox="0 0 ${score.width} ${score.height}" width="${score.width}" height="${score.height}" style="font-size:${score.musicFontSize}px">${score.parts.map(placed).join("")}</svg>`;
/**
 * The score as a file of its own, with its music-font CSS inside, for a page
 * opened directly. A browser loads no fonts for an SVG shown through `<img>`;
 * use a PNG there.
 */
export const standaloneSvg = (score, fontDirectory) => scoreSvg(score).replace(/^<svg([^>]*)>/, `<svg$1><style>${musicFontCss(fontDirectory)}</style>`);
/**
 * The CSS a page needs to show {@link staticScoreHtml}: the music font and
 * alphaTab's text rules, which alphaTab injects itself only when a player
 * starts, and one block per part so that printing breaks pages between
 * systems.
 */
export const staticScoreCss = (fontDirectory) => `${musicFontCss(fontDirectory)}
.at-static-part{display:block;width:100%;height:auto;break-inside:avoid}`;
/**
 * The music font and the rules alphaTab applies to its drawing. Glyphs take
 * their size from the element around the score; alphaTab writes a glyph drawn
 * at another scale as a percentage of that size.
 */
const musicFontCss = (fontDirectory) => `@font-face{font-family:'alphaTab';font-display:block;font-weight:normal;font-style:normal;src:url("${fontDirectory}Bravura.woff2") format('woff2'),url("${fontDirectory}Bravura.woff") format('woff'),url("${fontDirectory}Bravura.otf") format('opentype')}
.at-surface.at .at{font-family:'alphaTab';font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;overflow:visible!important}
.at-surface *{overflow:visible}
.at-surface-svg text{dominant-baseline:alphabetic;white-space:pre}`;
const bottom = (part) => part.y + part.height;
const placed = (part) => part.svg.replace(/^<svg /, `<svg x="0" y="${part.y}" `);
