import type { ReactNode } from "react"
import { partProps, type Parts } from "./parts.ts"

export type IconButtonProps = {
  /** The accessible name, also shown as the tooltip. */
  label: string
  /** Set on a toggle: true when it is on. Leave unset on a plain action button. */
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  parts?: Parts<"button">
  children: ReactNode
}

/**
 * A round button holding one icon. `aria-pressed` is set only when `pressed` is
 * passed, so a plain action button has no toggle state. `data-pressed` is always
 * "true" or "false", so an app can style both states from one class string with
 * Tailwind's `data-[pressed=true]:` and `data-[pressed=false]:` variants.
 */
export function IconButton({ label, pressed, disabled, onClick, parts, children }: IconButtonProps) {
  return (
    <button
      {...partProps(parts, "button")}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      data-pressed={pressed === true ? "true" : "false"}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
