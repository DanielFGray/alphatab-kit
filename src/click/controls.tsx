import { partProps, type Parts } from "../player/parts.ts"
import { SUBDIVISIONS } from "./report.ts"
import type { Subdivision } from "./timing.ts"
import type { Mic } from "./use-click-track.ts"

export const MIN_BPM = 30
export const MAX_BPM = 300
/** The bar lengths the bar picker offers, in clicks. */
export const MAX_BEATS_PER_BAR = 12

export type ClickButtonProps = {
  /** What the button starts: "Click", "Listen". */
  label: string
  pressed: boolean
  /** The take's beat (`Take.beat`), shown as the place in the bar while pressed. */
  beat: number | null
  beatsPerBar: number
  onToggle: () => void
  parts?: Parts<"root">
}

/**
 * Starts and stops one click mode. While pressed it counts the bar, "Listen · 3",
 * and carries the beat in `data-beat` for a stylesheet that flashes on the click.
 */
export function ClickButton({ label, pressed, beat, beatsPerBar, onToggle, parts }: ClickButtonProps) {
  const counting = pressed && beat !== null
  return (
    <button
      {...partProps(parts, "root")}
      type="button"
      aria-pressed={pressed}
      data-beat={counting ? beat : undefined}
      onClick={onToggle}
    >
      {counting ? `${label} · ${(beat % beatsPerBar) + 1}` : label}
    </button>
  )
}

export type BpmInputProps = {
  bpm: number
  onBpm: (bpm: number) => void
  parts?: Parts<"root" | "input">
}

/**
 * The click's tempo, typed. Like the speed input, it holds the typed text
 * until the field loses focus or Enter is pressed, because each change of
 * tempo restarts the take; Escape puts the tempo back.
 */
export function BpmInput({ bpm, onBpm, parts }: BpmInputProps) {
  const shown = String(bpm)
  return (
    <label {...partProps(parts, "root")}>
      Tempo
      <input
        {...partProps(parts, "input")}
        key={shown}
        type="number"
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        inputMode="numeric"
        defaultValue={shown}
        onBlur={(e) => {
          const typed = Number.parseFloat(e.currentTarget.value)
          if (Number.isFinite(typed)) onBpm(clampBpm(typed))
          e.currentTarget.value = shown
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") e.currentTarget.value = shown
        }}
      />
      BPM
    </label>
  )
}

/** A tempo the click plays: a whole number of beats per minute within MIN_BPM and MAX_BPM. */
export const clampBpm = (bpm: number): number => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))

export type BeatsPerBarSelectProps = {
  beatsPerBar: number
  onBeatsPerBar: (beatsPerBar: number) => void
  parts?: Parts<"root" | "select">
}

/** Clicks in a bar, from 1 to MAX_BEATS_PER_BAR. */
export function BeatsPerBarSelect({ beatsPerBar, onBeatsPerBar, parts }: BeatsPerBarSelectProps) {
  return (
    <label {...partProps(parts, "root")}>
      Beats per bar
      <select
        {...partProps(parts, "select")}
        value={beatsPerBar}
        onChange={(e) => onBeatsPerBar(Number(e.currentTarget.value))}
      >
        {Array.from({ length: MAX_BEATS_PER_BAR }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </label>
  )
}

export type SubdivisionSelectProps = {
  subdivision: Subdivision
  onSubdivision: (subdivision: Subdivision) => void
  parts?: Parts<"root" | "select">
}

/** The grid the notes are scored against, in notes per click. */
export function SubdivisionSelect({ subdivision, onSubdivision, parts }: SubdivisionSelectProps) {
  return (
    <label {...partProps(parts, "root")}>
      Notes aim at
      <select
        {...partProps(parts, "select")}
        value={subdivision}
        onChange={(e) => {
          const typed = e.currentTarget.value
          const chosen = SUBDIVISIONS.find(([value]) => String(value) === typed)
          if (chosen) onSubdivision(chosen[0])
        }}
      >
        {SUBDIVISIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}

export type MicPickerProps = {
  /** `UseClickTrack.mics`. */
  mics: ReadonlyArray<Mic>
  /** The chosen mic, or null for the browser's default. */
  micId: string | null
  onMic: (micId: string | null) => void
  parts?: Parts<"root" | "select">
}

/**
 * The input to listen on. A chosen mic the browser does not list (unplugged,
 * or the list not read yet) stays chosen and shows as "Chosen microphone", so a
 * saved choice is not lost on a page load.
 */
export function MicPicker({ mics, micId, onMic, parts }: MicPickerProps) {
  const listed = micId === null || mics.some((mic) => mic.id === micId)
  return (
    <label {...partProps(parts, "root")}>
      Microphone
      <select
        {...partProps(parts, "select")}
        value={micId ?? DEFAULT_MIC}
        onChange={(e) => onMic(e.currentTarget.value === DEFAULT_MIC ? null : e.currentTarget.value)}
      >
        <option value={DEFAULT_MIC}>The browser's default</option>
        {!listed && <option value={micId}>Chosen microphone</option>}
        {mics.map((mic) => (
          <option key={mic.id} value={mic.id}>
            {mic.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** The picker's value for the default mic. `micsFrom` lists no input with an empty id, so it is free. */
const DEFAULT_MIC = ""
