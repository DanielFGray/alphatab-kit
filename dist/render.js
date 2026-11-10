import { importer, LayoutMode, rendering, Settings } from "@coderline/alphatab";
import { Effect, Match, Option, Schema } from "effect";
/** Where a score comes from: alphaTex text, or the bytes of a Guitar Pro, MusicXML or similar file. */
export const ScoreSource = Schema.Union([
    Schema.TaggedStruct("AlphaTex", { tex: Schema.String }),
    Schema.TaggedStruct("ScoreFile", { bytes: Schema.Uint8Array }),
]);
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
        parts.push({ y: part.y, height: part.height, svg: decodeSvg(part.renderResult) });
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
            onSome: ({ width, height }) => Effect.succeed({ width, height, musicFontSize: settings.display.resources.engravingSettings.musicFontSize, parts }),
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
