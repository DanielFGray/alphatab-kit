import type { Plugin } from "vite";
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
export declare function alphaTabAssets(): Plugin;
/**
 * Points alphaTab's worker and worklet URLs at `dir`. alphaTab builds them as
 * `new URL("./alphaTab.worker.mjs", import.meta.url)`; an absolute path in
 * place of the relative one makes them independent of where the bundle puts
 * alphaTab's module. The base becomes `"" + import.meta.url`, the form Vite
 * writes in its own output: Vite's worker plugin bundles any
 * `new Worker(new URL("<literal>", import.meta.url))`, and would look for the
 * absolute path in the public folder, where these files never are.
 *
 * Throws when a URL is missing, so an alphaTab release that changes how it
 * starts workers fails the build instead of the player.
 */
export declare function rewriteWorkerUrls(code: string, dir: string): string;
/**
 * Published name (relative to `/alphatab/`) to file on disk, for every file the
 * app serves from the alphaTab `dist` folder.
 */
export declare function collectAssets(dist: string): Promise<Map<string, string>>;
/**
 * The folder of the alphaTab the app installed. Resolved from the app root, not
 * from this package, which may be symlinked next to another alphaTab version.
 * The package's CommonJS entry is dist/alphaTab.js, so its folder is `dist`.
 */
export declare function alphaTabDistDir(root: string): string;
