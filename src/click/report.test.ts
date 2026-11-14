import { describe, expect, test } from "bun:test"
import type { ClickEvent } from "./engine.ts"
import { chartRangeMs, hitTiles, meterFill, signedMs, takeStatus } from "./report.ts"
import { NEW_TAKE, takeStep } from "./take.ts"

const fold = (events: ReadonlyArray<ClickEvent>) => events.reduce(takeStep, NEW_TAKE)

const opened: ReadonlyArray<ClickEvent> = [
  { _tag: "Listening", device: "USB mic", reportedLatencyMs: 20 },
  { _tag: "Beat", beat: 0 },
]

describe("a take's words", () => {
  test("tell the player what to do at each stage, counting in by the click's bar", () => {
    expect(takeStatus(NEW_TAKE, true, 4)).toBe("Opening the microphone…")
    expect(takeStatus(fold(opened), true, 4)).toBe("Count-in 1 of 8: listen while the mic measures the click.")
    expect(takeStatus(fold(opened), true, 3)).toBe("Count-in 1 of 6: listen while the mic measures the click.")
    const playing = fold([
      ...opened,
      { _tag: "MeasuredLatency", latencyMs: 87.4, clickLeak: 0.1 },
      { _tag: "Note", atMs: 90 },
    ])
    expect(takeStatus(playing, true, 4)).toBe("Play. Speaker-to-mic delay 87 ms.")
    expect(takeStatus(playing, false, 4)).toBe("Stopped after 1 note.")
  })

  test("say why a take cannot be scored, during it and after it stops", () => {
    const missed = fold([...opened, { _tag: "MissedClick" }])
    expect(takeStatus(missed, true, 4)).toContain("did not hear the click")
    expect(takeStatus(missed, false, 4)).toContain("did not hear the click")
    expect(takeStatus(fold([{ _tag: "Failed", reason: "Microphone access was refused." }]), false, 4)).toBe(
      "Microphone access was refused.",
    )
  })

  test("summarise the notes as the player would say it", () => {
    expect(hitTiles([])).toEqual([
      ["Notes", "0"],
      ["Average", "—"],
      ["Spread", "—"],
      ["Within ±10 ms", "—"],
    ])
    const hits = [-20, -4, -6].map((offsetMs, beat) => ({ offsetMs, beat, step: 0 }))
    expect(hitTiles(hits)).toEqual([
      ["Notes", "3"],
      ["Average", "−10.0 ms rushing"],
      ["Spread", "±7.1 ms"],
      ["Within ±10 ms", "67%"],
    ])
    expect(signedMs(4.25)).toBe("+4.3 ms")
    expect(signedMs(0)).toBe("±0.0 ms")
  })
})

test("the mic meter runs from -60 dBFS to full scale", () => {
  expect([0, 0.001, 1, 2].map(meterFill)).toEqual([0, 0, 1, 1])
  expect(meterFill(0.01)).toBeCloseTo(1 / 3)
})

test("the offset chart reaches twice the tight band, or past the widest note in 10 ms steps", () => {
  expect(chartRangeMs([])).toBe(20)
  expect(chartRangeMs([{ offsetMs: -34 }])).toBe(40)
})
