import { expect, test } from "bun:test"
import { listenForKeys, targetUsesKey } from "./keyboard.ts"

const make = (tag: string, attributes: Record<string, string> = {}) => {
  const element = document.createElement(tag)
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  return element
}

const KEYS = ["Space", "ArrowLeft", "Home"]

test("inputs, textareas and selects use every key", () => {
  for (const tag of ["input", "textarea", "select"]) {
    for (const code of KEYS) expect(targetUsesKey(make(tag), code)).toBe(true)
  }
})

test("contenteditable and the text-entry roles use every key", () => {
  expect(targetUsesKey(make("div", { contenteditable: "true" }), "ArrowRight")).toBe(true)
  for (const role of ["textbox", "combobox", "slider"]) {
    expect(targetUsesKey(make("div", { role }), "ArrowRight")).toBe(true)
  }
})

test("a child of an editable element uses its keys", () => {
  const wrapper = make("div", { contenteditable: "true" })
  const child = make("span")
  wrapper.append(child)
  expect(targetUsesKey(child, "Space")).toBe(true)
})

test("buttons, links and toggles use Space but leave the arrows to the score", () => {
  const label = make("span")
  const button = make("button")
  button.append(label)
  const pressables = [button, label, make("a", { href: "#" }), make("summary"), make("div", { role: "switch" })]
  for (const element of pressables) {
    expect(targetUsesKey(element, "Space")).toBe(true)
    expect(targetUsesKey(element, "ArrowLeft")).toBe(false)
  }
})

test("a plain element, a link without href, a non-element target and null use no key", () => {
  for (const code of KEYS) {
    expect(targetUsesKey(make("div"), code)).toBe(false)
    expect(targetUsesKey(make("a"), code)).toBe(false)
    expect(targetUsesKey(make("div", { contenteditable: "false" }), code)).toBe(false)
    expect(targetUsesKey(new EventTarget(), code)).toBe(false)
    expect(targetUsesKey(null, code)).toBe(false)
  }
})

test("keys from a control outside the host's parent reach the player only when the app names the root", () => {
  // The app's clipping box holds the score and sits beside its toolbar, so the toolbar is outside the host's parent.
  const root = make("div")
  const toolbar = make("button")
  const clip = make("div")
  const host = make("div")
  clip.append(host)
  root.append(toolbar, clip)
  document.body.append(root)
  const pressed: Array<string> = []
  const handle = (event: KeyboardEvent) => {
    pressed.push(event.code)
    return true
  }
  const stopOnParent = listenForKeys(clip, handle)
  toolbar.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft", bubbles: true }))
  expect(pressed).toEqual([])
  stopOnParent()
  const stopOnRoot = listenForKeys(root, handle)
  toolbar.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft", bubbles: true }))
  expect(pressed).toEqual(["ArrowLeft"])
  stopOnRoot()
  root.remove()
})
