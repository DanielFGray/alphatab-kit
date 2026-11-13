import { formatClock } from "../charts/speed-trainer.ts"
import { partProps, type Parts } from "./parts.ts"

export type SeekBarProps = {
  positionMs: number
  endMs: number
  disabled?: boolean
  onSeek: (ms: number) => void
  parts?: Parts<"root" | "time" | "range">
}

/**
 * The elapsed and total time with a range input to seek. With no length
 * (`endMs` 0) the range is inert, so a score not yet loaded cannot be seeked.
 */
export function SeekBar({ positionMs, endMs, disabled, onSeek, parts }: SeekBarProps) {
  return (
    <div {...partProps(parts, "root")}>
      <span {...partProps(parts, "time")}>
        {formatClock(positionMs)} / {formatClock(endMs)}
      </span>
      <input
        {...partProps(parts, "range")}
        type="range"
        aria-label="Seek"
        min={0}
        max={endMs || 1}
        step={10}
        value={Math.min(positionMs, endMs || 1)}
        disabled={disabled || endMs === 0}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
    </div>
  )
}
