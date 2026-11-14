import { describe, expect, test } from "bun:test"
import { Listener } from "./listener.ts"
import { MAX_REACH_MS, pairTake } from "./pairing.ts"
import { mix, noise, pluck, SAMPLE_RATE } from "./synth.ts"
import { summarize } from "./timing.ts"

const at = (...ms: ReadonlyArray<number>) => ms.map((atMs) => ({ atMs }))

/** Each written onset as its played offset, or "missed". */
const offsets = (played: ReadonlyArray<number>, written: ReadonlyArray<number>) =>
  pairTake(played, at(...written)).onsets.map((onset) => onset.played?.offsetMs ?? "missed")

describe("pairTake", () => {
  test("each note is timed against the onset it was played for", () => {
    expect(offsets([-8, 503, 1000, 1512], [0, 500, 1000, 1500])).toEqual([-8, 3, 0, 12])
  })

  test("a missed onset does not shift the notes after it", () => {
    const pairing = pairTake([2, 1004], at(0, 500, 1000))
    expect(pairing.onsets.map((onset) => onset.played?.offsetMs ?? "missed")).toEqual([2, "missed", 4])
    expect(pairing.hits.map((hit) => hit.atMs)).toEqual([2, 1004])
    expect(pairing.extra).toEqual([])
  })

  test("syncopation and rests need no grid: only the written times count", () => {
    // A dotted-quarter, eighth figure at 120 BPM, then a rest where a stray note lands.
    expect(offsets([5, 745, 1010], [0, 750, 1000])).toEqual([5, -5, 10])
    expect(pairTake([5, 745, 1010, 1600], at(0, 750, 1000)).extra).toEqual([1600])
  })

  test("of two notes for one onset, the closer counts and the other is extra", () => {
    const pairing = pairTake([-30, 6], at(0, 500))
    expect(pairing.onsets.map((onset) => onset.played?.offsetMs ?? "missed")).toEqual([6, "missed"])
    expect(pairing.extra).toEqual([-30])
  })

  test("an onset reaches halfway to its neighbours", () => {
    expect(offsets([249], [0, 500])).toEqual([249, "missed"])
    expect(offsets([250], [0, 500])).toEqual(["missed", -250])
  })

  test("a note far from every onset is extra, not late", () => {
    // Whole notes at 60 BPM are 4 s apart; a note 1 s after one is not a late note.
    const pairing = pairTake([1000, 4000], at(0, 4000))
    expect(pairing.onsets.map((onset) => onset.played?.offsetMs ?? "missed")).toEqual(["missed", 0])
    expect(pairing.extra).toEqual([1000])
    expect(offsets([MAX_REACH_MS - 1], [0, 4000])).toEqual([MAX_REACH_MS - 1, "missed"])
  })

  test("onsets closer than the listener can split share one note, timed from the nearer", () => {
    // A grace note 62.5 ms before its beat: the listener hears the pair as one
    // note, at the grace note when it is loud and at the beat when it is soft.
    const pairing = pairTake([-60, 500], at(-62.5, 0, 500))
    expect(pairing.onsets.map((onset) => onset.played?.offsetMs ?? "missed")).toEqual([2.5, 2.5, 0])
    expect(pairing.hits).toHaveLength(2)
    expect(pairing.extra).toEqual([])
    expect(offsets([3, 500], [-62.5, 0, 500])).toEqual([3, 3, 0])
  })

  test("the paired notes give the take's margin of error", () => {
    const summary = summarize(pairTake([-10, 510, 2000], at(0, 500, 1000, 1500)).hits)
    expect(summary.count).toBe(2)
    expect(summary.meanMs).toBe(0)
    expect(summary.spreadMs).toBe(10)
  })

  test("pairs what the listener hears in a take that shifts, skips and adds notes", () => {
    // 120 BPM: quarters, an eighth, a soft grace note before beat 4 of bar 1, then quarters.
    const written = [0, 500, 750, 1000, 1437.5, 1500, 2000, 2500]
    const shiftMs = [8, -12, 5, "skip", 4, 4, 15, -6] as const
    const extraMs = 1800
    const startFrame = SAMPLE_RATE // the take starts a second into the signal
    const frameOf = (ms: number) => startFrame + Math.round((ms / 1000) * SAMPLE_RATE)
    const signal = noise(SAMPLE_RATE * 5, 0.001, 7)
    written.forEach((ms, i) => {
      const shift = shiftMs[i]!
      if (shift === "skip") return
      const grace = i === 4
      mix(signal, pluck(SAMPLE_RATE, 110 + 20 * i, i + 1), frameOf(ms + shift), grace ? 0.2 : 1)
    })
    mix(signal, pluck(SAMPLE_RATE, 330, 99), frameOf(extraMs))
    const listener = new Listener(SAMPLE_RATE)
    const heardMs: Array<number> = []
    for (let i = 0; i < signal.length; i += 128)
      for (const note of listener.push(signal.subarray(i, i + 128), i))
        if (note.frame !== undefined) heardMs.push(((note.frame - startFrame) / SAMPLE_RATE) * 1000)

    const pairing = pairTake(heardMs, at(...written))
    const expected = [8, -12, 5, "missed", 4, 4, 15, -6] as const
    pairing.onsets.forEach((onset, i) => {
      const want = expected[i]!
      if (want === "missed") expect(onset.played).toBeNull()
      else expect(Math.abs(onset.played!.offsetMs - want)).toBeLessThan(1.5)
    })
    expect(pairing.extra).toHaveLength(1)
    expect(Math.abs(pairing.extra[0]! - extraMs)).toBeLessThan(1.5)
  })

  test("each pair keeps the written onset it was given", () => {
    const written = [{ atMs: 0, pitches: [40] }]
    expect(pairTake([1], written).onsets[0]?.written).toBe(written[0]!)
  })

  test("no written onsets make every note extra", () => {
    expect(pairTake([0, 100], [])).toEqual({ onsets: [], hits: [], extra: [0, 100] })
  })
})
