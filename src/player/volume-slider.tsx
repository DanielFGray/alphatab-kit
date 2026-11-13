import { MAX_VOLUME, MIN_VOLUME } from "../charts/score-mixer.ts"
import { partProps, type Parts } from "./parts.ts"

export type VolumeSliderProps = {
  /** The track volume, from MIN_VOLUME to MAX_VOLUME. */
  volume: number
  disabled?: boolean
  onVolume: (volume: number) => void
  parts?: Parts<"root" | "input">
}

/** A labelled range input for the volume, in steps of 0.05. */
export function VolumeSlider({ volume, disabled, onVolume, parts }: VolumeSliderProps) {
  return (
    <label {...partProps(parts, "root")}>
      Volume
      <input
        {...partProps(parts, "input")}
        type="range"
        min={MIN_VOLUME}
        max={MAX_VOLUME}
        step={0.05}
        value={volume}
        disabled={disabled}
        onChange={(e) => onVolume(Number(e.target.value))}
      />
    </label>
  )
}
