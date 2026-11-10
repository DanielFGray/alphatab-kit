import { importer, rendering, Settings, type json, type model } from "@coderline/alphatab"
import { Effect, Match, Option, Schema } from "effect"

/** Where a score comes from: alphaTex text, or the bytes of a Guitar Pro, MusicXML or similar file. */
export const ScoreSource = Schema.Union([
  Schema.TaggedStruct("AlphaTex", { tex: Schema.String }),
  Schema.TaggedStruct("ScoreFile", { bytes: Schema.Uint8Array }),
])
export type ScoreSource = typeof ScoreSource.Type

/**
 * A score drawn once at a fixed width, as one `<svg>` that scales to its
 * container through its `viewBox`. The music symbols are text in alphaTab's
 * music font, so the page needs {@link musicFontCss}, or use {@link standaloneSvg}.
 */
export class StaticScore extends Schema.Class<StaticScore, { readonly brand: unique symbol }>("alphatab-kit/StaticScore")({
  svg: Schema.String,
  width: Schema.Finite,
  height: Schema.Finite,
}) {}

export class ScoreLoadError extends Schema.TaggedError<ScoreLoadError, { readonly brand: unique symbol }>()("ScoreLoadError", {
  cause: Schema.Defect(),
}) {}

export class ScoreRenderError extends Schema.TaggedError<ScoreRenderError, { readonly brand: unique symbol }>()("ScoreRenderError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Defect()),
}) {}

export interface RenderOptions {
  /** Layout width in CSS pixels; line breaks follow it. */
  readonly width: number
  /** Track indexes to draw. Defaults to the first track. */
  readonly tracks?: ReadonlyArray<number>
  /** alphaTab settings (display, notation, colors) applied over the defaults. */
  readonly settings?: json.SettingsJson
}

/**
 * Draws a score to SVG with alphaTab's own renderer, without a browser: no
 * DOM, no workers and no web fonts are needed, so it runs in a build step, on
 * a server or in a page.
 */
export const renderScoreSvg = Effect.fnUntraced(function* (source: ScoreSource, options: RenderOptions) {
  const settings = staticSettings(options.settings)
  const score = yield* Effect.try({
    try: () =>
      Match.valueTags(source, {
        AlphaTex: ({ tex }) => importer.ScoreLoader.loadAlphaTex(tex, settings),
        ScoreFile: ({ bytes }) => importer.ScoreLoader.loadScoreFromBytes(bytes, settings),
      }),
    catch: (cause) => new ScoreLoadError({ cause }),
  })
  return yield* drawScore(score, settings, options)
})

/** {@link renderScoreSvg} for callers outside Effect. */
export const renderScoreSvgPromise = (source: ScoreSource, options: RenderOptions): Promise<StaticScore> =>
  Effect.runPromise(renderScoreSvg(source, options))

/**
 * The CSS that draws alphaTab's music symbols in a static score: the music
 * font, and the class alphaTab gives each symbol. In the browser alphaTab
 * injects the same rule itself when a player starts; a static score has no
 * player, so the page must carry it.
 */
export const musicFontCss = (fontDirectory: string): string => {
  const size = new Settings().display.resources.engravingSettings.musicFontSize
  return `@font-face{font-family:'alphaTab';font-display:block;font-weight:normal;font-style:normal;src:url("${fontDirectory}Bravura.woff2") format('woff2'),url("${fontDirectory}Bravura.woff") format('woff'),url("${fontDirectory}Bravura.otf") format('opentype')}
.at-surface.at .at{font-family:'alphaTab';font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;font-size:${size}px;overflow:visible!important}`
}

/**
 * The score as a file of its own, with its music-font CSS inside, for a page
 * opened directly or printed. A browser loads no fonts for an SVG shown
 * through `<img>`; use a PNG there.
 */
export const standaloneSvg = (score: StaticScore, fontDirectory: string): string =>
  score.svg.replace(/^<svg([^>]*)>/, `<svg$1><style>${musicFontCss(fontDirectory)}</style>`)

const drawScore = (score: model.Score, settings: Settings, options: RenderOptions) =>
  Effect.callback<StaticScore, ScoreRenderError>((resume) => {
    const renderer = new rendering.ScoreRenderer(settings)
    renderer.width = options.width
    const parts: Array<string> = []
    renderer.preRender.on(() => {
      parts.length = 0
    })
    renderer.partialRenderFinished.on((part) => {
      Option.match(decodeSvg(part.renderResult), {
        onNone: () => resume(Effect.fail(new ScoreRenderError({ message: `partial ${part.id} is not SVG markup` }))),
        onSome: (svg) => parts.push(svg.replace(/^<svg /, `<svg x="${part.x}" y="${part.y}" `)),
      })
    })
    renderer.error.on((cause) => resume(Effect.fail(new ScoreRenderError({ message: cause.message, cause }))))
    renderer.renderFinished.on(({ totalWidth: width, totalHeight: height }) =>
      resume(
        Effect.succeed(
          new StaticScore({
            width,
            height,
            svg: `<svg xmlns="http://www.w3.org/2000/svg" class="at-surface at" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join("")}</svg>`,
          }),
        ),
      ),
    )
    renderer.renderScore(score, [...(options.tracks ?? [0])])
  })

const decodeSvg = Schema.decodeUnknownOption(Schema.String)

/**
 * Settings for a one-shot render: SVG output, everything drawn at once rather
 * than as the viewport scrolls, and no workers, which a server does not have.
 */
const staticSettings = (overrides: json.SettingsJson | undefined): Settings => {
  const settings = new Settings()
  if (overrides) settings.fillFromJson(overrides)
  settings.core.engine = "svg"
  settings.core.useWorkers = false
  settings.core.enableLazyLoading = false
  return settings
}
