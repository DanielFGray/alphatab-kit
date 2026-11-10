import { Schema } from "effect";
/**
 * One horizontal band of a drawn score, as alphaTab's renderer emits it: the
 * title block, or one system of staves. `svg` is a complete `<svg>` in the
 * band's own coordinates; `y` places it in the score.
 */
export declare const StaticPart: Schema.Struct<{
    readonly y: Schema.Finite;
    readonly height: Schema.Finite;
    readonly svg: Schema.String;
}>;
export type StaticPart = typeof StaticPart.Type;
/**
 * A score drawn once at a fixed width, kept as its parts so that printing can
 * break pages between systems. The music symbols are text in alphaTab's music
 * font, sized relative to `musicFontSize`: show the score with
 * {@link staticScoreHtml} on a page that carries {@link staticScoreCss}, or as
 * one file with {@link standaloneSvg}. A plain structure, so it passes through
 * JSON and server-rendering loaders as it is.
 */
export declare const StaticScore: Schema.Struct<{
    readonly width: Schema.Finite;
    readonly height: Schema.Finite;
    readonly musicFontSize: Schema.Finite;
    readonly parts: Schema.$Array<Schema.Struct<{
        readonly y: Schema.Finite;
        readonly height: Schema.Finite;
        readonly svg: Schema.String;
    }>>;
}>;
export type StaticScore = typeof StaticScore.Type;
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
