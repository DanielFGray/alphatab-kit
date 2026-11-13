import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatClock } from "../charts/speed-trainer.js";
import { partProps } from "./parts.js";
/**
 * The elapsed and total time with a range input to seek. With no length
 * (`endMs` 0) the range is inert, so a score not yet loaded cannot be seeked.
 */
export function SeekBar({ positionMs, endMs, disabled, onSeek, parts }) {
    return (_jsxs("div", { ...partProps(parts, "root"), children: [_jsxs("span", { ...partProps(parts, "time"), children: [formatClock(positionMs), " / ", formatClock(endMs)] }), _jsx("input", { ...partProps(parts, "range"), type: "range", "aria-label": "Seek", min: 0, max: endMs || 1, step: 10, value: Math.min(positionMs, endMs || 1), disabled: disabled || endMs === 0, onChange: (e) => onSeek(Number(e.target.value)) })] }));
}
