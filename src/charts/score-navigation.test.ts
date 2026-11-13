import { describe, expect, test } from "bun:test"
import type { model } from "@coderline/alphatab"
import { barEdgeBeat, beatIndexAt, collectBeats } from "./score-navigation.ts"

/**
 * A track shaped like alphaTab's model: staves → bars → voices → beats, where
 * each beat points back at its voice and bar. Only the fields navigation reads
 * are present, so the one cast at the return is the whole gap to model.Track.
 */
function fakeTrack(bars: readonly { masterBar: number; voices: readonly (readonly number[])[] }[]) {
  const staff = { bars: [] as unknown[] }
  for (const spec of bars) {
    const bar = { masterBar: { index: spec.masterBar }, voices: [] as unknown[] }
    for (const ticks of spec.voices) {
      const voice = { bar, beats: [] as unknown[] }
      voice.beats = ticks.map((tick) => ({ absolutePlaybackStart: tick, voice }))
      bar.voices.push(voice)
    }
    staff.bars.push(bar)
  }
  return { staves: [staff] } as unknown as model.Track
}

/** Every beat of a fake track, in the order the track lists them. */
function beatsOf(track: model.Track): model.Beat[] {
  return track.staves
    .flatMap((staff) => staff.bars)
    .flatMap((bar) => bar.voices)
    .flatMap((voice) => voice.beats)
}

describe("collectBeats", () => {
  test("orders beats by start tick across bars and tracks", () => {
    const melody = fakeTrack([
      { masterBar: 0, voices: [[0, 480]] },
      { masterBar: 1, voices: [[960, 1440]] },
    ])
    const bass = fakeTrack([
      { masterBar: 0, voices: [[240]] },
      { masterBar: 1, voices: [[1200]] },
    ])

    const ticks = collectBeats([melody, bass]).map((nav) => nav.startTick)

    expect(ticks).toEqual([0, 240, 480, 960, 1200, 1440])
  })

  test("keeps one beat per start tick, and the earlier track's beat wins", () => {
    const first = fakeTrack([{ masterBar: 0, voices: [[0]] }])
    const second = fakeTrack([{ masterBar: 0, voices: [[0]] }])

    const result = collectBeats([first, second])

    expect(result).toHaveLength(1)
    expect(result[0]?.beat).toBe(beatsOf(first)[0] as model.Beat)
  })

  test("records the master bar each beat sits in", () => {
    const track = fakeTrack([
      { masterBar: 0, voices: [[0, 480]] },
      { masterBar: 3, voices: [[960]] },
    ])

    const result = collectBeats([track])

    expect(result.map((nav) => nav.masterBarIndex)).toEqual([0, 0, 3])
  })

  test("returns nothing for no tracks", () => {
    expect(collectBeats([])).toEqual([])
  })
})

describe("beatIndexAt", () => {
  const beats = collectBeats([
    fakeTrack([
      { masterBar: 0, voices: [[100, 200]] },
      { masterBar: 1, voices: [[300]] },
    ]),
  ])

  test("returns -1 when there are no beats", () => {
    expect(beatIndexAt([], 50)).toBe(-1)
  })

  test("returns 0 for a tick before the first beat", () => {
    expect(beatIndexAt(beats, 50)).toBe(0)
  })

  test("returns the beat whose start tick is exactly the tick", () => {
    expect(beatIndexAt(beats, 200)).toBe(1)
  })

  test("returns the last beat that started before the tick, between beats", () => {
    expect(beatIndexAt(beats, 250)).toBe(1)
  })

  test("returns the last beat for a tick after the final beat", () => {
    expect(beatIndexAt(beats, 9999)).toBe(2)
  })
})

describe("barEdgeBeat", () => {
  // Bar 0 holds indexes 0-2, bar 1 holds index 3, bar 2 holds indexes 4-5.
  const beats = collectBeats([
    fakeTrack([
      { masterBar: 0, voices: [[0, 100, 200]] },
      { masterBar: 1, voices: [[300]] },
      { masterBar: 2, voices: [[400, 500]] },
    ]),
  ])

  test("finds the first beat of the bar from its middle", () => {
    expect(barEdgeBeat(beats, 1, "start")?.startTick).toBe(0)
  })

  test("finds the last beat of the bar from its middle", () => {
    expect(barEdgeBeat(beats, 1, "end")?.startTick).toBe(200)
  })

  test("stops at the bar boundary, not the neighbouring bar", () => {
    expect(barEdgeBeat(beats, 4, "start")?.startTick).toBe(400)
    expect(barEdgeBeat(beats, 2, "end")?.startTick).toBe(200)
  })

  test("returns the same beat for both edges of a one-beat bar", () => {
    expect(barEdgeBeat(beats, 3, "start")?.startTick).toBe(300)
    expect(barEdgeBeat(beats, 3, "end")?.startTick).toBe(300)
  })

  test("returns null for an index outside the beats", () => {
    expect(barEdgeBeat(beats, 99, "start")).toBeNull()
  })
})
