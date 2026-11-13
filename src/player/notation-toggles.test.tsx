import { afterEach, expect, test } from "bun:test"
import { act } from "react"
import { render } from "../../test/render.tsx"
import { NotationToggles } from "./notation-toggles.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

function toggle(host: HTMLElement, label: string) {
  const el = Array.from(host.querySelectorAll("button")).find((b) => b.textContent === label)
  if (!el) throw new Error(`no toggle labelled ${label}`)
  return el
}

test("each toggle reports its state in aria-pressed", () => {
  mounted = render(<NotationToggles notation={{ standard: true, tab: false }} onNotation={() => {}} />)
  expect(toggle(mounted.host, "Standard").getAttribute("aria-pressed")).toBe("true")
  expect(toggle(mounted.host, "Tab").getAttribute("aria-pressed")).toBe("false")
})

test("each part gets the app's classes and test ids, and its part name", () => {
  mounted = render(
    <NotationToggles
      notation={{ standard: true, tab: true }}
      onNotation={() => {}}
      parts={{
        root: { className: "flex" },
        standard: { className: "pill", "data-pwid": "score-notation-standard" },
        tab: { className: "pill", "data-pwid": "score-notation-tab" },
      }}
    />,
  )
  expect(mounted.host.querySelector("[data-part='root']")?.className).toBe("flex")
  const standard = toggle(mounted.host, "Standard")
  const tab = toggle(mounted.host, "Tab")
  expect(standard.className).toBe("pill")
  expect(standard.getAttribute("data-pwid")).toBe("score-notation-standard")
  expect(standard.getAttribute("data-part")).toBe("standard")
  expect(tab.getAttribute("data-pwid")).toBe("score-notation-tab")
  expect(tab.getAttribute("data-part")).toBe("tab")
})

test("a click calls onNotation with the staff that was clicked", () => {
  const picked: Array<string> = []
  mounted = render(<NotationToggles notation={{ standard: true, tab: true }} onNotation={(w) => picked.push(w)} />)
  act(() => toggle(mounted!.host, "Tab").click())
  act(() => toggle(mounted!.host, "Standard").click())
  expect(picked).toEqual(["tab", "standard"])
})
