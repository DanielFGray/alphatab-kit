import { expect, test } from "bun:test"
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { alphaTabAssets, alphaTabDistDir, collectAssets, rewriteWorkerUrls } from "./vite.ts"

const dist = alphaTabDistDir(import.meta.dir + "/..")

test("the dist folder holds the files the plugin emits next to the app", () => {
  for (const name of ["alphaTab.worker.mjs", "alphaTab.core.mjs", "alphaTab.worklet.mjs"]) {
    expect(existsSync(`${dist}/${name}`)).toBe(true)
  }
})

test("collectAssets lists the UMD script, the music font and the sound font", async () => {
  const assets = await collectAssets(dist)
  expect(assets.has("alphaTab.js")).toBe(true)
  expect(assets.has("font/Bravura.woff2")).toBe(true)
  expect(assets.has("soundfont/sonivox.sf2")).toBe(true)
})

test("rewriteWorkerUrls points the worker and the worklet at the hashed folder", async () => {
  const code = await Bun.file(`${dist}/alphaTab.mjs`).text()
  const out = rewriteWorkerUrls(code, "/alphatab/abc/")
  expect(out).toContain(`"/alphatab/abc/alphaTab.worker.mjs", "" + import.meta.url`)
  expect(out).toContain(`"/alphatab/abc/alphaTab.worklet.mjs", "" + import.meta.url`)
  expect(out).not.toContain(`"./alphaTab.worker.mjs"`)
})

test("rewriteWorkerUrls fails when alphaTab stops loading its worker by relative URL", () => {
  expect(() => rewriteWorkerUrls("export {}", "/x/")).toThrow(/alphaTab.worker.mjs/)
})

test("a client build emits the worker in the hashed folder and starts it from there", async () => {
  const { build } = await import("vite")
  const root = mkdtempSync(path.join(import.meta.dir, "..", ".vite-build-"))
  try {
    writeFileSync(path.join(root, "index.html"), `<script type="module" src="./main.js"></script>`)
    writeFileSync(path.join(root, "main.js"), `import { AlphaTabApi } from "@coderline/alphatab"\nconsole.log(AlphaTabApi)\n`)
    await build({ root, logLevel: "silent", configFile: false, plugins: [alphaTabAssets()] })
    const out = path.join(root, "dist")
    const [hashed] = readdirSync(path.join(out, "alphatab")).filter((name) => /^[0-9a-f]{10}$/.test(name))
    expect(existsSync(path.join(out, "alphatab", hashed!, "alphaTab.worker.mjs"))).toBe(true)
    const chunks = readdirSync(path.join(out, "assets")).filter((name) => name.endsWith(".js"))
    const code = chunks.map((name) => readFileSync(path.join(out, "assets", name), "utf8")).join("\n")
    expect(code).toContain(`/alphatab/${hashed}/alphaTab.worker.mjs`)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 120_000)
