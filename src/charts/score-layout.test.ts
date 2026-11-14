import { describe, expect, it } from "bun:test"
import { displayForWidth, stretchForWidth } from "./score-layout.ts"

describe("stretchForWidth", () => {
  it("packs bars tighter as the container narrows, and stretches a wide one fully", () => {
    expect([320, 390, 480, 600, 900].map(stretchForWidth)).toEqual([0.82, 0.88, 0.94, 0.97, 1])
  })

  it("changes at each breakpoint's upper edge", () => {
    expect([360, 361, 420, 421, 520, 521, 767, 768].map(stretchForWidth)).toEqual([
      0.82, 0.88, 0.88, 0.94, 0.94, 0.97, 0.97, 1,
    ])
  })
})

describe("displayForWidth", () => {
  it("sets the base scale for each width band at zoom 1", () => {
    expect([320, 390, 480, 600, 900].map((width) => displayForWidth(width, 1).scale)).toEqual([
      0.78, 0.84, 0.9, 0.96, 1,
    ])
  })

  it("changes the base scale at each breakpoint's upper edge", () => {
    expect([360, 361, 420, 421, 520, 521, 767, 768].map((width) => displayForWidth(width, 1).scale)).toEqual([
      0.78, 0.84, 0.84, 0.9, 0.9, 0.96, 0.96, 1,
    ])
  })

  it("multiplies the base scale by the zoom", () => {
    expect(displayForWidth(390, 1.5).scale).toBeCloseTo(0.84 * 1.5)
  })

  it("clamps the zoom to the 0.5 to 2.5 range", () => {
    expect(displayForWidth(900, 3).scale).toBe(2.5)
    expect(displayForWidth(900, 0.1).scale).toBe(0.5)
  })

  it("treats a zoom that is not a number as 1", () => {
    expect(displayForWidth(900, Number.NaN).scale).toBe(1)
  })

  it("reports the same stretch as stretchForWidth", () => {
    expect([320, 390, 480, 600, 900].map((width) => displayForWidth(width, 1).stretchForce)).toEqual([
      0.82, 0.88, 0.94, 0.97, 1,
    ])
  })
})
