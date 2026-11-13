import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { TrackSelect } from "./track-select.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

const tracks = [
  { index: 0, label: "Guitar" },
  { index: 1, label: "Bass" },
  { index: 2, label: "Drums" },
]

function select(host: HTMLElement) {
  const el = host.querySelector("select")
  if (!el) throw new Error("no track select rendered")
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

test("lists each track by its label, and shows the selected one", () => {
  mounted = render(<TrackSelect tracks={tracks} track={1} onTrack={() => {}} />)
  expect(Array.from(select(mounted.host).options).map((o) => o.textContent)).toEqual(["Guitar", "Bass", "Drums"])
  expect(select(mounted.host).value).toBe("1")
})

test("choosing a track calls onTrack with its index as a number", () => {
  const picked: Array<number> = []
  mounted = render(<TrackSelect tracks={tracks} track={0} onTrack={(i) => picked.push(i)} />)
  choose(select(mounted.host), "2")
  expect(picked).toEqual([2])
})

test("disabled disables the select", () => {
  mounted = render(<TrackSelect tracks={tracks} track={0} disabled onTrack={() => {}} />)
  expect(select(mounted.host).disabled).toBe(true)
})

test("each part gets the app's classes and test ids, and its part name", () => {
  mounted = render(
    <TrackSelect
      tracks={tracks}
      track={0}
      onTrack={() => {}}
      parts={{
        root: { className: "flex" },
        select: { className: "field max-w-48", "data-pwid": "score-track" },
      }}
    />,
  )
  expect(mounted.host.querySelector("[data-part='root']")?.className).toBe("flex")
  expect(select(mounted.host).className).toBe("field max-w-48")
  expect(select(mounted.host).getAttribute("data-pwid")).toBe("score-track")
  expect(select(mounted.host).getAttribute("data-part")).toBe("select")
})
