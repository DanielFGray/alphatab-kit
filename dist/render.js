import { importer, LayoutMode, rendering, Settings } from "@coderline/alphatab";
import { Effect, Match, Option, Schema } from "effect";
/** Where a score comes from: alphaTex text, or the bytes of a Guitar Pro, MusicXML or similar file. */
export const ScoreSource = Schema.Union([
    Schema.TaggedStruct("AlphaTex", { tex: Schema.String }),
    Schema.TaggedStruct("ScoreFile", { bytes: Schema.Uint8Array }),
]);
/**
 * One horizontal band of a drawn score, as alphaTab's renderer emits it: the
 * title block, or one system of staves. `svg` is a complete `<svg>` in the
 * band's own coordinates; `y` places it in the score.
 */
export class StaticPart extends Schema.Class("alphatab-kit/StaticPart")({
    y: Schema.Finite,
    height: Schema.Finite,
    svg: Schema.String,
}) {
}
/**
 * A score drawn once at a fixed width, kept as its parts so that printing can
 * break pages between systems. The music symbols are text in alphaTab's music
 * font: show it with {@link staticScoreHtml} on a page that carries
 * {@link staticScoreCss}, or as one file with {@link standaloneSvg}.
 */
export class StaticScore extends Schema.Class("alphatab-kit/StaticScore")({
    width: Schema.Finite,
    height: Schema.Finite,
    parts: Schema.Array(StaticPart),
}) {
}
export class ScoreLoadError extends Schema.TaggedError()("ScoreLoadError", {
    cause: Schema.Defect(),
}) {
}
export class ScoreRenderError extends Schema.TaggedError()("ScoreRenderError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
}) {
}
/**
 * Draws a score to SVG with alphaTab's own renderer, without a browser: no
 * DOM, no workers and no web fonts are needed, so it runs in a build step, on
 * a server or in a page.
 */
export const renderScoreSvg = Effect.fnUntraced(function* (source, options) {
    const settings = staticSettings(options.settings);
    const score = yield* Effect.try({
        try: () => Match.valueTags(source, {
            AlphaTex: ({ tex }) => importer.ScoreLoader.loadAlphaTex(tex, settings),
            ScoreFile: ({ bytes }) => importer.ScoreLoader.loadScoreFromBytes(bytes, settings),
        }),
        catch: (cause) => new ScoreLoadError({ cause }),
    });
    const drawing = yield* Effect.try({
        try: () => draw(score, settings, options),
        catch: (cause) => new ScoreRenderError({ message: "alphaTab failed while drawing", cause }),
    });
    return yield* drawing;
});
/** {@link renderScoreSvg} for callers outside Effect. */
export const renderScoreSvgPromise = (source, options) => Effect.runPromise(renderScoreSvg(source, options));
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
    return `<div class="at-surface at at-static">${bands.join("")}</div>`;
};
/** The score as one `<svg>` element, for a file or an image. */
export const scoreSvg = (score) => `<svg xmlns="http://www.w3.org/2000/svg" class="at-surface at" viewBox="0 0 ${score.width} ${score.height}" width="${score.width}" height="${score.height}">${score.parts.map(placed).join("")}</svg>`;
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
 * The music font and the rules alphaTab applies to its drawing. Glyph sizes
 * for a display scale other than 1 are percentages of this font size, written
 * on each glyph.
 */
const musicFontCss = (fontDirectory) => {
    const size = new Settings().display.resources.engravingSettings.musicFontSize;
    return `@font-face{font-family:'alphaTab';font-display:block;font-weight:normal;font-style:normal;src:url("${fontDirectory}Bravura.woff2") format('woff2'),url("${fontDirectory}Bravura.woff") format('woff'),url("${fontDirectory}Bravura.otf") format('opentype')}
.at-surface.at .at{font-family:'alphaTab';font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;font-size:${size}px;overflow:visible!important}
.at-surface *{overflow:visible}
.at-surface-svg text{dominant-baseline:alphabetic;white-space:pre}`;
};
const bottom = (part) => part.y + part.height;
const placed = (part) => part.svg.replace(/^<svg /, `<svg x="0" y="${part.y}" `);
/**
 * Runs alphaTab's renderer, which draws synchronously when it has no workers,
 * and collects what its events report. alphaTab reports some failures only
 * as a skipped render (for example a width of 0), so a render that never
 * finished is an error too.
 */
const draw = (score, settings, options) => {
    const renderer = new rendering.ScoreRenderer(settings);
    renderer.width = options.width;
    const parts = [];
    let failure = Option.none();
    let size = Option.none();
    renderer.preRender.on(() => {
        parts.length = 0;
    });
    renderer.partialRenderFinished.on((part) => {
        parts.push(new StaticPart({ y: part.y, height: part.height, svg: decodeSvg(part.renderResult) }));
    });
    renderer.error.on((cause) => {
        failure = Option.some(new ScoreRenderError({ message: cause.message, cause }));
    });
    renderer.renderFinished.on(({ totalWidth, totalHeight }) => {
        size = Option.some({ width: totalWidth, height: totalHeight });
    });
    renderer.renderScore(score, [...(options.tracks ?? [0])]);
    return Option.match(failure, {
        onSome: Effect.fail,
        onNone: () => Option.match(size, {
            onNone: () => Effect.fail(new ScoreRenderError({ message: `alphaTab drew nothing at width ${options.width}` })),
            onSome: ({ width, height }) => Effect.succeed(new StaticScore({ width, height, parts })),
        }),
    });
};
/** The SVG engine's partial result is its markup string. */
const decodeSvg = Schema.decodeUnknownSync(Schema.String);
/**
 * Settings for a one-shot render: SVG output, page layout, everything drawn
 * at once rather than as the viewport scrolls, and no workers, which a server
 * does not have.
 */
const staticSettings = (overrides) => {
    const settings = new Settings();
    if (overrides)
        settings.fillFromJson(overrides);
    settings.core.engine = "svg";
    settings.core.useWorkers = false;
    settings.core.enableLazyLoading = false;
    settings.display.layoutMode = LayoutMode.Page;
    return settings;
};
