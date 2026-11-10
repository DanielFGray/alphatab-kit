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
export declare function main(args: ReadonlyArray<string>): Promise<number>;
/**
 * Brings the app at `appDir` in line with the kit's patch. In check mode it
 * returns what differs; otherwise it fixes it and returns nothing.
 */
export declare function syncPatch(appDir: string, { check }: {
    check: boolean;
}): Promise<ReadonlyArray<string>>;
