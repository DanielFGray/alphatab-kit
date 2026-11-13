# alphatab-kit

Shared alphaTab customizations for dfg.codes, dfg.rocks and setlist: Vite plugin, patch, React player parts.

- Apps install the kit as a git dependency on a tag (`"alphatab-kit": "git+…#vX.Y.Z"`), so container builds see it like any other package. For local work across both repos, `bun link alphatab-kit` (without `--save`) in the app replaces the installed copy with a symlink until the next install.
- `dist/` is committed: apps do not build the kit on install, and Node cannot load TypeScript from `node_modules` when Vite loads `vite.config.ts`. Run `bun run build` before each commit; `src/dist.test.ts` fails when `dist/` is stale.
- Commands: `bun test`, `bun run typecheck`, `bun run lint`, `bun run build`. `prepare` re-patches `tsc` and `oxlint` after every install.

# Patches

`patches/alphatab-<version>.patch` is the one patch of `@coderline/alphatab` for every app. bun applies a patch during install and a container build sees only the app's folder, so each app keeps a copy: run `bunx alphatab-kit patch` in the app to write `patches/@coderline%2Falphatab@<version>.patch`, set `patchedDependencies`, and pin alphaTab to that version. `bunx alphatab-kit patch --check` exits 1 when the copy has drifted.

The patch holds: lyric skipping past tied notes and the GP5 percussion fallback (from setlist), and pointer events plus tempo after a seek in the sequencer (from dfg.rocks). It fails on any other alphaTab version: port the hunks to the new `dist` (whitespace and quote style differ between releases) and rename the file.

The kit applies the same patch to its own alphaTab (`patchedDependencies` in package.json): the chart tests read lyrics from scores and rely on the tied-note fix.

# Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `node_modules/effect/AGENTS.md`
**completely**, and follow the links in the file when required.

If you need to learn more about particular Effect apis and concepts that the
guide doesn't cover, search through the source code in `node_modules/effect/src`.
