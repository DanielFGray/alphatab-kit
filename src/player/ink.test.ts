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

  test("calls back when the OS color scheme changes", () => {
    const lists = captureMediaQueries()
    let calls = 0
    stop = observeTheme(() => calls++, root)
    schemeQuery(lists).dispatchEvent(new Event("change"))
    expect(calls).toBe(1)
  })

  test("stops following the OS color scheme after the returned function runs", () => {
    const lists = captureMediaQueries()
    let calls = 0
    stop = observeTheme(() => calls++, root)
    stop()
    schemeQuery(lists).dispatchEvent(new Event("change"))
    expect(calls).toBe(0)
  })
})

let restoreMatchMedia = () => {}
afterEach(() => restoreMatchMedia())

/** Records each media query the code under test subscribes to, so a test can fire the OS scheme change. */
function captureMediaQueries(): Array<MediaQueryList> {
  const original = window.matchMedia
  const lists: Array<MediaQueryList> = []
  window.matchMedia = (query: string) => {
    const list = original.call(window, query)
    lists.push(list)
    return list
  }
  restoreMatchMedia = () => {
    window.matchMedia = original
  }
  return lists
}

function schemeQuery(lists: Array<MediaQueryList>): MediaQueryList {
  const list = lists.find((l) => l.media === "(prefers-color-scheme: dark)")
  if (!list) throw new Error("observeTheme did not subscribe to the dark scheme query")
  return list
}
