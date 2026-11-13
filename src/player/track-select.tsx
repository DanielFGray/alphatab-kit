import type { TrackOption } from "../charts/score-tracks.ts"
import { partProps, type Parts } from "./parts.ts"

export type TrackSelectProps = {
  tracks: ReadonlyArray<TrackOption>
  /** The index of the selected track, as in `TrackOption.index`. */
  track: number
  disabled?: boolean
  onTrack: (index: number) => void
  parts?: Parts<"root" | "select">
}

/** A labelled dropdown of the score's tracks. The app decides when to show it; with one track it is noise. */
export function TrackSelect({ tracks, track, disabled, onTrack, parts }: TrackSelectProps) {
  return (
    <label {...partProps(parts, "root")}>
      Track
      <select
        {...partProps(parts, "select")}
        value={track}
        disabled={disabled}
        onChange={(e) => onTrack(Number(e.target.value))}
      >
        {tracks.map((t) => (
          <option key={t.index} value={t.index}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  )
}
