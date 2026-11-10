import { type json } from "@coderline/alphatab";
import { Effect, Schema } from "effect";
/** Where a score comes from: alphaTex text, or the bytes of a Guitar Pro, MusicXML or similar file. */
export declare const ScoreSource: Schema.Union<readonly [Schema.TaggedStruct<"AlphaTex", {
    readonly tex: Schema.String;
}>, Schema.TaggedStruct<"ScoreFile", {
    readonly bytes: Schema.Uint8Array;
}>]>;
export type ScoreSource = typeof ScoreSource.Type;
declare const StaticScore_base: Schema.Class<StaticScore, Schema.Struct<{
    readonly svg: Schema.String;
    readonly width: Schema.Finite;
    readonly height: Schema.Finite;
}>, {
    readonly brand: unique symbol;
}>;
/**
 * A score drawn once at a fixed width, as one `<svg>` that scales to its
 * container through its `viewBox`. The music symbols are text in alphaTab's
 * music font, so the page needs {@link musicFontCss}, or use {@link standaloneSvg}.
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
 * The CSS that draws alphaTab's music symbols in a static score: the music
 * font, and the class alphaTab gives each symbol. In the browser alphaTab
 * injects the same rule itself when a player starts; a static score has no
 * player, so the page must carry it.
 */
export declare const musicFontCss: (fontDirectory: string) => string;
/**
 * The score as a file of its own, with its music-font CSS inside, for a page
 * opened directly or printed. A browser loads no fonts for an SVG shown
 * through `<img>`; use a PNG there.
 */
export declare const standaloneSvg: (score: StaticScore, fontDirectory: string) => string;
export {};
