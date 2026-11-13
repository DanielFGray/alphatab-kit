import type { Notation } from "../charts/score-notation.ts";
import { type Parts } from "./parts.ts";
export type NotationTogglesProps = {
    notation: Notation;
    onNotation: (which: keyof Notation) => void;
    parts?: Parts<"root" | "standard" | "tab">;
};
/**
 * Two toggles for the staves, each reporting its state in `aria-pressed`. Turning
 * off the only one on turns the other on.
 */
export declare function NotationToggles({ notation, onNotation, parts }: NotationTogglesProps): import("react").JSX.Element;
