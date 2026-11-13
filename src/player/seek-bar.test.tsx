import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { SeekBar } from "./seek-bar.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

function range(host: HTMLElement) {
  const el = host.querySelector("input")
  if (!el) throw new Error("no range input rendered")
  return el
}

/** React reads a range's value from input events, so set it the way a user's drag does. */
function drag(input: HTMLInputElement, value: number) {
  const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")
  if (!nativeValue?.set) throw new Error("no value setter on HTMLInputElement")
  act(() => {
    nativeValue.set?.call(input, String(value))
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

test("shows the elapsed time and the total length", () => {
  mounted = render(<SeekBar positionMs={187_400} endMs={300_000} onSeek={() => {}} />)
  expect(mounted.host.querySelector("[data-part='time']")?.textContent).toBe("3:07 / 5:00")
})

test("each part gets the app's classes and test ids, and its part name", () => {
  mounted = render(
    <SeekBar
      positionMs={0}
      endMs={60_000}
      onSeek={() => {}}
      parts={{
        root: { className: "flex" },
        time: { className: "font-mono", "data-pwid": "score-time" },
        range: { className: "flex-1", "data-pwid": "score-progress" },
      }}
    />,
  )
  const root = mounted.host.querySelector("[data-part='root']")
  const time = mounted.host.querySelector("[data-part='time']")
  const input = range(mounted.host)
  expect(root?.className).toBe("flex")
  expect(time?.className).toBe("font-mono")
  expect(time?.getAttribute("data-pwid")).toBe("score-time")
  expect(input.className).toBe("flex-1")
  expect(input.getAttribute("data-pwid")).toBe("score-progress")
  expect(input.getAttribute("data-part")).toBe("range")
})

test("the range spans 0 to the length and sits at the position", () => {
  mounted = render(<SeekBar positionMs={12_000} endMs={60_000} onSeek={() => {}} />)
  const input = range(mounted.host)
  expect(input.getAttribute("min")).toBe("0")
  expect(input.getAttribute("max")).toBe("60000")
  expect(input.value).toBe("12000")
  expect(input.getAttribute("aria-label")).toBe("Seek")
})

test("dragging the range calls onSeek with the new position in milliseconds", () => {
  const seeks: Array<number> = []
  mounted = render(<SeekBar positionMs={0} endMs={60_000} onSeek={(ms) => seeks.push(ms)} />)
  drag(range(mounted.host), 30_000)
  expect(seeks).toEqual([30_000])
})

test("with no length the range is disabled, so nothing can seek it", () => {
  mounted = render(<SeekBar positionMs={0} endMs={0} onSeek={() => {}} />)
  expect(range(mounted.host).disabled).toBe(true)
})

test("disabled disables the range even when the score has a length", () => {
  mounted = render(<SeekBar positionMs={0} endMs={60_000} disabled onSeek={() => {}} />)
  expect(range(mounted.host).disabled).toBe(true)
})
