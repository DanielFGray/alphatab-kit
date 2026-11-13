import { jsx as _jsx } from "react/jsx-runtime";
import { partProps } from "./parts.js";
/**
 * A round button holding one icon. `aria-pressed` is set only when `pressed` is
 * passed, so a plain action button has no toggle state. `data-pressed` is always
 * "true" or "false", so an app can style both states from one class string with
 * Tailwind's `data-[pressed=true]:` and `data-[pressed=false]:` variants.
 */
export function IconButton({ label, pressed, disabled, onClick, parts, children }) {
    return (_jsx("button", { ...partProps(parts, "button"), type: "button", "aria-label": label, title: label, "aria-pressed": pressed, "data-pressed": pressed === true ? "true" : "false", disabled: disabled, onClick: onClick, children: children }));
}
