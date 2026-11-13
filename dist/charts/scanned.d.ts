/** One word on a page, as a box in the page's units with y growing downward. */
export type WordBox = {
    readonly page: number;
    /** The word's line on its page; numbers only group words, they need not be in order. */
    readonly line: number;
    readonly text: string;
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
};
/**
 * Chords over lyrics text from the words of one or more pages. Pages are
 * separated by a blank line, and a gap of more than one and a half lines on a
 * page becomes a blank line.
 */
export declare function textFromWords(words: ReadonlyArray<WordBox>): string;
/**
 * The words of Tesseract TSV output (`tesseract page.png - tsv`). Its lines are
 * kept: Tesseract finds them along a tilted photo's slope, where words at the
 * end of a line sit lower on the image than words at its start.
 */
export declare function wordsFromTesseract(tsv: string): Array<WordBox>;
/**
 * The words of a PDF's text layer, from `pdftotext -bbox` output. A text
 * layer is not tilted, but it often holds each chord as a line of its own, so
 * lines are found by height: a word joins the line of the first word it
 * overlaps from top to bottom at its middle.
 */
export declare function wordsFromPdf(xhtml: string): Array<WordBox>;
/** A file a chart can be read from: a PDF, or an image Tesseract can open. */
export type ScanFormat = "pdf" | "image";
/** The same limit as a score upload: a phone photo fits, a whole songbook does not. */
export declare const MAX_SCAN_BYTES: number;
/** PDF pages read from one file; a song's chart is one or two. */
export declare const MAX_SCAN_PAGES = 10;
/** What `bytes` start like: a PDF, a PNG, JPEG, TIFF, WebP or BMP image, or neither (null). */
export declare function scanFormat(bytes: Uint8Array): ScanFormat | null;
