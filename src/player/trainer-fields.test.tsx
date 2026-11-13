import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { TrainerFields, type TrainerProps } from "./trainer-fields.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

const idle: TrainerProps = {
  loop: false,
  onLoop: () => {},
  loopCount: 2,
  onLoopCount: () => {},
  stepMode: "percent",
  onStepMode: () => {},
  stepValue: 5,
  onStepValue: () => {},
  tempo: 120,
  selection: null,
  onClearSelection: () => {},
}

function field(host: HTMLElement, part: string): HTMLInputElement | HTMLSelectElement {
  const el = host.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-part='${part}']`)
  if (!el) throw new Error(`no ${part} rendered`)
  return el
}

/** React reads a number field from input events, so set it the way a user's typing does. */
function type(input: HTMLInputElement, value: string) {
  const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")
  act(() => {
    nativeValue?.set?.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

function choose(select: HTMLSelectElement, value: string) {
  const nativeValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")
  act(() => {
    nativeValue?.set?.call(select, value)
    select.dispatchEvent(new Event("change", { bubbles: true }))
  })
}

test("the tempo line multiplies the score's tempo by the speed, to one decimal", () => {
  mounted = render(<TrainerFields {...idle} speed={0.75} />)
  expect(field(mounted.host, "tempo").textContent).toBe("Whole piece · 90 BPM (0.75×)")
})

test("with no tempo in the score, the line shows only the speed", () => {
  mounted = render(<TrainerFields {...idle} tempo={null} speed={1.5} selection="Bars 3–5" />)
  expect(field(mounted.host, "tempo").textContent).toBe("Bars 3–5 · 1.5×")
})

test("the loop count says loop for one and loops for more", () => {
  mounted = render(<TrainerFields {...idle} loopCount={1} speed={1} />)
  expect(mounted.host.querySelector("[data-part='loopCount']")?.parentElement?.textContent).toContain(
    "loop, speed up by",
  )
  mounted.rerender(<TrainerFields {...idle} loopCount={3} speed={1} />)
  expect(mounted.host.querySelector("[data-part='loopCount']")?.parentElement?.textContent).toContain(
    "loops, speed up by",
  )
})

test("each part gets the app's classes and test ids, and its part name", () => {
  mounted = render(
    <TrainerFields
      {...idle}
      speed={1}
      parts={{
        intro: { className: "intro" },
        tempo: { className: "tempo", "data-pwid": "score-trainer-tempo" },
        row: { className: "row" },
        loop: { "data-pwid": "score-loop" },
        loopCount: {
          className: "field w-16",
          "data-pwid": "score-trainer-loops",
        },
        step: { className: "field w-20", "data-pwid": "score-trainer-step" },
        stepMode: { className: "field", "data-pwid": "score-trainer-mode" },
      }}
    />,
  )
  expect(field(mounted.host, "intro").className).toBe("intro")
  expect(field(mounted.host, "tempo").getAttribute("data-pwid")).toBe("score-trainer-tempo")
  expect(mounted.host.querySelectorAll("[data-part='row']").length).toBe(3)
  expect(field(mounted.host, "loop").getAttribute("data-pwid")).toBe("score-loop")
  expect(field(mounted.host, "loopCount").className).toBe("field w-16")
  expect(field(mounted.host, "step").getAttribute("data-pwid")).toBe("score-trainer-step")
  expect(field(mounted.host, "stepMode").getAttribute("data-pwid")).toBe("score-trainer-mode")
})

test("ticking Loop calls onLoop with the new state", () => {
  const picked: Array<boolean> = []
  mounted = render(<TrainerFields {...idle} onLoop={(on) => picked.push(on)} speed={1} />)
  act(() => (field(mounted!.host, "loop") as HTMLInputElement).click())
  expect(picked).toEqual([true])
})

test("typing a loop count calls onLoopCount with a number", () => {
  const counts: Array<number> = []
  mounted = render(<TrainerFields {...idle} onLoopCount={(c) => counts.push(c)} speed={1} />)
  type(field(mounted.host, "loopCount") as HTMLInputElement, "4")
  expect(counts).toEqual([4])
})

test("typing a step calls onStepValue with a number", () => {
  const values: Array<number> = []
  mounted = render(<TrainerFields {...idle} onStepValue={(v) => values.push(v)} speed={1} />)
  type(field(mounted.host, "step") as HTMLInputElement, "2.5")
  expect(values).toEqual([2.5])
})

test("choosing BPM calls onStepMode with bpm, and the step input takes whole numbers", () => {
  const modes: Array<string> = []
  mounted = render(<TrainerFields {...idle} onStepMode={(m) => modes.push(m)} speed={1} />)
  expect((field(mounted.host, "step") as HTMLInputElement).step).toBe("0.5")
  choose(field(mounted.host, "stepMode") as HTMLSelectElement, "bpm")
  expect(modes).toEqual(["bpm"])
})

test("the step input steps by whole BPM once the unit is BPM", () => {
  mounted = render(<TrainerFields {...idle} stepMode="bpm" speed={1} />)
  expect((field(mounted.host, "step") as HTMLInputElement).step).toBe("1")
})
