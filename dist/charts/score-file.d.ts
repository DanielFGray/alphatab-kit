/**
 * What a score upload must be (docs/adr/0002). The app stores the Guitar Pro
 * file unchanged, so the only checks are on its outside: a size limit and the
 * magic bytes that name the format. Whether alphaTab can read the contents is
 * known only when the viewer loads it.
 */
/** The database refuses a larger file (`score_files.bytes`). */
export declare const MAX_SCORE_BYTES: number;
type ScoreFormat = "gp3-5" | "gpx" | "gp7";
/**
 * The Guitar Pro format that `bytes` start like, or null if it is none.
 * - Guitar Pro 3 to 5: a length byte, then the text "FICHIER GUITAR PRO v".
 * - Guitar Pro 6 (.gpx): "BCFZ" (compressed) or "BCFS".
 * - Guitar Pro 7 and 8 (.gp): a zip archive.
 */
export declare function scoreFormat(bytes: Uint8Array): ScoreFormat | null;
/** The chart name a file gets by default: its file name without the extension. */
export declare function chartNameFromFile(fileName: string): string;
/** True when `bytes` hold the characters of `text` from `offset` on. */
export declare function startsWith(bytes: Uint8Array, offset: number, text: string): boolean;
export {};
