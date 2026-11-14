/**
 * Plays a synthetic take into the click parts through Chromium's fake
 * microphone, and checks the offsets the chart reports against the ones
 * played. The unit tests cannot reach this path: the worklet loading from a
 * Blob, the mic opened by its deviceId, and the hook folding the engine's events.
 *
 * The fake microphone plays a WAV file: clicks at 100 BPM, as speakers would
 * put them into the mic, and from the 8th second drum hits at known offsets
 * from the clicks. The page's own clicks do not reach the fake mic, so the
 * file's clicks stand in for them; the session measures their phase as the
 * latency. Run with `bun run e2e`; it needs /usr/bin/chromium, or CHROMIUM=<path>.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { chromium, type Page } from "playwright-core"
import { ACCENT_GAIN, BEAT_GAIN } from "../../src/click/click.ts"
import { drum, mix, mixClick, noise, SAMPLE_RATE } from "../../src/click/synth.ts"

const BPM = 100
const PATTERN_MS = [-20, -10, 0, 10, 20, 5, -5, 0]
const SECONDS = 40
const FIRST_HIT_SECONDS = 8
const LISTEN_MS = 16_000
/** Pocket's bar: the worst note may be this far from what was played. */
const TOLERANCE_MS = 1.5

const dir = mkdtempSync(join(tmpdir(), "gigbag-click-e2e-"))
const failures: Array<string> = []
try {
  const wav = join(dir, "take.wav")
  writeFileSync(wav, toWav(syntheticTake(), SAMPLE_RATE))
  const built = await Bun.build({ entrypoints: [join(import.meta.dir, "page.tsx")], target: "browser" })
  if (!built.success) throw new AggregateError(built.logs, "the test page did not build")
  const script = await built.outputs[0]!.text()
  const server = Bun.serve({
    port: 0,
    fetch: (request) =>
      new URL(request.url).pathname === "/page.js"
        ? new Response(script, { headers: { "content-type": "text/javascript" } })
        : new Response(`<!doctype html><div id="root"></div><script type="module" src="/page.js"></script>`, {
            headers: { "content-type": "text/html" },
          }),
  })
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${wav}`,
      "--autoplay-policy=no-user-gesture-required",
    ],
  })
  try {
    const page = await browser.newPage()
    page.on("pageerror", (error) => failures.push(`page error: ${error.message}`))
    const origin = `http://localhost:${server.port}`

    // A saved mic that is gone: the take fails with words the player can act on.
    await page.goto(`${origin}/?mic=unplugged`)
    await page.click("[data-test=listen]")
    await page
      .waitForFunction(
        () => document.querySelector("[data-test=status]")?.textContent?.includes("not connected"),
        null,
        { timeout: 5000 },
      )
      .catch(() => failures.push("a gone mic does not say it is not connected"))
    console.log(`a gone mic shows: ${await text(page, "status")}`)
    await page.click("[data-test=listen]")

    // Choose a fake input that is not the default, by its id, then listen.
    await page.goto(origin)
    await page.click("[data-test=listen]")
    await page.waitForFunction(() => document.querySelector("[data-test=device]")?.textContent !== "")
    await page.click("[data-test=listen]")
    const mics = await page.$$eval("[data-test=mic] option", (options) =>
      options.map((o) => ({ id: (o as HTMLOptionElement).value, label: o.textContent ?? "" })),
    )
    console.log(`mics: ${mics.map((m) => m.label).join(", ")}`)
    const chosen = mics.find((m) => m.id !== "" && m.id !== "default")
    if (chosen === undefined) failures.push("no fake input besides the default to choose")
    else await page.selectOption("[data-test=mic]", chosen.id)
    await page.click("[data-test=listen]")
    await page.waitForTimeout(LISTEN_MS)
    const device = await text(page, "device")
    console.log(`listening on: ${device}; status: ${await text(page, "status")}`)
    if (chosen !== undefined && device !== chosen.label) failures.push(`listened on ${device}, not ${chosen.label}`)

    const offsets = await page.$$eval("circle[data-offset-ms]", (marks) =>
      marks.map((mark) => Number((mark as SVGElement).dataset.offsetMs)),
    )
    console.log(`heard: ${offsets.join(" ")}`)
    const worst = Math.min(
      ...PATTERN_MS.map((_, shift) =>
        Math.max(...offsets.map((ms, i) => Math.abs(ms - PATTERN_MS[(i + shift) % PATTERN_MS.length]!))),
      ),
    )
    console.log(`worst error against the played pattern: ${worst.toFixed(2)} ms over ${offsets.length} notes`)
    if (offsets.length < 10) failures.push(`heard only ${offsets.length} notes`)
    if (!(worst <= TOLERANCE_MS)) failures.push(`worst note ${worst.toFixed(2)} ms off, over ${TOLERANCE_MS} ms`)
  } finally {
    await browser.close()
    void server.stop(true)
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
for (const failure of failures) console.error(`FAIL ${failure}`)
process.exitCode = failures.length === 0 ? 0 : 1

async function text(page: Page, test: string): Promise<string> {
  return (await page.textContent(`[data-test=${test}]`)) ?? ""
}

/** Clicks at BPM from the start, and drum hits at PATTERN_MS from each click after FIRST_HIT_SECONDS. */
function syntheticTake(): Float32Array {
  const framesPerBeat = (60 / BPM) * SAMPLE_RATE
  const signal = noise(SECONDS * SAMPLE_RATE, 0.001, 11)
  for (let beat = 0; beat * framesPerBeat < signal.length; beat++) {
    const at = Math.round(beat * framesPerBeat)
    mixClick(signal, at, 0.5 * (beat % 4 === 0 ? ACCENT_GAIN : BEAT_GAIN))
    const offsetMs = PATTERN_MS[beat % PATTERN_MS.length]!
    if (at >= FIRST_HIT_SECONDS * SAMPLE_RATE)
      mix(signal, drum(SAMPLE_RATE, beat), Math.round(at + (offsetMs / 1000) * SAMPLE_RATE))
  }
  return signal
}

/** 16-bit mono PCM. */
function toWav(samples: Float32Array, sampleRate: number): Buffer {
  const out = Buffer.alloc(44 + samples.length * 2)
  out.write("RIFF", 0)
  out.writeUInt32LE(36 + samples.length * 2, 4)
  out.write("WAVEfmt ", 8)
  out.writeUInt32LE(16, 16)
  out.writeUInt16LE(1, 20)
  out.writeUInt16LE(1, 22)
  out.writeUInt32LE(sampleRate, 24)
  out.writeUInt32LE(sampleRate * 2, 28)
  out.writeUInt16LE(2, 32)
  out.writeUInt16LE(16, 34)
  out.write("data", 36)
  out.writeUInt32LE(samples.length * 2, 40)
  samples.forEach((s, i) => out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2))
  return out
}
