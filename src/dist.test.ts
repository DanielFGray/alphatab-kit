import { expect, test } from "bun:test"
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

// Apps install the kit from git without building it, so the committed dist/ must match src/.
test("dist/ is built from the current src/", async () => {
  const root = path.join(import.meta.dir, "..")
  const out = await mkdtemp(path.join(tmpdir(), "gigbag-dist-"))
  try {
    const build = Bun.spawnSync(["bunx", "tsc", "-p", "tsconfig.build.json", "--outDir", out], { cwd: root })
    expect(build.exitCode).toBe(0)
    const names = await files(out)
    expect(await files(path.join(root, "dist"))).toEqual(names)
    for (const name of names) {
      expect(await readFile(path.join(root, "dist", name), "utf8")).toBe(await readFile(path.join(out, name), "utf8"))
    }
  } finally {
    await rm(out, { recursive: true, force: true })
  }
}, 30_000)

/** Every file under dir, as sorted paths relative to it. */
async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
    .sort()
}
