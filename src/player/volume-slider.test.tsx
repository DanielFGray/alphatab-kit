import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { VolumeSlider } from "./volume-slider.tsx"

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
  act(() => {
    nativeValue?.set?.call(input, String(value))
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

test("spans the whole volume range in steps of 0.05", () => {
  mounted = render(<VolumeSlider volume={0.5} onVolume={() => {}} />)
  const el = range(mounted.host)
  expect([el.min, el.max, el.step, el.value]).toEqual(["0", "1", "0.05", "0.5"])
})

test("dragging calls onVolume with a number", () => {
  const levels: Array<number> = []
  mounted = render(<VolumeSlider volume={0.5} onVolume={(v) => levels.push(v)} />)
  drag(range(mounted.host), 0.25)
  expect(levels).toEqual([0.25])
})

test("disabled disables the slider", () => {
  mounted = render(<VolumeSlider volume={0.5} disabled onVolume={() => {}} />)
  expect(range(mounted.host).disabled).toBe(true)
})

test("each part gets the app's classes and test ids, and its part name", () => {
  mounted = render(
    <VolumeSlider
      volume={1}
      onVolume={() => {}}
      parts={{
        root: { className: "flex" },
        input: { className: "w-24", "data-pwid": "score-volume" },
      }}
    />,
  )
  expect(mounted.host.querySelector("[data-part='root']")?.className).toBe("flex")
  expect(range(mounted.host).className).toBe("w-24")
  expect(range(mounted.host).getAttribute("data-pwid")).toBe("score-volume")
  expect(range(mounted.host).getAttribute("data-part")).toBe("input")
})
