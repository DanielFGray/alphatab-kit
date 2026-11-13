import { describe, expect, test } from "bun:test"
import { scoreMeta } from "./score-meta.ts"

describe("scoreMeta", () => {
  test("tidies the text and rounds the tempo", () => {
    expect(scoreMeta({ title: "  Fixture Title ", artist: "The  Band", tempo: 119.6 })).toEqual({ title: "Fixture Title", artist: "The Band", tempo: 120 })
  })

  test("a blank field or an impossible tempo is null", () => {
    expect(scoreMeta({ title: "  ", artist: "", tempo: 0 })).toEqual({ title: null, artist: null, tempo: null })
  })
})
