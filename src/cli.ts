import { readFile, readdir, writeFile, mkdir, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ALPHATAB_PACKAGE } from "./index.ts"

/**
 * `alphatab-kit patch [--check]`, run from an app's folder.
 *
 * bun applies a dependency patch during install, before the kit itself is
 * installed, and a container build only sees files inside the app. So each app
 * keeps its own copy of the kit's alphaTab patch under `patches/`. This command
 * writes that copy, points `patchedDependencies` at it, and pins alphaTab to the
 * version the patch was made for. `--check` changes nothing and exits 1 when
 * the app's copy differs from the kit's, for a pre-commit hook or CI.
 */
export async function main(args: ReadonlyArray<string>): Promise<number> {
  const [command, ...flags] = args
  if (command !== "patch") {
    console.error("usage: alphatab-kit patch [--check]")
    return 2
  }
  const problems = await syncPatch(process.cwd(), { check: flags.includes("--check") })
  for (const problem of problems) console.error(`alphatab-kit: ${problem}`)
  return problems.length > 0 ? 1 : 0
}

/**
 * Brings the app at `appDir` in line with the kit's patch. In check mode it
 * returns what differs; otherwise it fixes it and returns nothing.
 */
export async function syncPatch(appDir: string, { check }: { check: boolean }): Promise<ReadonlyArray<string>> {
  const { version, source } = await kitPatch()
  const key = `${ALPHATAB_PACKAGE}@${version}`
  // bun's own naming for `bun patch --commit`: only the scope's slash is escaped.
  const relative = `patches/${ALPHATAB_PACKAGE.replace("/", "%2F")}@${version}.patch`
  const target = path.join(appDir, relative)
  const pkgPath = path.join(appDir, "package.json")
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as PackageJson
  const wanted = await readFile(source, "utf8")
  const current = await readFile(target, "utf8").catch(() => undefined)

  const stale = Object.keys(pkg.patchedDependencies ?? {}).filter((k) => k.startsWith(`${ALPHATAB_PACKAGE}@`) && k !== key)
  const field = pkg.dependencies?.[ALPHATAB_PACKAGE] !== undefined ? "dependencies" : "devDependencies"
  const problems = [
    ...(current === wanted ? [] : [`${relative} differs from the kit's patch`]),
    ...(pkg.patchedDependencies?.[key] === relative ? [] : [`patchedDependencies["${key}"] is not "${relative}"`]),
    ...stale.map((k) => `patchedDependencies has a stale entry "${k}"`),
    ...(pkg[field]?.[ALPHATAB_PACKAGE] === version ? [] : [`${field}["${ALPHATAB_PACKAGE}"] is not "${version}"`]),
  ]
  if (check || problems.length === 0) return problems

  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, wanted)
  const patched: Record<string, string> = { ...pkg.patchedDependencies }
  for (const k of stale) {
    if (patched[k]?.startsWith("patches/")) await rm(path.join(appDir, patched[k]!), { force: true })
    delete patched[k]
  }
  patched[key] = relative
  const next = { ...pkg, [field]: { ...pkg[field], [ALPHATAB_PACKAGE]: version }, patchedDependencies: patched }
  await writeFile(pkgPath, `${JSON.stringify(next, null, 2)}\n`)
  return []
}

/** The kit's one alphaTab patch, `patches/alphatab-<version>.patch` next to `dist/`. */
async function kitPatch(): Promise<{ version: string; source: string }> {
  const dir = fileURLToPath(new URL("../patches/", import.meta.url))
  const names = (await readdir(dir)).filter((n) => /^alphatab-.+\.patch$/.test(n))
  if (names.length !== 1) throw new Error(`alphatab-kit: expected one patch in ${dir}, found ${names.length}`)
  const name = names[0]!
  return { version: name.slice("alphatab-".length, -".patch".length), source: path.join(dir, name) }
}

interface PackageJson {
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
  readonly patchedDependencies?: Record<string, string>
  readonly [key: string]: unknown
}
