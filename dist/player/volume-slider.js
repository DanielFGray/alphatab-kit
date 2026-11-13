import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MAX_VOLUME, MIN_VOLUME } from "../charts/score-mixer.js";
import { partProps } from "./parts.js";
/** A labelled range input for the volume, in steps of 0.05. */
export function VolumeSlider({ volume, disabled, onVolume, parts }) {
    return (_jsxs("label", { ...partProps(parts, "root"), children: ["Volume", _jsx("input", { ...partProps(parts, "input"), type: "range", min: MIN_VOLUME, max: MAX_VOLUME, step: 0.05, value: volume, disabled: disabled, onChange: (e) => onVolume(Number(e.target.value)) })] }));
}
