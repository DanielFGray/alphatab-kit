import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { partProps } from "./parts.js";
/** A labelled dropdown of the score's tracks. The app decides when to show it; with one track it is noise. */
export function TrackSelect({ tracks, track, disabled, onTrack, parts }) {
    return (_jsxs("label", { ...partProps(parts, "root"), children: ["Track", _jsx("select", { ...partProps(parts, "select"), value: track, disabled: disabled, onChange: (e) => onTrack(Number(e.target.value)), children: tracks.map((t) => (_jsx("option", { value: t.index, children: t.label }, t.index))) })] }));
}
