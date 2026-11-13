import type { StepMode } from "../charts/speed-trainer.ts";
import { type Parts } from "./parts.ts";
export type TrainerProps = {
    loop: boolean;
    onLoop: (on: boolean) => void;
    loopCount: number;
    onLoopCount: (count: number) => void;
    stepMode: StepMode;
    onStepMode: (mode: StepMode) => void;
    stepValue: number;
    onStepValue: (value: number) => void;
    /** The song's tempo at the current speed, or null when the score names none. */
    tempo: number | null;
    /** The bars a drag selected, as text such as "Bars 3–5", or null for the whole piece. */
    selection: string | null;
    onClearSelection: () => void;
};
export type TrainerFieldsProps = TrainerProps & {
    speed: number;
    parts?: Parts<"intro" | "tempo" | "row" | "loop" | "loopCount" | "step" | "stepMode">;
};
/**
 * The speed trainer's settings: the passage and tempo readout, the loop switch,
 * how many loops before each speed-up, and the step size in percent or BPM.
 * It renders a fragment, so the app's container lays out its children. The
 * tempo readout multiplies the score's tempo by `speed`, rounded to one decimal.
 */
export declare function TrainerFields({ speed, parts, ...props }: TrainerFieldsProps): import("react").JSX.Element;
