# alphatab-kit

Shared alphaTab customizations for dfg.codes, dfg.rocks, setlist and newblog: Vite plugin, patches, React player parts. Installed in each project with `bun link alphatab-kit --save`.

- Consumers load the compiled `dist/`, not `src/`: Node refuses to run TypeScript from `node_modules`, and Vite loads `vite.config.ts` in Node. Run `bun run dev` (tsc watch) while editing.
- Commands: `bun run typecheck`, `bun run lint`, `bun run build`; `prepare` re-patches `tsc` and `oxlint` after every install.

# Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `node_modules/effect/AGENTS.md`
**completely**, and follow the links in the file when required.

If you need to learn more about particular Effect apis and concepts that the
guide doesn't cover, search through the source code in `node_modules/effect/src`.

# Patches

`patches/alphatab-<version>.patch` is the one patch of `@coderline/alphatab` for every consumer. A consumer sets `patchedDependencies` to `../alphatab-kit/patches/<file>` and pins alphaTab to the same version; bun applies the patch from outside the project. It holds: lyric skipping past tied notes and GP5 percussion fallback (from setlist), and pointer events plus tempo-after-seek in the sequencer (from dfg.rocks). The patch fails on any other alphaTab version: port the hunks to the new `dist` (whitespace and quote style differ between releases) and rename the file.
