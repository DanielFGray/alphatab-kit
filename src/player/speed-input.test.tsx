import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { SpeedInput } from "./speed-input.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

function field(host: HTMLElement) {
  const el = host.querySelector("input")
  if (!el) throw new Error("no speed input rendered")
  return el
}

function type(input: HTMLInputElement, text: string) {
  act(() => {
    input.focus()
    input.value = text
  })
}

function blur(input: HTMLInputElement) {
  act(() => input.blur())
}

function press(input: HTMLInputElement, key: string) {
  act(() => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
  })
}

test("shows the speed to two decimals at most, without trailing zeros", () => {
  mounted = render(<SpeedInput speed={0.75} onSpeed={() => {}} />)
  expect(field(mounted.host).value).toBe("0.75")
  mounted.rerender(<SpeedInput speed={1} onSpeed={() => {}} />)
  expect(field(mounted.host).value).toBe("1")
})

test("each part gets the app's classes and test ids, and its part name", () => {
  mounted = render(
    <SpeedInput speed={1} onSpeed={() => {}} parts={{ root: { className: "flex" }, input: { className: "field", "data-pwid": "score-speed" } }} />,
  )
  expect(mounted.host.querySelector("[data-part='root']")?.className).toBe("flex")
  const el = field(mounted.host)
  expect(el.className).toBe("field")
  expect(el.getAttribute("data-pwid")).toBe("score-speed")
  expect(el.getAttribute("data-part")).toBe("input")
})

test("typed text is not sent until the field loses focus", () => {
  const sent: Array<number> = []
  mounted = render(<SpeedInput speed={1} onSpeed={(s) => sent.push(s)} />)
  type(field(mounted.host), "0.8")
  expect(sent).toEqual([])
  blur(field(mounted.host))
  expect(sent).toEqual([0.8])
})

test("Enter ends the edit and sends the typed speed", () => {
  const sent: Array<number> = []
  mounted = render(<SpeedInput speed={1} onSpeed={(s) => sent.push(s)} />)
  type(field(mounted.host), "1.5")
  press(field(mounted.host), "Enter")
  expect(sent).toEqual([1.5])
})

test("Escape puts the shown speed back and sends nothing", () => {
  const sent: Array<number> = []
  mounted = render(<SpeedInput speed={1} onSpeed={(s) => sent.push(s)} />)
  type(field(mounted.host), "2.2")
  press(field(mounted.host), "Escape")
  expect(field(mounted.host).value).toBe("1")
  blur(field(mounted.host))
  expect(sent).toEqual([1])
})

test("leaving the field with text that is not a number restores the shown speed", () => {
  const sent: Array<number> = []
  mounted = render(<SpeedInput speed={1.25} onSpeed={(s) => sent.push(s)} />)
  type(field(mounted.host), "")
  blur(field(mounted.host))
  expect(sent).toEqual([])
  expect(field(mounted.host).value).toBe("1.25")
})
