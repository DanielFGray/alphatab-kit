import { createElement as _createElement } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { partProps } from "../player/parts.js";
import { SUBDIVISIONS } from "./report.js";
export const MIN_BPM = 30;
export const MAX_BPM = 300;
/** The bar lengths the bar picker offers, in clicks. */
export const MAX_BEATS_PER_BAR = 12;
/**
 * Starts and stops one click mode. While pressed it counts the bar, "Listen · 3",
 * and carries the beat in `data-beat` for a stylesheet that flashes on the click.
 */
export function ClickButton({ label, pressed, beat, beatsPerBar, onToggle, parts }) {
    const counting = pressed && beat !== null;
    return (_jsx("button", { ...partProps(parts, "root"), type: "button", "aria-pressed": pressed, "data-beat": counting ? beat : undefined, onClick: onToggle, children: counting ? `${label} · ${(beat % beatsPerBar) + 1}` : label }));
}
/**
 * The click's tempo, typed. Like the speed input, it holds the typed text
 * until the field loses focus or Enter is pressed, because each change of
 * tempo restarts the take; Escape puts the tempo back.
 */
export function BpmInput({ bpm, onBpm, parts }) {
    const shown = String(bpm);
    return (_jsxs("label", { ...partProps(parts, "root"), children: ["Tempo", _createElement("input", { ...partProps(parts, "input"), key: shown, type: "number", min: MIN_BPM, max: MAX_BPM, step: 1, inputMode: "numeric", defaultValue: shown, onBlur: (e) => {
                    const typed = Number.parseFloat(e.currentTarget.value);
                    if (Number.isFinite(typed))
                        onBpm(clampBpm(typed));
                    e.currentTarget.value = shown;
                }, onKeyDown: (e) => {
                    if (e.key === "Enter")
                        e.currentTarget.blur();
                    if (e.key === "Escape")
                        e.currentTarget.value = shown;
                } }), "BPM"] }));
}
/** A tempo the click plays: a whole number of beats per minute within MIN_BPM and MAX_BPM. */
export const clampBpm = (bpm) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
/** Clicks in a bar, from 1 to MAX_BEATS_PER_BAR. */
export function BeatsPerBarSelect({ beatsPerBar, onBeatsPerBar, parts }) {
    return (_jsxs("label", { ...partProps(parts, "root"), children: ["Beats per bar", _jsx("select", { ...partProps(parts, "select"), value: beatsPerBar, onChange: (e) => onBeatsPerBar(Number(e.currentTarget.value)), children: Array.from({ length: MAX_BEATS_PER_BAR }, (_, i) => (_jsx("option", { value: i + 1, children: i + 1 }, i + 1))) })] }));
}
/** The grid the notes are scored against, in notes per click. */
export function SubdivisionSelect({ subdivision, onSubdivision, parts }) {
    return (_jsxs("label", { ...partProps(parts, "root"), children: ["Notes aim at", _jsx("select", { ...partProps(parts, "select"), value: subdivision, onChange: (e) => {
                    const typed = e.currentTarget.value;
                    const chosen = SUBDIVISIONS.find(([value]) => String(value) === typed);
                    if (chosen)
                        onSubdivision(chosen[0]);
                }, children: SUBDIVISIONS.map(([value, label]) => (_jsx("option", { value: value, children: label }, value))) })] }));
}
/**
 * The input to listen on. A chosen mic the browser does not list (unplugged,
 * or the list not read yet) stays chosen and shows as "Chosen microphone", so a
 * saved choice is not lost on a page load.
 */
export function MicPicker({ mics, micId, onMic, parts }) {
    const listed = micId === null || mics.some((mic) => mic.id === micId);
    return (_jsxs("label", { ...partProps(parts, "root"), children: ["Microphone", _jsxs("select", { ...partProps(parts, "select"), value: micId ?? DEFAULT_MIC, onChange: (e) => onMic(e.currentTarget.value === DEFAULT_MIC ? null : e.currentTarget.value), children: [_jsx("option", { value: DEFAULT_MIC, children: "The browser's default" }), !listed && _jsx("option", { value: micId, children: "Chosen microphone" }), mics.map((mic) => (_jsx("option", { value: mic.id, children: mic.label }, mic.id)))] })] }));
}
/** The picker's value for the default mic. `micsFrom` lists no input with an empty id, so it is free. */
const DEFAULT_MIC = "";
