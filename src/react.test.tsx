import { expect, test } from "bun:test"
import { Effect } from "effect"
import { renderToString } from "react-dom/server"
import { StaticScoreFrame } from "./react.tsx"
import { renderScoreSvg } from "./render.ts"
import { staticScoreHtml } from "./static.ts"

test("server markup holds the static score, the player element and the frame CSS", async () => {
  const score = await Effect.runPromise(renderScoreSvg({ _tag: "AlphaTex", tex: ". :4 0.6 2.5 | 3.3 2.3" }, { width: 600 }))
  const html = renderToString(
    <StaticScoreFrame score={score} playerReady={false}>
      <div id="player" />
    </StaticScoreFrame>,
  )
  expect(html).toContain(`<div class="at-frame-static">${staticScoreHtml(score)}</div>`)
  expect(html).toContain(`<div class="at-frame-player"><div id="player"></div></div>`)
  expect(html).toContain(`<link rel="preload" href="/alphatab/font/Bravura.woff2" as="font"`)
  expect(html).toContain(`url("/alphatab/font/Bravura.woff2")`)
  expect(html).toContain(`<div class="at-frame"><div class="at-frame-static">`)
})
