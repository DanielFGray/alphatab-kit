import { type Settings } from "@coderline/alphatab";
/** Draws in `css`, the text color around the score, with staff lines and bar lines fainter. */
export declare function inkFrom(settings: Settings, css: string): void;
/**
 * Calls `onChange` when the page's theme may have changed. An app marks its theme with a class, a `data-theme`
 * attribute or an inline style on the root element, so a change to one of them is the signal. Returns the
 * function that stops watching.
 */
export declare function observeTheme(onChange: () => void, root?: HTMLElement): () => void;
