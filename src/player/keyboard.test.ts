import { expect, test } from "bun:test"
import { targetUsesKey } from "./keyboard.ts"

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
