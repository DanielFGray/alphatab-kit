import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { BeatsPerBarSelect, BpmInput, ClickButton, MicPicker, SubdivisionSelect } from "./controls.tsx"
import type { Subdivision } from "./timing.ts"
import { micsFrom } from "./use-click-track.ts"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

function one<E extends Element>(host: HTMLElement, selector: string): E {
  const el = host.querySelector<E>(selector)
  if (!el) throw new Error(`no ${selector} rendered`)
  return el
}

/** React reads a select's value from change events, so set it the way a user's pick does. */
function choose(el: HTMLSelectElement, value: string) {
  const nativeValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")
  act(() => {
    nativeValue?.set?.call(el, value)
    el.dispatchEvent(new Event("change", { bubbles: true }))
  })
}

test("the click button counts the bar while it is pressed", () => {
  const props = { label: "Listen", beatsPerBar: 3, onToggle: () => {} }
  mounted = render(<ClickButton {...props} pressed={false} beat={null} />)
  const button = one<HTMLButtonElement>(mounted.host, "button")
  expect(button.textContent).toBe("Listen")
  expect(button.getAttribute("aria-pressed")).toBe("false")
  mounted.rerender(<ClickButton {...props} pressed beat={4} />)
  expect(button.textContent).toBe("Listen · 2")
  expect(button.dataset.beat).toBe("4")
})

test("a typed tempo is sent on Enter, whole and within range", () => {
  const sent: Array<number> = []
  mounted = render(<BpmInput bpm={100} onBpm={(bpm) => sent.push(bpm)} />)
  const input = one<HTMLInputElement>(mounted.host, "input")
  for (const typed of ["96.6", "1000", "abc"]) {
    act(() => {
      input.focus()
      input.value = typed
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    })
  }
  expect(sent).toEqual([97, 300])
})

test("the bar and grid pickers send what is chosen", () => {
  const bars: Array<number> = []
  const grids: Array<Subdivision> = []
  mounted = render(
    <>
      <BeatsPerBarSelect beatsPerBar={4} onBeatsPerBar={(n) => bars.push(n)} />
      <SubdivisionSelect subdivision={1} onSubdivision={(n) => grids.push(n)} />
    </>,
  )
  const [bar, grid] = [...mounted.host.querySelectorAll("select")]
  choose(bar!, "3")
  choose(grid!, "3")
  expect(bars).toEqual([3])
  expect(grids).toEqual([3])
  expect(grid!.selectedOptions[0]?.textContent).toBe("1 note per click")
})

test("the mic picker offers the default and each input, and keeps a chosen mic the browser does not list", () => {
  const chosen: Array<string | null> = []
  const mics = [{ id: "usb", label: "USB mic" }]
  mounted = render(<MicPicker mics={mics} micId={null} onMic={(id) => chosen.push(id)} />)
  const select = one<HTMLSelectElement>(mounted.host, "select")
  expect([...select.options].map((o) => o.textContent)).toEqual(["The browser's default", "USB mic"])
  choose(select, "usb")
  choose(select, "")
  expect(chosen).toEqual(["usb", null])

  mounted.rerender(<MicPicker mics={mics} micId="unplugged" onMic={() => {}} />)
  expect(select.value).toBe("unplugged")
  expect(select.selectedOptions[0]?.textContent).toBe("Chosen microphone")
})

test("the mic list holds audio inputs that can be asked for, named or numbered", () => {
  const device = (kind: MediaDeviceKind, deviceId: string, label: string) =>
    ({ kind, deviceId, label, groupId: "", toJSON: () => ({}) }) as MediaDeviceInfo
  expect(
    micsFrom([
      device("audioinput", "a", "Built-in"),
      device("audiooutput", "b", "Speakers"),
      device("audioinput", "c", ""),
      device("audioinput", "", ""),
    ]),
  ).toEqual([
    { id: "a", label: "Built-in" },
    { id: "c", label: "Microphone 2" },
  ])
})
