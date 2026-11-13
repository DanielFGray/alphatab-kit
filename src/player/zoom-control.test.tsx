import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { ZoomControl } from "./zoom-control.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

function button(host: HTMLElement, label: string) {
  const el = host.querySelector(`button[aria-label='${label}']`)
  if (!el) throw new Error(`no button labelled ${label}`)
  return el as HTMLButtonElement
}

test("the reset button shows the zoom as a percentage", () => {
  mounted = render(<ZoomControl zoom={1.25} onZoom={() => {}} />)
  expect(button(mounted.host, "Reset zoom to 100%").textContent).toBe("125%")
})

test("each part gets the app's classes and test ids, and its part name", () => {
  mounted = render(
    <ZoomControl
      zoom={1}
      onZoom={() => {}}
      parts={{
        root: { className: "flex" },
        zoomOut: { className: "step", "data-pwid": "score-zoom-out" },
        reset: { className: "reset", "data-pwid": "score-zoom" },
        zoomIn: { className: "step", "data-pwid": "score-zoom-in" },
      }}
    />,
  )
  expect(mounted.host.querySelector("[data-part='root']")?.className).toBe("flex")
  const out = button(mounted.host, "Zoom out")
  const reset = button(mounted.host, "Reset zoom to 100%")
  const inButton = button(mounted.host, "Zoom in")
  expect(out.className).toBe("step")
  expect(out.getAttribute("data-pwid")).toBe("score-zoom-out")
  expect(out.getAttribute("data-part")).toBe("zoomOut")
  expect(reset.getAttribute("data-pwid")).toBe("score-zoom")
  expect(reset.getAttribute("data-part")).toBe("reset")
  expect(inButton.getAttribute("data-pwid")).toBe("score-zoom-in")
  expect(inButton.getAttribute("data-part")).toBe("zoomIn")
})

test("the out and in buttons step the zoom from the current value", () => {
  const zooms: Array<number> = []
  mounted = render(<ZoomControl zoom={1} onZoom={(z) => zooms.push(z)} />)
  act(() => button(mounted!.host, "Zoom in").click())
  act(() => button(mounted!.host, "Zoom out").click())
  expect(zooms.length).toBe(2)
  expect(zooms[0]).toBeGreaterThan(1)
  expect(zooms[1]).toBeLessThan(1)
})

test("the reset button sets the zoom to 100%", () => {
  const zooms: Array<number> = []
  mounted = render(<ZoomControl zoom={2} onZoom={(z) => zooms.push(z)} />)
  act(() => button(mounted!.host, "Reset zoom to 100%").click())
  expect(zooms).toEqual([1])
})

test("zoom out is disabled at the smallest zoom and zoom in at the largest", () => {
  mounted = render(<ZoomControl zoom={0.5} onZoom={() => {}} />)
  expect(button(mounted.host, "Zoom out").disabled).toBe(true)
  expect(button(mounted.host, "Zoom in").disabled).toBe(false)
  mounted.rerender(<ZoomControl zoom={2.5} onZoom={() => {}} />)
  expect(button(mounted.host, "Zoom out").disabled).toBe(false)
  expect(button(mounted.host, "Zoom in").disabled).toBe(true)
})
