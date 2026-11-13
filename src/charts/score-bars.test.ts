import { describe, expect, it } from "bun:test"
import {
  barsLabel,
  barsOfBeatSpan,
  beatSpanOf,
  sameBars,
  sameBeats,
  selectionLabel,
  tempoAtBar,
  ticksOfBars,
  type BarTicks,
  type BeatPlace,
} from "./score-bars.ts"

const bars: Array<BarTicks> = [0, 1, 2, 3].map((i) => ({ start: i * 100, end: (i + 1) * 100 }))

describe("ticksOfBars", () => {
  it("runs from the first bar's start to the last bar's end", () => {
    expect(ticksOfBars(bars, { first: 1, last: 2 })).toEqual({ startTick: 100, endTick: 300 })
    expect(ticksOfBars(bars, { first: 3, last: 3 })).toEqual({ startTick: 300, endTick: 400 })
  })
})

describe("tempoAtBar", () => {
  const marked = (value?: number) => ({ tempoAutomations: value === undefined ? [] : [{ value }] })
  const tempos = [marked(90), marked(), marked(140), marked()]

  it("reads the marking on the bar itself", () => {
    expect(tempoAtBar(tempos, 2)).toBe(140)
  })

  it("carries the nearest earlier marking to a bar with none", () => {
    expect(tempoAtBar(tempos, 1)).toBe(90)
    expect(tempoAtBar(tempos, 3)).toBe(140)
  })

  it("is null when no bar up to it has a marking, or the score has no bars", () => {
    expect(tempoAtBar([marked(), marked(120)], 0)).toBeNull()
    expect(tempoAtBar([], 0)).toBeNull()
  })

  it("stays inside the score for an index past the last bar", () => {
    expect(tempoAtBar(tempos, 9)).toBe(140)
  })
})

describe("barsOfBeatSpan", () => {
  it("is the bars from the first beat's bar through the last beat's bar, whole or not", () => {
    const inside = { first: place(2, 1), last: place(2, 2) }
    expect(barsOfBeatSpan(inside)).toEqual({ first: 2, last: 2 })
    const across = { first: place(1, 0), last: place(3, 3) }
    expect(barsOfBeatSpan(across)).toEqual({ first: 1, last: 3 })
  })
})

describe("barsLabel", () => {
  it("counts bars from 1, and says Bar for one", () => {
    expect(barsLabel({ first: 2, last: 2 })).toBe("Bar 3")
    expect(barsLabel({ first: 2, last: 3 })).toBe("Bars 3–4")
  })
})

describe("sameBars", () => {
  it("compares the bounds, and treats two nulls as the same", () => {
    expect(sameBars({ first: 1, last: 2 }, { first: 1, last: 2 })).toBe(true)
    expect(sameBars({ first: 1, last: 2 }, { first: 1, last: 3 })).toBe(false)
    expect(sameBars(null, null)).toBe(true)
    expect(sameBars(null, { first: 0, last: 0 })).toBe(false)
  })
})

/** A beat in a voice of `beatCount` beats, in bar `bar`, shaped as alphaTab's model is. */
function beatAt(bar: number, index: number, beatCount: number) {
  return { index, voice: { beats: Array.from({ length: beatCount }), bar: { masterBar: { index: bar } } } }
}

function place(bar: number, beat: number, beatCount = 4): BeatPlace {
  return { bar, beat, beatCount }
}

describe("beatSpanOf", () => {
  it("reads each beat's bar, beat index and voice beat count, counting from 0", () => {
    expect(beatSpanOf(beatAt(2, 1, 4), beatAt(4, 3, 4))).toEqual({ first: place(2, 1), last: place(4, 3) })
  })
})

describe("selectionLabel", () => {
  it("writes a span of one whole bar as Bar N", () => {
    expect(selectionLabel({ first: place(2, 0), last: place(2, 3) })).toBe("Bar 3")
  })

  it("writes whole bars across bars as Bars N–M", () => {
    expect(selectionLabel({ first: place(2, 0), last: place(4, 3) })).toBe("Bars 3–5")
  })

  it("names one beat in a bar", () => {
    expect(selectionLabel({ first: place(2, 1), last: place(2, 1) })).toBe("Bar 3, beat 2")
  })

  it("names a run of beats in a bar", () => {
    expect(selectionLabel({ first: place(2, 0), last: place(2, 1) })).toBe("Bar 3, beats 1–2")
  })

  it("names the beats of a span across bars", () => {
    expect(selectionLabel({ first: place(2, 1), last: place(4, 0) })).toBe("Bar 3 beat 2 – Bar 5 beat 1")
  })

  it("names the beats across bars when only the first bar is whole", () => {
    expect(selectionLabel({ first: place(2, 0), last: place(4, 0) })).toBe("Bar 3 beat 1 – Bar 5 beat 1")
  })
})

describe("sameBeats", () => {
  it("compares each end's bar, beat and beat count, and treats two nulls as the same", () => {
    const span = { first: place(2, 0), last: place(3, 3) }
    expect(sameBeats(span, { first: place(2, 0), last: place(3, 3) })).toBe(true)
    expect(sameBeats(span, { first: place(2, 0), last: place(3, 2) })).toBe(false)
    expect(sameBeats(span, { first: place(2, 0), last: place(3, 3, 5) })).toBe(false)
    expect(sameBeats(null, null)).toBe(true)
    expect(sameBeats(span, null)).toBe(false)
  })
})
