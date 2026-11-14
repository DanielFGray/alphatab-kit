import { expect, test } from "bun:test"
import { countInBeats } from "./click.ts"

test("the count-in is whole bars, two or more, and never under four beats", () => {
  expect([1, 2, 3, 4, 5, 6, 7].map(countInBeats)).toEqual([4, 4, 6, 8, 10, 12, 14])
})
