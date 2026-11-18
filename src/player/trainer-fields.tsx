import type { StepMode } from "../charts/speed-trainer.ts"
import { partProps, type Parts } from "./parts.ts"

export type TrainerProps = {
  loop: boolean
  onLoop: (on: boolean) => void
  loopCount: number
  onLoopCount: (count: number) => void
  stepMode: StepMode
  onStepMode: (mode: StepMode) => void
  stepValue: number
  onStepValue: (value: number) => void
  /** The song's tempo at the current speed, or null when the score names none. */
  tempo: number | null
  /** The bars a drag selected, as text such as "Bars 3–5", or null for the whole piece. */
  selection: string | null
  onClearSelection: () => void
}

export type TrainerFieldsProps = TrainerProps & {
  speed: number
  parts?: Parts<"intro" | "tempo" | "clear" | "row" | "loop" | "loopCount" | "step" | "stepMode">
}

/**
 * The speed trainer's settings: the passage and tempo readout, the loop switch,
 * how many loops before each speed-up, and the step size in percent or BPM.
 * It renders a fragment, so the app's container lays out its children.
 */
export function TrainerFields({ speed, tempo, parts, ...props }: TrainerFieldsProps) {
  return (
    <>
      <p {...partProps(parts, "intro")}>
        Drag across the score to pick a passage, or leave it alone to train the whole piece. Each time the passage has
        looped the chosen number of times, the speed goes up by one step.
      </p>
      <p {...partProps(parts, "tempo")}>
        {props.selection ?? "Whole piece"} · {tempo === null ? `${speed}×` : `${tempo} BPM (${speed}×)`}
      </p>
      {props.selection !== null && (
        <button {...partProps(parts, "clear")} type="button" onClick={props.onClearSelection}>
          Clear selection
        </button>
      )}
      <label {...partProps(parts, "row")}>
        <input
          {...partProps(parts, "loop")}
          type="checkbox"
          checked={props.loop}
          onChange={(e) => props.onLoop(e.target.checked)}
        />
        Loop
      </label>
      <label {...partProps(parts, "row")}>
        After
        <input
          {...partProps(parts, "loopCount")}
          type="number"
          min={1}
          step={1}
          value={props.loopCount}
          onChange={(e) => props.onLoopCount(Number(e.target.value))}
        />
        {props.loopCount === 1 ? "loop" : "loops"}, speed up by
      </label>
      <div {...partProps(parts, "row")}>
        <input
          {...partProps(parts, "step")}
          type="number"
          aria-label="Step"
          min={0}
          step={props.stepMode === "bpm" ? 1 : 0.5}
          value={props.stepValue}
          onChange={(e) => props.onStepValue(Number(e.target.value))}
        />
        <select
          {...partProps(parts, "stepMode")}
          aria-label="Step unit"
          value={props.stepMode}
          onChange={(e) => props.onStepMode(e.target.value === "bpm" ? "bpm" : "percent")}
        >
          <option value="percent">%</option>
          <option value="bpm">BPM</option>
        </select>
      </div>
    </>
  )
}
