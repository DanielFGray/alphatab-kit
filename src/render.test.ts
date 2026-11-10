import { expect, test } from "bun:test"
import { Effect } from "effect"
import { renderScoreSvg } from "./render.ts"
import { scoreSvg, standaloneSvg, staticScoreHtml } from "./static.ts"

const tex = `\\title "Probe" . :4 0.6 2.5 2.4 0.3 | 3.3 2.3 0.4 r`
const long = `. ${Array.from({ length: 24 }, () => ":4 0.6 2.5 2.4 0.3").join(" | ")}`
const render = (source: string, width: number) =>
  Effect.runPromise(renderScoreSvg({ _tag: "AlphaTex", tex: source }, { width }))

test("renderScoreSvg draws alphaTex as parts that tile the score's height", async () => {
  const score = await render(tex, 800)
  expect(score.width).toBe(800)
  expect(score.parts.length).toBeGreaterThan(1)
  const last = score.parts.at(-1)!
  expect(last.y + last.height).toBeLessThanOrEqual(score.height)
  expect(score.parts.map((p) => p.svg).join("")).toContain(">Probe<")
})

test("line breaks follow the width", async () => {
  const [wide, narrow] = await Promise.all([render(long, 1600), render(long, 400)])
  expect(narrow.height).toBeGreaterThan(wide.height)
})

test("staticScoreHtml stacks one view box per part, together covering the whole score", async () => {
  const score = await render(long, 600)
  const boxes = [...staticScoreHtml(score).matchAll(/class="at-static-part"[^>]*viewBox="0 ([\d.]+) 600 ([\d.]+)"/g)]
    .map(([, top, height]) => [Number(top), Number(height)] as const)
  expect(boxes.length).toBe(score.parts.length)
  expect(boxes[0]![0]).toBe(0)
  boxes.slice(1).forEach(([top], i) => expect(top).toBeCloseTo(boxes[i]![0] + boxes[i]![1]))
  expect(boxes.at(-1)![0] + boxes.at(-1)![1]).toBeCloseTo(score.height)
})

test("standaloneSvg is one SVG with the music-font CSS inside", async () => {
  const score = await render(tex, 600)
  const svg = standaloneSvg(score, "/alphatab/font/")
  expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 600 [\d.]+"[^>]*><style>@font-face\{font-family:'alphaTab'/)
  expect(svg).toContain(`url("/alphatab/font/Bravura.woff2")`)
  expect(svg.endsWith(scoreSvg(score).replace(/^<svg[^>]*>/, ""))).toBe(true)
})

test("bytes that are no score fail with ScoreLoadError", async () => {
  const error = await Effect.runPromise(
    renderScoreSvg({ _tag: "ScoreFile", bytes: new Uint8Array([1, 2, 3]) }, { width: 600 }).pipe(Effect.flip),
  )
  expect(error._tag).toBe("ScoreLoadError")
})

test("a render alphaTab skips fails with ScoreRenderError instead of waiting", async () => {
  const error = await Effect.runPromise(
    renderScoreSvg({ _tag: "AlphaTex", tex }, { width: 0 }).pipe(Effect.flip),
  )
  expect(error._tag).toBe("ScoreRenderError")
})
