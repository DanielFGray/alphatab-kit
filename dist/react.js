import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { preload } from "react-dom";
import { ALPHATAB_BASE } from "./index.js";
import { staticScoreCss, staticScoreHtml } from "./static.js";
/**
 * Shows a static score in place of a player until the player has drawn.
 *
 * The static score holds the page layout, so a server-rendered page shows the
 * music before any script runs. The player's element sits over it, at full
 * width but invisible, so alphaTab can measure it and draw. When
 * `playerReady` turns true the player takes the static score's place. Print
 * always shows the static score, which keeps whole systems on each page.
 */
export function StaticScoreFrame({ score, playerReady, fontDirectory = `${ALPHATAB_BASE}font/`, children, }) {
    preload(`${fontDirectory}Bravura.woff2`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
    const html = useMemo(() => staticScoreHtml(score), [score]);
    return (_jsxs("div", { className: "at-frame", "data-player-ready": playerReady ? "" : undefined, children: [_jsx("style", { href: `gigbag.js/static-score${fontDirectory}`, precedence: "gigbag.js", children: `${staticScoreCss(fontDirectory)}\n${FRAME_CSS}` }), _jsx("div", { className: "at-frame-static", dangerouslySetInnerHTML: { __html: html } }), _jsx("div", { className: "at-frame-player", children: children })] }));
}
// visibility, not display: alphaTab skips drawing into an element with no width.
const FRAME_CSS = `.at-frame{position:relative}
.at-frame:not([data-player-ready])>.at-frame-player{position:absolute;inset:0;visibility:hidden}
.at-frame[data-player-ready]>.at-frame-static{display:none}
@media print{.at-frame>.at-frame-static{display:block!important}.at-frame>.at-frame-player{display:none!important}}`;
