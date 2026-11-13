import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MAX_ZOOM, MIN_ZOOM, stepZoom } from "../charts/score-zoom.js";
import { partProps } from "./parts.js";
/**
 * Smaller and larger buttons around the zoom percentage. Tapping the percentage
 * returns to 100%. The out and in buttons are separate parts, so an app can
 * give each its own test id; they usually share one class string.
 */
export function ZoomControl({ zoom, onZoom, parts }) {
    return (_jsxs("div", { ...partProps(parts, "root"), children: ["Zoom", _jsx("button", { ...partProps(parts, "zoomOut"), type: "button", "aria-label": "Zoom out", disabled: zoom <= MIN_ZOOM, onClick: () => onZoom(stepZoom(zoom, -1)), children: "\u2212" }), _jsxs("button", { ...partProps(parts, "reset"), type: "button", "aria-label": "Reset zoom to 100%", title: "Reset zoom", onClick: () => onZoom(1), children: [Math.round(zoom * 100), "%"] }), _jsx("button", { ...partProps(parts, "zoomIn"), type: "button", "aria-label": "Zoom in", disabled: zoom >= MAX_ZOOM, onClick: () => onZoom(stepZoom(zoom, 1)), children: "+" })] }));
}
