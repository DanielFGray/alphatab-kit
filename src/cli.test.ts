import { expect, test } from "bun:test"
import { mkdtemp, readFile, readdir, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { syncPatch } from "./cli.ts"

const kitPatches = path.join(import.meta.dir, "..", "patches")

async function app(pkg: object, files: Record<string, string> = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "gigbag-"))
  await writeFile(path.join(dir, "package.json"), JSON.stringify(pkg))
  for (const [name, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true })
    await writeFile(path.join(dir, name), text)
  }
  return dir
}

test("syncPatch copies the kit's patch, pins alphaTab and drops the old patch", async () => {
  const [kitFile] = await readdir(kitPatches)
  const version = kitFile!.slice("alphatab-".length, -".patch".length)
  const old = "patches/@coderline%2Falphatab@0.0.1.patch"
  const dir = await app(
    {
      dependencies: { "@coderline/alphatab": "0.0.1" },
      patchedDependencies: { "@coderline/alphatab@0.0.1": old, "other@1": "patches/other.patch" },
    },
    { [old]: "old" },
  )

  expect((await syncPatch(dir, { check: true })).length).toBeGreaterThan(0)
  expect(await syncPatch(dir, { check: false })).toEqual([])
  expect(await syncPatch(dir, { check: true })).toEqual([])

  const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"))
  expect(pkg.dependencies["@coderline/alphatab"]).toBe(version)
  expect(pkg.patchedDependencies).toEqual({
    "other@1": "patches/other.patch",
    [`@coderline/alphatab@${version}`]: `patches/@coderline%2Falphatab@${version}.patch`,
  })
  expect(await readdir(path.join(dir, "patches"))).toEqual([`@coderline%2Falphatab@${version}.patch`])
  expect(await readFile(path.join(dir, "patches", `@coderline%2Falphatab@${version}.patch`), "utf8")).toBe(
    await readFile(path.join(kitPatches, kitFile!), "utf8"),
  )
})
