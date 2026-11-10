import { expect, test } from "bun:test"
import { mkdtemp, readdir, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

// Apps install the kit from git without building it, so the committed dist/ must match src/.
test("dist/ is built from the current src/", async () => {
  const root = path.join(import.meta.dir, "..")
  const out = await mkdtemp(path.join(tmpdir(), "alphatab-kit-dist-"))
  const build = Bun.spawnSync(["bunx", "tsc", "-p", "tsconfig.build.json", "--outDir", out], { cwd: root })
  expect(build.exitCode).toBe(0)
  const names = (await readdir(out)).sort()
  expect((await readdir(path.join(root, "dist"))).sort()).toEqual(names)
  for (const name of names) {
    expect(await readFile(path.join(root, "dist", name), "utf8")).toBe(await readFile(path.join(out, name), "utf8"))
  }
}, 30_000)
