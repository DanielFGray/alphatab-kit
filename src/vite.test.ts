import { expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { alphaTabDistDir, collectAssets, rewriteWorkerUrls } from "./vite.ts"

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
  expect(out).toContain(`"/alphatab/abc/alphaTab.worker.mjs", import.meta.url`)
  expect(out).toContain(`"/alphatab/abc/alphaTab.worklet.mjs", import.meta.url`)
  expect(out).not.toContain(`"./alphaTab.worker.mjs"`)
})

test("rewriteWorkerUrls fails when alphaTab stops loading its worker by relative URL", () => {
  expect(() => rewriteWorkerUrls("export {}", "/x/")).toThrow(/alphaTab.worker.mjs/)
})
