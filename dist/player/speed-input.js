import { jsxs as _jsxs } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
import { MAX_SPEED, MIN_SPEED } from "../charts/speed-trainer.js";
import { partProps } from "./parts.js";
/**
 * The playback speed as a number the player types, such as 0.75. It holds the
 * typed text until the field loses focus or Enter is pressed, so a half-typed
 * value is not clamped under the player's fingers; Escape puts the speed back.
 */
export function SpeedInput({ speed, onSpeed, parts }) {
    const shown = String(Number.parseFloat(speed.toFixed(3)));
    return (_jsxs("label", { ...partProps(parts, "root"), children: ["Speed", _createElement("input", { ...partProps(parts, "input"), key: shown, type: "number", min: MIN_SPEED, max: MAX_SPEED, step: 0.05, inputMode: "decimal", defaultValue: shown, onBlur: (e) => {
                    const typed = Number.parseFloat(e.currentTarget.value);
                    if (Number.isFinite(typed))
                        onSpeed(typed);
                    else
                        e.currentTarget.value = shown;
                }, onKeyDown: (e) => {
                    if (e.key === "Enter")
                        e.currentTarget.blur();
                    if (e.key === "Escape")
                        e.currentTarget.value = shown;
                } }), "\u00D7"] }));
}
