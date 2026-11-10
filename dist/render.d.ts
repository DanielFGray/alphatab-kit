import { type json } from "@coderline/alphatab";
import { Effect, Schema } from "effect";
/** Where a score comes from: alphaTex text, or the bytes of a Guitar Pro, MusicXML or similar file. */
export declare const ScoreSource: Schema.Union<readonly [Schema.TaggedStruct<"AlphaTex", {
    readonly tex: Schema.String;
}>, Schema.TaggedStruct<"ScoreFile", {
    readonly bytes: Schema.Uint8Array;
}>]>;
export type ScoreSource = typeof ScoreSource.Type;
declare const StaticPart_base: Schema.Class<StaticPart, Schema.Struct<{
    readonly y: Schema.Finite;
    readonly height: Schema.Finite;
    readonly svg: Schema.String;
}>, {
    readonly brand: unique symbol;
}>;
/**
 * One horizontal band of a drawn score, as alphaTab's renderer emits it: the
 * title block, or one system of staves. `svg` is a complete `<svg>` in the
 * band's own coordinates; `y` places it in the score.
 */
export declare class StaticPart extends StaticPart_base {
}
declare const StaticScore_base: Schema.Class<StaticScore, Schema.Struct<{
    readonly width: Schema.Finite;
    readonly height: Schema.Finite;
    readonly parts: Schema.$Array<typeof StaticPart>;
}>, {
    readonly brand: unique symbol;
}>;
/**
 * A score drawn once at a fixed width, kept as its parts so that printing can
 * break pages between systems. The music symbols are text in alphaTab's music
 * font: show it with {@link staticScoreHtml} on a page that carries
 * {@link staticScoreCss}, or as one file with {@link standaloneSvg}.
 */
export declare class StaticScore extends StaticScore_base {
}
declare const ScoreLoadError_base: Schema.Class<ScoreLoadError, Schema.TaggedStruct<"ScoreLoadError", {
    readonly cause: Schema.Defect;
}>, import("effect/Cause").YieldableError & {
    readonly brand: unique symbol;
}>;
export declare class ScoreLoadError extends ScoreLoadError_base {
}
declare const ScoreRenderError_base: Schema.Class<ScoreRenderError, Schema.TaggedStruct<"ScoreRenderError", {
    readonly message: Schema.String;
    readonly cause: Schema.optional<Schema.Defect>;
}>, import("effect/Cause").YieldableError & {
    readonly brand: unique symbol;
}>;
export declare class ScoreRenderError extends ScoreRenderError_base {
}
export interface RenderOptions {
    /** Layout width in CSS pixels; line breaks follow it. */
    readonly width: number;
    /** Track indexes to draw. Defaults to the first track. */
    readonly tracks?: ReadonlyArray<number>;
    /** alphaTab settings (display, notation, colors) applied over the defaults. */
    readonly settings?: json.SettingsJson;
}
/**
 * Draws a score to SVG with alphaTab's own renderer, without a browser: no
 * DOM, no workers and no web fonts are needed, so it runs in a build step, on
 * a server or in a page.
 */
export declare const renderScoreSvg: (source: {
    readonly _tag: "AlphaTex";
    readonly tex: string;
} | {
    readonly _tag: "ScoreFile";
    readonly bytes: Uint8Array<ArrayBufferLike>;
}, options: RenderOptions) => Effect.Effect<StaticScore, ScoreLoadError | ScoreRenderError, never>;
/** {@link renderScoreSvg} for callers outside Effect. */
export declare const renderScoreSvgPromise: (source: ScoreSource, options: RenderOptions) => Promise<StaticScore>;
/**
 * The parts stacked as block-level `<svg>` elements inside one
 * `.at-surface.at` element. Each part's view box also covers the gap above it,
 * so the stack keeps the score's spacing at any width. alphaTab escapes the
 * text it draws, so the markup is safe to insert into a page.
 */
export declare const staticScoreHtml: (score: StaticScore) => string;
/** The score as one `<svg>` element, for a file or an image. */
export declare const scoreSvg: (score: StaticScore) => string;
/**
 * The score as a file of its own, with its music-font CSS inside, for a page
 * opened directly. A browser loads no fonts for an SVG shown through `<img>`;
 * use a PNG there.
 */
export declare const standaloneSvg: (score: StaticScore, fontDirectory: string) => string;
/**
 * The CSS a page needs to show {@link staticScoreHtml}: the music font and
 * alphaTab's text rules, which alphaTab injects itself only when a player
 * starts, and one block per part so that printing breaks pages between
 * systems.
 */
export declare const staticScoreCss: (fontDirectory: string) => string;
export {};
