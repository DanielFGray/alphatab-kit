import { afterEach, expect, test } from "bun:test"
import { render } from "../../test/render.tsx"
import { CountInIcon, LoadingSpinner, MetronomeIcon, PauseIcon, PlayIcon, StopIcon, VolumeIcon } from "./icons.tsx"

let mounted: ReturnType<typeof render> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
})

const icons = { PlayIcon, PauseIcon, StopIcon, MetronomeIcon, CountInIcon, VolumeIcon, LoadingSpinner }

for (const [name, Icon] of Object.entries(icons)) {
  test(`${name} draws a 16 px svg in currentColor and takes the app's class`, () => {
    mounted = render(<Icon className="text-red-500" />)
    const svg = mounted.host.querySelector("svg")
    expect(svg?.getAttribute("width")).toBe("16")
    expect(svg?.getAttribute("height")).toBe("16")
    expect(svg?.getAttribute("class")).toBe("text-red-500")
    expect(svg?.getAttribute("aria-hidden")).toBe("true")
    expect(svg?.getAttribute("fill")).toBe(name === "LoadingSpinner" ? "none" : "currentColor")
    mounted.unmount()
    mounted = undefined
  })
}

test("an icon with no className renders no class attribute", () => {
  mounted = render(<PlayIcon />)
  expect(mounted.host.querySelector("svg")?.hasAttribute("class")).toBe(false)
})
