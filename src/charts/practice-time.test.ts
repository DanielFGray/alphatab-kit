import { describe, expect, test } from "bun:test"
import { REPORT_THRESHOLD_MS, STOPPED_CLOCK, start, stop, takeWholeSeconds, tick } from "./practice-time.ts"

describe("start", () => {
  test("begins counting from the given time", () => {
    expect(start(STOPPED_CLOCK, 1000)).toEqual({ pendingMs: 0, since: 1000 })
  })
  test("changes nothing while already playing", () => {
    const playing = { pendingMs: 200, since: 1000 }
    expect(start(playing, 1500)).toBe(playing)
  })
})

describe("tick", () => {
  test("adds the time since the last tick and moves the start to now", () => {
    expect(tick({ pendingMs: 200, since: 1000 }, 2000)).toEqual({ pendingMs: 1200, since: 2000 })
  })
  test("changes nothing while stopped", () => {
    expect(tick(STOPPED_CLOCK, 2000)).toBe(STOPPED_CLOCK)
  })
})

describe("stop", () => {
  test("adds the time since the last tick and clears the start", () => {
    expect(stop({ pendingMs: 200, since: 1000 }, 1400)).toEqual({ pendingMs: 600, since: null })
  })
  test("changes nothing while already stopped", () => {
    expect(stop(STOPPED_CLOCK, 1400)).toBe(STOPPED_CLOCK)
  })
})

describe("takeWholeSeconds", () => {
  test("reports nothing and keeps the clock when less than the minimum is pending", () => {
    const clock = { pendingMs: 4999, since: null }
    const result = takeWholeSeconds(clock, REPORT_THRESHOLD_MS)
    expect(result.seconds).toBe(0)
    expect(result.clock).toBe(clock)
  })
  test("reports whole seconds at the threshold and keeps the remainder", () => {
    const result = takeWholeSeconds({ pendingMs: 5300, since: null }, REPORT_THRESHOLD_MS)
    expect(result).toEqual({ seconds: 5, clock: { pendingMs: 300, since: null } })
  })
  test("reports on stop with no threshold, so a short pending time still counts", () => {
    expect(takeWholeSeconds({ pendingMs: 2400, since: null }, 0)).toEqual({
      seconds: 2,
      clock: { pendingMs: 400, since: null },
    })
  })
  test("reports nothing when less than a second is pending", () => {
    const clock = { pendingMs: 900, since: null }
    const result = takeWholeSeconds(clock, 0)
    expect(result.seconds).toBe(0)
    expect(result.clock).toBe(clock)
  })
  test("keeps the start time of a running clock", () => {
    const result = takeWholeSeconds({ pendingMs: 5300, since: 9000 }, REPORT_THRESHOLD_MS)
    expect(result.clock.since).toBe(9000)
  })
})
