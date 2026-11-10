import { expect, test } from "bun:test"
import { Effect } from "effect"
import { renderScoreSvg, standaloneSvg } from "./render.ts"

const tex = `\\title "Probe" . :4 0.6 2.5 2.4 0.3 | 3.3 2.3 0.4 r`

test("renderScoreSvg draws alphaTex into one scalable SVG at the given width", async () => {
  const score = await Effect.runPromise(renderScoreSvg({ _tag: "AlphaTex", tex }, { width: 800 }))
  expect(score.width).toBe(800)
  expect(score.height).toBeGreaterThan(100)
  expect(score.svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" class="at-surface at" viewBox="0 0 800 `)).toBe(true)
  expect(score.svg).toContain(`class="at"`)
  expect(score.svg).toContain(">Probe<")
})

test("line breaks follow the width", async () => {
  const long = `. ${Array.from({ length: 24 }, () => ":4 0.6 2.5 2.4 0.3").join(" | ")}`
  const render = (width: number) => Effect.runPromise(renderScoreSvg({ _tag: "AlphaTex", tex: long }, { width }))
  const [wide, narrow] = await Promise.all([render(1600), render(400)])
  expect(narrow.height).toBeGreaterThan(wide.height)
})

test("standaloneSvg carries the music-font CSS inside the SVG", async () => {
  const score = await Effect.runPromise(renderScoreSvg({ _tag: "AlphaTex", tex }, { width: 600 }))
  const svg = standaloneSvg(score, "/alphatab/font/")
  expect(svg).toMatch(/^<svg [^>]*><style>@font-face\{font-family:'alphaTab'/)
  expect(svg).toContain(`url("/alphatab/font/Bravura.woff2")`)
})

test("bytes that are no score fail with ScoreLoadError", async () => {
  const error = await Effect.runPromise(
    renderScoreSvg({ _tag: "ScoreFile", bytes: new Uint8Array([1, 2, 3]) }, { width: 600 }).pipe(Effect.flip),
  )
  expect(error._tag).toBe("ScoreLoadError")
})
