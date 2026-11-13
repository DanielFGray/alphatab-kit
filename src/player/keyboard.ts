/** What a key press must tell the controller: the fields of a `KeyboardEvent` it reads. */
export interface KeyPress {
  readonly key: string
  readonly code: string
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly altKey: boolean
  readonly metaKey: boolean
  readonly repeat: boolean
}

/**
 * True when the element the key came from uses that key itself, so a score shortcut must leave it alone. A
 * control the user types or drags in uses every key: Space types a space and the arrows move a caret or a
 * slider. A button, link or toggle uses Space to press itself, so Space on the metronome button toggles the
 * metronome and does not start playback.
 */
export function targetUsesKey(target: EventTarget | null, code: string): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest(EDITABLE) !== null) return true
  return code === "Space" && target.closest(PRESSABLE) !== null
}

const EDITABLE =
  "input, textarea, select, [contenteditable='true'], [role='textbox'], [role='combobox'], [role='slider']"

const PRESSABLE = "button, a[href], summary, [role='button'], [role='checkbox'], [role='switch'], [role='menuitem']"
