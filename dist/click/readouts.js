import { createElement as _createElement } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { partProps } from "../player/parts.js";
import { chartRangeMs, hitTiles, meterFill, signedMs } from "./report.js";
import { TIGHT_MS } from "./timing.js";
/**
 * Every note of the take in order, left to right, placed up when late and
 * down when early, over a band of ±TIGHT_MS. Each mark carries its offset in
 * `data-offset-ms` and a tooltip; the last also has `data-last`. The marks
 * and band draw in the text color, so the app's CSS restyles any of them.
 */
export function OffsetChart({ hits, height = 120, parts }) {
    const range = chartRangeMs(hits);
    const y = (ms) => PAD + ((range - ms) / (2 * range)) * (height - 2 * PAD);
    const x = (i) => `${(((i + 0.5) / hits.length) * 100).toFixed(3)}%`;
    return (_jsxs("svg", { ...partProps(parts, "root"), width: "100%", height: height, role: "img", "aria-label": `${hits.length} ${hits.length === 1 ? "note" : "notes"} in order; up is late, down is early`, children: [_jsx("rect", { ...partProps(parts, "band"), x: "0", y: y(TIGHT_MS), width: "100%", height: y(-TIGHT_MS) - y(TIGHT_MS), fill: "currentColor", fillOpacity: 0.1 }), _jsx("line", { ...partProps(parts, "zero"), x1: "0", x2: "100%", y1: y(0), y2: y(0), stroke: "currentColor", strokeOpacity: 0.4 }), _jsx("text", { ...partProps(parts, "label"), x: "0", y: PAD + 4, fill: "currentColor", fontSize: 11, children: `${signedMs(range)} late` }), _jsx("text", { ...partProps(parts, "label"), x: "0", y: height - PAD, fill: "currentColor", fontSize: 11, children: `${signedMs(-range)} early` }), hits.map((hit, i) => (_createElement("circle", { ...partProps(parts, "mark"), key: i, cx: x(i), cy: y(hit.offsetMs), r: i === hits.length - 1 ? 5 : 3.5, fill: "currentColor", "data-offset-ms": hit.offsetMs.toFixed(2), "data-last": i === hits.length - 1 ? "" : undefined },
                _jsx("title", { children: `Note ${i + 1}: ${signedMs(hit.offsetMs)}` }))))] }));
}
/** Space above and below the drawing's range, for its labels and the marks' radius. */
const PAD = 10;
/** The take's notes in four numbers: how many, their average offset, their spread and the share within ±TIGHT_MS. */
export function TakeSummary({ hits, parts }) {
    return (_jsx("dl", { ...partProps(parts, "root"), children: hitTiles(hits).map(([label, value]) => (_createElement("div", { ...partProps(parts, "item"), key: label },
            _jsx("dt", { ...partProps(parts, "label"), children: label }),
            _jsx("dd", { ...partProps(parts, "value"), children: value })))) }));
}
/** The mic's level, from -60 dBFS (empty) to full scale. The fill's width is set inline; the app gives it a height and color. */
export function MicMeter({ peak, parts }) {
    const fill = Math.round(meterFill(peak) * 100);
    return (_jsx("div", { ...partProps(parts, "root"), role: "meter", "aria-label": "Microphone level", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": fill, children: _jsx("div", { ...partProps(parts, "fill"), style: { width: `${fill}%` } }) }));
}
