import type { Notation } from "../charts/score-notation.ts"
import { partProps, type Parts } from "./parts.ts"

export type NotationTogglesProps = {
  notation: Notation
  onNotation: (which: keyof Notation) => void
  parts?: Parts<"root" | "standard" | "tab">
}

/**
 * Two toggles for the staves, each reporting its state in `aria-pressed`. Turning
 * off the only one on turns the other on.
 */
export function NotationToggles({ notation, onNotation, parts }: NotationTogglesProps) {
  return (
    <div {...partProps(parts, "root")}>
      Show
      <button {...partProps(parts, "standard")} type="button" aria-pressed={notation.standard} onClick={() => onNotation("standard")}>
        Standard
      </button>
      <button {...partProps(parts, "tab")} type="button" aria-pressed={notation.tab} onClick={() => onNotation("tab")}>
        Tab
      </button>
    </div>
  )
}
