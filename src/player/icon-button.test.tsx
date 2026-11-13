import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { IconButton } from "./icon-button.tsx"
import { PlayIcon } from "./icons.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

function button(host: HTMLElement) {
  const el = host.querySelector("button")
  if (!el) throw new Error("no button rendered")
  return el
}

test("the app's classes and test id reach the button, which also names its part", () => {
  mounted = render(
    <IconButton label="Play" onClick={() => {}} parts={{ button: { className: "rounded-full p-2", "data-pwid": "score-play" } }}>
      <PlayIcon />
    </IconButton>,
  )
  const el = button(mounted.host)
  expect(el.className).toBe("rounded-full p-2")
  expect(el.getAttribute("data-pwid")).toBe("score-play")
  expect(el.getAttribute("data-part")).toBe("button")
  expect(el.getAttribute("aria-label")).toBe("Play")
  expect(el.getAttribute("title")).toBe("Play")
})

test("data-pressed is false when no pressed state is given, and aria-pressed is absent", () => {
  mounted = render(<IconButton label="Play" onClick={() => {}}>{null}</IconButton>)
  expect(button(mounted.host).getAttribute("data-pressed")).toBe("false")
  expect(button(mounted.host).hasAttribute("aria-pressed")).toBe(false)
})

test("a toggle reports its state in data-pressed and aria-pressed", () => {
  mounted = render(<IconButton label="Metronome click" pressed onClick={() => {}}>{null}</IconButton>)
  expect(button(mounted.host).getAttribute("data-pressed")).toBe("true")
  expect(button(mounted.host).getAttribute("aria-pressed")).toBe("true")
  mounted.rerender(<IconButton label="Metronome click" pressed={false} onClick={() => {}}>{null}</IconButton>)
  expect(button(mounted.host).getAttribute("data-pressed")).toBe("false")
  expect(button(mounted.host).getAttribute("aria-pressed")).toBe("false")
})

test("a click calls onClick", () => {
  let clicks = 0
  mounted = render(<IconButton label="Stop" onClick={() => clicks++}>{null}</IconButton>)
  act(() => button(mounted!.host).click())
  expect(clicks).toBe(1)
})

test("a disabled button does not call onClick", () => {
  let clicks = 0
  mounted = render(<IconButton label="Play" disabled onClick={() => clicks++}>{null}</IconButton>)
  expect(button(mounted.host).disabled).toBe(true)
  act(() => button(mounted!.host).click())
  expect(clicks).toBe(0)
})
