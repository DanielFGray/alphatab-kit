import { afterEach, describe, expect, test } from "bun:test"
import { observeTheme } from "./ink.ts"

// `inkFrom` is not tested: happy-dom's canvas has no 2d context, so it cannot return the pixel `rgbOf` reads,
// and every color would come out black. The e2e theme test in setlist covers the colors in a real browser.

/** MutationObserver callbacks run as a microtask, so wait for one turn. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

describe("observeTheme", () => {
  const root = document.createElement("div")
  let stop = () => {}
  afterEach(() => stop())

  test.each([
    ["class", () => root.classList.add("dark")],
    ["data-theme", () => root.setAttribute("data-theme", "dark")],
    ["style", () => root.style.setProperty("color", "red")],
  ])("calls back when the %s changes", async (_name, change) => {
    let calls = 0
    stop = observeTheme(() => calls++, root)
    change()
    await settle()
    expect(calls).toBe(1)
  })

  test("ignores other attributes", async () => {
    let calls = 0
    stop = observeTheme(() => calls++, root)
    root.setAttribute("lang", "pt")
    await settle()
    expect(calls).toBe(0)
  })

  test("stops calling back after the returned function runs", async () => {
    let calls = 0
    stop = observeTheme(() => calls++, root)
    stop()
    root.classList.add("light")
    await settle()
    expect(calls).toBe(0)
  })
})
