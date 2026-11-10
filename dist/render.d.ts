import { type json } from "@coderline/alphatab";
import { Effect, Schema } from "effect";
import type { StaticScore } from "./static.ts";
/** Where a score comes from: alphaTex text, or the bytes of a Guitar Pro, MusicXML or similar file. */
export declare const ScoreSource: Schema.Union<readonly [Schema.TaggedStruct<"AlphaTex", {
    readonly tex: Schema.String;
}>, Schema.TaggedStruct<"ScoreFile", {
    readonly bytes: Schema.Uint8Array;
}>]>;
export type ScoreSource = typeof ScoreSource.Type;
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
}, options: RenderOptions) => Effect.Effect<{
    readonly width: number;
    readonly height: number;
    readonly musicFontSize: number;
    readonly parts: readonly {
        readonly y: number;
        readonly height: number;
        readonly svg: string;
    }[];
}, ScoreLoadError | ScoreRenderError, never>;
/** {@link renderScoreSvg} for callers outside Effect. */
export declare const renderScoreSvgPromise: (source: ScoreSource, options: RenderOptions) => Promise<StaticScore>;
export {};
