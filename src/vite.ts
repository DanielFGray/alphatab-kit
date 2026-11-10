import { createRequire } from "node:module"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import type { Plugin } from "vite"
import { ALPHATAB_BASE, ALPHATAB_PACKAGE } from "./index.ts"

/**
 * Serves the files alphaTab fetches by URL at run time under `/alphatab/`, and
 * keeps Vite from pre-bundling alphaTab.
 *
 * alphaTab starts its render worker and audio worklet from `core.scriptFile`
 * and reads the music font and the sound font from URLs, so these files must
 * be real same-origin files; the bundler cannot inline them. In development a
 * middleware serves them straight from the package; in a build they are
 * emitted into the output folder next to the app. Both come from the package
 * the app installed, so they always match the version the app imports.
 *
 * `/alphatab/alphaTab.js` is the UMD build on purpose: the worker loads it
 * with `importScripts`, which cannot load an ES module.
 */
export function alphaTabAssets(): Plugin {
  let assetsDir = "assets"
  let dist: string | undefined
  let assets: Promise<Map<string, string>> | undefined
  const list = () => (assets ??= collectAssets(dist!))

  return {
    name: "alphatab-kit:assets",
    config: () => ({ optimizeDeps: { exclude: [ALPHATAB_PACKAGE] } }),
    configResolved(config) {
      assetsDir = config.build.assetsDir
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
    async generateBundle() {
      for (const [name, source] of await list()) {
        this.emitFile({ type: "asset", fileName: `alphatab/${name}`, source: await readFile(source) })
      }
      for (const name of RELATIVE_FILES) {
        this.emitFile({ type: "asset", fileName: `${assetsDir}/${name}`, source: await readFile(path.join(dist!, name)) })
      }
    },
  }
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
 * from this package, which is symlinked and may sit next to another version.
 * The package's CommonJS entry is dist/alphaTab.js, so its folder is `dist`.
 */
export function alphaTabDistDir(root: string): string {
  return path.dirname(createRequire(path.join(root, "package.json")).resolve(ALPHATAB_PACKAGE))
}

const SCRIPTS = ["alphaTab.js"]
const DIRECTORIES = ["font", "soundfont"]

/**
 * Files the bundle loads by a URL relative to alphaTab's own module, which the
 * bundler cannot follow: alphaTab starts its render worker with
 * `new Worker(new URL("./alphaTab.worker.mjs", import.meta.url))`, and the
 * worker and the audio worklet both `import("./alphaTab.core.mjs")`. In a build
 * those URLs point into the assets folder, so the three files are emitted
 * there, unhashed and under the names alphaTab asks for.
 */
const RELATIVE_FILES = ["alphaTab.worker.mjs", "alphaTab.core.mjs", "alphaTab.worklet.mjs"]

const CONTENT_TYPES: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".otf": "font/otf",
  ".sf2": "application/octet-stream",
  ".sf3": "application/octet-stream",
}
