import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { partProps } from "./parts.js";
/**
 * The speed trainer's settings: the passage and tempo readout, the loop switch,
 * how many loops before each speed-up, and the step size in percent or BPM.
 * It renders a fragment, so the app's container lays out its children.
 */
export function TrainerFields({ speed, tempo, parts, ...props }) {
    return (_jsxs(_Fragment, { children: [_jsx("p", { ...partProps(parts, "intro"), children: "Drag across the score to pick a passage, or leave it alone to train the whole piece. Each time the passage has looped the chosen number of times, the speed goes up by one step." }), _jsxs("p", { ...partProps(parts, "tempo"), children: [props.selection ?? "Whole piece", " \u00B7 ", tempo === null ? `${speed}×` : `${tempo} BPM (${speed}×)`] }), _jsxs("label", { ...partProps(parts, "row"), children: [_jsx("input", { ...partProps(parts, "loop"), type: "checkbox", checked: props.loop, onChange: (e) => props.onLoop(e.target.checked) }), "Loop"] }), _jsxs("label", { ...partProps(parts, "row"), children: ["After", _jsx("input", { ...partProps(parts, "loopCount"), type: "number", min: 1, step: 1, value: props.loopCount, onChange: (e) => props.onLoopCount(Number(e.target.value)) }), props.loopCount === 1 ? "loop" : "loops", ", speed up by"] }), _jsxs("div", { ...partProps(parts, "row"), children: [_jsx("input", { ...partProps(parts, "step"), type: "number", "aria-label": "Step", min: 0, step: props.stepMode === "bpm" ? 1 : 0.5, value: props.stepValue, onChange: (e) => props.onStepValue(Number(e.target.value)) }), _jsxs("select", { ...partProps(parts, "stepMode"), "aria-label": "Step unit", value: props.stepMode, onChange: (e) => props.onStepMode(e.target.value === "bpm" ? "bpm" : "percent"), children: [_jsx("option", { value: "percent", children: "%" }), _jsx("option", { value: "bpm", children: "BPM" })] })] })] }));
}
