import { describe, expect, test } from "bun:test"
import { BOTH_NOTATIONS, defaultNotation, staffNotation, toggleNotation } from "./score-notation.ts"

const track = (program: number, isPercussion = false) => ({ isPercussion, playbackInfo: { program } })

describe("toggleNotation", () => {
  test("turns one notation off while the other stays on", () => {
    expect(toggleNotation(BOTH_NOTATIONS, "tab")).toEqual({ standard: true, tab: false })
    expect(toggleNotation(BOTH_NOTATIONS, "standard")).toEqual({ standard: false, tab: true })
  })
  test("turning off the only notation on turns the other on", () => {
    expect(toggleNotation({ standard: false, tab: true }, "tab")).toEqual({ standard: true, tab: false })
    expect(toggleNotation({ standard: true, tab: false }, "standard")).toEqual({ standard: false, tab: true })
  })
  test("turns a hidden notation back on", () => {
    expect(toggleNotation({ standard: false, tab: true }, "standard")).toEqual(BOTH_NOTATIONS)
  })
})

describe("staffNotation", () => {
  test("a stringed staff follows the choice", () => {
    expect(staffNotation(true, { standard: false, tab: true })).toEqual({ standard: false, tab: true })
    expect(staffNotation(true, { standard: true, tab: false })).toEqual({ standard: true, tab: false })
  })
  test("a staff without tab (piano, drums) always keeps standard notation and never shows tab", () => {
    expect(staffNotation(false, { standard: false, tab: true })).toEqual({ standard: true, tab: false })
  })
})

describe("defaultNotation", () => {
  test("a guitar or bass shows standard notation and tab", () => {
    expect(defaultNotation(track(24))).toEqual(BOTH_NOTATIONS)
    expect(defaultNotation(track(31))).toEqual(BOTH_NOTATIONS)
    expect(defaultNotation(track(32))).toEqual(BOTH_NOTATIONS)
    expect(defaultNotation(track(39))).toEqual(BOTH_NOTATIONS)
  })
  test("other stringed instruments and other instruments show standard notation alone", () => {
    const standardOnly = { standard: true, tab: false }
    expect(defaultNotation(track(40))).toEqual(standardOnly) // violin
    expect(defaultNotation(track(105))).toEqual(standardOnly) // banjo
    expect(defaultNotation(track(0))).toEqual(standardOnly) // piano
    expect(defaultNotation(track(23))).toEqual(standardOnly) // just below the guitar range
    expect(defaultNotation(track(41))).toEqual(standardOnly) // viola, just above the bass range
  })
  test("a percussion track never shows tab, even on a guitar program number", () => {
    expect(defaultNotation(track(24, true))).toEqual({ standard: true, tab: false })
  })
})
