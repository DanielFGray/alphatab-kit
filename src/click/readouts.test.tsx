import { afterEach, expect, test } from "bun:test"
import { render } from "../../test/render.tsx"
import { MicMeter, OffsetChart, TakeSummary } from "./readouts.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

const hits = [-12, 0, 25].map((offsetMs, beat) => ({ offsetMs, beat, step: 0 }))

test("the chart draws each note in order, late above early, and marks the last", () => {
  mounted = render(<OffsetChart hits={hits} parts={{ mark: { className: "dot" } }} />)
  const marks = [...mounted.host.querySelectorAll("circle")]
  expect(marks.map((m) => m.dataset.offsetMs)).toEqual(["-12.00", "0.00", "25.00"])
  expect(marks.map((m) => m.getAttribute("class"))).toEqual(["dot", "dot", "dot"])
  const [early, onBeat, late] = marks.map((m) => Number(m.getAttribute("cy")))
  expect(late!).toBeLessThan(onBeat!)
  expect(onBeat!).toBeLessThan(early!)
  expect(marks.map((m) => m.hasAttribute("data-last"))).toEqual([false, false, true])
  expect(mounted.host.querySelector("svg")?.getAttribute("aria-label")).toBe(
    "3 notes in order; up is late, down is early",
  )
})

test("the summary names each number", () => {
  mounted = render(<TakeSummary hits={hits} />)
  const labels = [...mounted.host.querySelectorAll("dt")].map((dt) => dt.textContent)
  expect(labels).toEqual(["Notes", "Average", "Spread", "Within ±10 ms"])
  expect(mounted.host.querySelector("dd")?.textContent).toBe("3")
})

test("the mic meter reports its fill as a meter value", () => {
  mounted = render(<MicMeter peak={1} />)
  const meter = mounted.host.querySelector("[role='meter']")
  expect(meter?.getAttribute("aria-valuenow")).toBe("100")
  expect(mounted.host.querySelector<HTMLElement>("[data-part='fill']")?.style.width).toBe("100%")
})
