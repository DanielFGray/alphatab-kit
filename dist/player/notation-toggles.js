import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { partProps } from "./parts.js";
/**
 * Two toggles for the staves, each reporting its state in `aria-pressed`. Turning
 * off the only one on turns the other on.
 */
export function NotationToggles({ notation, onNotation, parts }) {
    return (_jsxs("div", { ...partProps(parts, "root"), children: ["Show", _jsx("button", { ...partProps(parts, "standard"), type: "button", "aria-pressed": notation.standard, onClick: () => onNotation("standard"), children: "Standard" }), _jsx("button", { ...partProps(parts, "tab"), type: "button", "aria-pressed": notation.tab, onClick: () => onNotation("tab"), children: "Tab" })] }));
}
