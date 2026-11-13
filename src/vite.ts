import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import type { Plugin } from "vite"
import { ALPHATAB_BASE, ALPHATAB_PACKAGE } from "./index.ts"

/**
 * Serves the files alphaTab fetches by URL at run time under `/alphatab/`, and
 * keeps Vite from pre-bundling alphaTab.
 *
 * alphaTab reads its music font and sound font from URLs, and starts its render
 * worker and audio worklet from files next to its own module, so these must be
 * real same-origin files; the bundler cannot inline them. In development a
 * middleware serves them straight from the package. In a client build they are
 * emitted into the output folder. Both come from the package the app
 * installed, so they always match the version the app imports.
 *
 * In a build, the worker, the worklet and the core module they import go to
 * `/alphatab/<content hash>/`, and alphaTab's module is rewritten to start them
 * from there. Their names are fixed by alphaTab, so without the hash folder a
 * browser that cached an older copy would run an old worker beside a new main
 * thread after an alphaTab or patch upgrade.
 *
 * `/alphatab/alphaTab.js` is the UMD build: alphaTab falls back to it through
 * `core.scriptFile` when it cannot start a module worker, and loads it with
 * `importScripts`, which cannot load an ES module.
 */
export function alphaTabAssets(): Plugin {
  let isBuild = false
  let base = "/"
  let dist: string | undefined
  let assets: Promise<Map<string, string>> | undefined
  let workerDir: Promise<string> | undefined
  const list = () => (assets ??= collectAssets(dist!))
  const hashedDir = () => (workerDir ??= workerFilesHash(dist!).then((hash) => `alphatab/${hash}`))

  return {
    name: "gigbag:assets",
    // The kit's player must share the app's React and alphaTab. When an app links the kit (`bun link`), the
    // kit's own devDependency copies would load as well: the player's hooks would run against a React that never
    // rendered, and the score would never draw, because the render worker built from the app's alphaTab does not
    // answer the kit's copy.
    config: () => ({
      optimizeDeps: { exclude: [ALPHATAB_PACKAGE] },
      resolve: { dedupe: ["react", "react-dom", ALPHATAB_PACKAGE] },
    }),
    configResolved(config) {
      isBuild = config.command === "build"
      base = config.base
      dist = alphaTabDistDir(config.root)
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = (req.url ?? "").split("?", 1)[0] ?? ""
          if (!url.startsWith(ALPHATAB_BASE)) return next()
          const source = (await list()).get(decodeURIComponent(url.slice(ALPHATAB_BASE.length)))
          if (!source) return next()
          res.setHeader("Content-Type", CONTENT_TYPES[path.extname(source)] ?? "application/octet-stream")
          res.end(await readFile(source))
        } catch (error) {
          next(error)
        }
      })
    },
    async transform(code, id) {
      if (!isBuild || path.normalize(id.split("?", 1)[0]!) !== path.join(dist!, ENTRY_MODULE)) return
      const dir = `${base}${await hashedDir()}/`
      return { code: rewriteWorkerUrls(code, dir), map: null }
    },
    async generateBundle() {
      // The server build never starts workers or draws notation.
      if (this.environment?.config.consumer === "server") return
      for (const [name, source] of await list()) {
        this.emitFile({ type: "asset", fileName: `alphatab/${name}`, source: await readFile(source) })
      }
      const dir = await hashedDir()
      for (const name of WORKER_FILES) {
        this.emitFile({ type: "asset", fileName: `${dir}/${name}`, source: await readFile(path.join(dist!, name)) })
      }
    },
  }
}

/**
 * Points alphaTab's worker and worklet URLs at `dir`. alphaTab builds them as
 * `alphaTabUrl("./alphaTab.worker.mjs", import.meta.url)`; an absolute path in
 * place of the relative one makes them independent of where the bundle puts
 * alphaTab's module. Throws when a URL is missing, so an alphaTab release that
 * changes how it starts workers fails the build instead of the player.
 */
export function rewriteWorkerUrls(code: string, dir: string): string {
  let out = code
  for (const name of ["alphaTab.worker.mjs", "alphaTab.worklet.mjs"]) {
    const relative = `"./${name}", import.meta.url`
    if (!out.includes(relative)) throw new Error(`gigbag: ${ENTRY_MODULE} no longer loads ${relative}`)
    out = out.replaceAll(relative, `"${dir}${name}", import.meta.url`)
  }
  return out
}

/**
 * Published name (relative to `/alphatab/`) to file on disk, for every file the
 * app serves from the alphaTab `dist` folder.
 */
export async function collectAssets(dist: string): Promise<Map<string, string>> {
  const files = new Map<string, string>()
  for (const script of SCRIPTS) files.set(script, path.join(dist, script))
  for (const directory of DIRECTORIES) {
    for (const entry of await readdir(path.join(dist, directory), { withFileTypes: true })) {
      if (entry.isFile()) files.set(`${directory}/${entry.name}`, path.join(dist, directory, entry.name))
    }
  }
  return files
}

/**
 * The folder of the alphaTab the app installed. Resolved from the app root, not
 * from this package, which may be symlinked next to another alphaTab version.
 * The package's CommonJS entry is dist/alphaTab.js, so its folder is `dist`.
 */
export function alphaTabDistDir(root: string): string {
  return path.dirname(createRequire(path.join(root, "package.json")).resolve(ALPHATAB_PACKAGE))
}

/** A short hash of the worker files, so a patched or upgraded alphaTab gets a new folder. */
async function workerFilesHash(dist: string): Promise<string> {
  const hash = createHash("sha256")
  for (const name of WORKER_FILES) hash.update(await readFile(path.join(dist, name)))
  return hash.digest("hex").slice(0, 10)
}

/** The ES module the `import` condition of alphaTab's package resolves to. */
const ENTRY_MODULE = "alphaTab.mjs"

/** The worker, the worklet, and the core module both import as `./alphaTab.core.mjs`. */
const WORKER_FILES = ["alphaTab.worker.mjs", "alphaTab.worklet.mjs", "alphaTab.core.mjs"]

const SCRIPTS = ["alphaTab.js"]
const DIRECTORIES = ["font", "soundfont"]

const CONTENT_TYPES: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".otf": "font/otf",
  ".sf2": "application/octet-stream",
  ".sf3": "application/octet-stream",
}
