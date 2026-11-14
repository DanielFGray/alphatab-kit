import { describe, expect, test } from "bun:test"
import { readPhrase } from "./phrase.ts"
import { type ScoreOnsetOptions, scoreOnsets } from "./score-onsets.ts"

function scoreOf(tex: string) {
  const read = readPhrase(tex, null)
  if (!("score" in read)) throw new Error(read.problems.map((p) => p.message).join("; "))
  return read.score
}

const options = (o: Partial<ScoreOnsetOptions> = {}): ScoreOnsetOptions => ({
  track: 0,
  bars: { first: 0, last: 0 },
  speed: 1,
  ...o,
})

/** Each onset as `atMs:key,key`, durations left out. */
const timeline = (tex: string, o: Partial<ScoreOnsetOptions> = {}) =>
  scoreOnsets(scoreOf(tex), options(o)).map((onset) => `${round(onset.atMs)}:${onset.pitches.join(",")}`)

const round = (ms: number) => Math.round(ms * 10) / 10

describe("scoreOnsets", () => {
  // At 120 BPM a quarter note is 500 ms. String 6 open is E2, MIDI 40.
  test("a chord is one onset; a tied note and a rest start nothing", () => {
    const tex = "\\tempo 120 . 0.6.4 (0.6{t}).4 (0.5 2.4 2.3).4 r.4 | 3.6.2 3.6.2"
    expect(timeline(tex, { bars: { first: 0, last: 1 } })).toEqual(["0:40", "1000:45,52,57", "2000:43", "3000:43"])
    expect(scoreOnsets(scoreOf(tex), options()).map((onset) => onset.durationMs)).toEqual([1000, 500])
  })

  test("a strum starts at its first string, and a tempo change retimes what follows", () => {
    // 100 BPM: a quarter is 600 ms; the second bar is at 50 BPM, its whole note 4800 ms.
    const tex = "\\tempo 100 . (0.6 2.5 2.4).4{bd} 0.6.4 0.6.2 | \\tempo 50 0.6.1"
    expect(timeline(tex, { bars: { first: 0, last: 1 } })).toEqual(["0:40,47,52", "600:40", "1200:40", "2400:40"])
    expect(scoreOnsets(scoreOf(tex), options({ bars: { first: 1, last: 1 } }))[0]?.durationMs).toBe(4800)
  })

  test("times are counted from the run's first beat, at the practice speed", () => {
    const tex = "\\tempo 120 . 0.6.2 0.5.2 | 1.6.2 2.6.2"
    expect(timeline(tex, { bars: { first: 1, last: 1 } })).toEqual(["0:41", "1000:42"])
    expect(timeline(tex, { bars: { first: 1, last: 1 }, speed: 0.5 })).toEqual(["0:41", "2000:42"])
  })

  describe("in play order", () => {
    // Bars 0-1 repeat; bar 2 opens with a grace note, played before its beat.
    const tex = "\\tempo 120 . \\ro 0.6.2 0.5.2 | \\rc 2 1.6.1 | 3.6{gr}.16 5.6.2 r.2"

    test("a repeat inside the run plays as written", () => {
      expect(timeline(tex, { bars: { first: 0, last: 2 } })).toEqual([
        "0:40",
        "1000:45",
        "2000:41",
        "4000:40",
        "5000:45",
        "6000:41",
        "7937.5:43",
        "8000:45",
      ])
    })

    test("a run inside a repeat plays once", () => {
      expect(timeline(tex, { bars: { first: 0, last: 1 } })).toEqual(["0:40", "1000:45", "2000:41"])
    })

    test("a grace note before the run's first beat belongs to the run, and to no run before it", () => {
      expect(timeline(tex, { bars: { first: 2, last: 2 } })).toEqual(["-62.5:43", "0:45"])
      expect(timeline(tex, { bars: { first: 1, last: 1 } })).toEqual(["0:41"])
    })
  })

  test("only the chosen track's notes count, from all its staves and voices", () => {
    const tex = '\\tempo 120 . \\track "Lead" 0.6.1 | \\track "Bass" \\staff {score} C2.2 D2.2'
    expect(timeline(tex, { track: 0 })).toEqual(["0:40"])
    expect(timeline(tex, { track: 1 })).toEqual(["0:36", "1000:38"])
  })

  test("each onset names the beats it comes from", () => {
    const [chord] = scoreOnsets(scoreOf("\\tempo 120 . (0.5 2.4).1"), options())
    expect(chord?.beats.map((beat) => beat.notes.length)).toEqual([2])
  })

  test("a run the score never plays has no onsets", () => {
    expect(timeline("0.6.1", { bars: { first: 3, last: 4 } })).toEqual([])
  })
})
