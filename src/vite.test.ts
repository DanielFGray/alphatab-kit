import { expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { alphaTabDistDir, collectAssets } from "./vite.ts"

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
