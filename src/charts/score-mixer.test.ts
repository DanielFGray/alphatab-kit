import { describe, expect, test } from "bun:test"
import {
  MAX_VOLUME,
  MIN_VOLUME,
  clampVolume,
  createMixer,
  fitMixer,
  setMaster,
  setMute,
  setSolo,
  setTrackVolume,
} from "./score-mixer.ts"

describe("createMixer", () => {
  test("starts each track at its file's volume with nothing soloed or muted", () => {
    expect(createMixer([1, 0.5])).toEqual({
      master: 1,
      tracks: [
        { volume: 1, solo: false, mute: false },
        { volume: 0.5, solo: false, mute: false },
      ],
    })
  })
  test("clamps a file volume outside the range alphaTab accepts", () => {
    expect(createMixer([2]).tracks[0]?.volume).toBe(MAX_VOLUME)
  })
  test("makes an empty track list for a score with no tracks", () => {
    expect(createMixer([]).tracks).toEqual([])
  })
})

describe("setMaster", () => {
  test("sets the master volume", () => {
    expect(setMaster(createMixer([1]), 0.4).master).toBe(0.4)
  })
  test("clamps the master volume to the range alphaTab accepts", () => {
    expect(setMaster(createMixer([1]), 3).master).toBe(MAX_VOLUME)
    expect(setMaster(createMixer([1]), -1).master).toBe(MIN_VOLUME)
  })
  test("returns a new mixer and leaves the old one unchanged", () => {
    const before = createMixer([1])
    const after = setMaster(before, 0.5)
    expect(after).not.toBe(before)
    expect(before.master).toBe(1)
  })
})

describe("setTrackVolume", () => {
  test("sets only the named track's volume", () => {
    const mixer = setTrackVolume(createMixer([1, 1]), 1, 0.25)
    expect(mixer.tracks[0]).toEqual({ volume: 1, solo: false, mute: false })
    expect(mixer.tracks[1]?.volume).toBe(0.25)
  })
  test("clamps the track volume to the range alphaTab accepts", () => {
    expect(setTrackVolume(createMixer([1]), 0, 1.5).tracks[0]?.volume).toBe(MAX_VOLUME)
  })
  test("throws a RangeError for a track outside the score", () => {
    expect(() => setTrackVolume(createMixer([1, 1]), 2, 0.5)).toThrow(RangeError)
  })
})

describe("setSolo and setMute", () => {
  test("store the flag on the named track only", () => {
    const soloed = setSolo(createMixer([1, 1]), 0, true)
    expect(soloed.tracks[0]?.solo).toBe(true)
    expect(soloed.tracks[1]?.solo).toBe(false)
    const muted = setMute(soloed, 1, true)
    expect(muted.tracks[1]?.mute).toBe(true)
    expect(muted.tracks[0]?.solo).toBe(true)
  })
  test("can clear a flag", () => {
    expect(setMute(setMute(createMixer([1]), 0, true), 0, false).tracks[0]?.mute).toBe(false)
  })
  test("throws a RangeError for a track outside the score", () => {
    expect(() => setSolo(createMixer([1]), -1, true)).toThrow(RangeError)
    expect(() => setMute(createMixer([1]), 1.5, true)).toThrow(RangeError)
  })
})

describe("fitMixer", () => {
  test("drops tracks past the end of the score", () => {
    const saved = createMixer([1, 1, 1])
    expect(fitMixer(saved, [1]).tracks).toHaveLength(1)
  })
  test("gives tracks the saved mixer does not have their file's volume", () => {
    const saved = createMixer([1])
    const fitted = fitMixer(saved, [1, 1, 0.75])
    expect(fitted.tracks[2]).toEqual({ volume: 0.75, solo: false, mute: false })
  })
  test("keeps the settings of the tracks that survive", () => {
    const saved = setMute(setTrackVolume(createMixer([1, 1]), 1, 0.3), 1, true)
    expect(fitMixer(saved, [1, 1])).toEqual(saved)
  })
  test("clamps saved volumes that are out of range", () => {
    const saved = { master: 2, tracks: [{ volume: -0.5, solo: false, mute: false }] }
    const fitted = fitMixer(saved, [1])
    expect(fitted.master).toBe(MAX_VOLUME)
    expect(fitted.tracks[0]?.volume).toBe(MIN_VOLUME)
  })
})

describe("clampVolume", () => {
  test("keeps an in-range volume unchanged", () => {
    expect(clampVolume(0.7)).toBe(0.7)
  })
  test("falls back to normal volume for a value that is not a number", () => {
    expect(clampVolume(Number.NaN)).toBe(1)
    expect(clampVolume(Number.POSITIVE_INFINITY)).toBe(1)
  })
})
