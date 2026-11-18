/**
 * True when the element the key came from uses that key itself, so a score shortcut must leave it alone. A
 * control the user types or drags in uses every key: Space types a space and the arrows move a caret or a
 * slider. A button, link or toggle uses Space to press itself, so Space on the metronome button toggles the
 * metronome and does not start playback.
 */
export function targetUsesKey(target, code) {
    if (!(target instanceof HTMLElement))
        return false;
    if (target.closest(EDITABLE) !== null)
        return true;
    return code === "Space" && target.closest(PRESSABLE) !== null;
}
/**
 * Sends keydown events from anywhere under `root` to `handleKey`, which returns true when it used the key. The
 * listener is in the capture phase, so the player sees a key before a control under `root` does, and it skips a key
 * the target uses itself (targetUsesKey). Returns the function that removes it.
 */
export function listenForKeys(root, handleKey) {
    const onKeyDown = (event) => {
        if (event.defaultPrevented || targetUsesKey(event.target, event.code))
            return;
        if (handleKey(event))
            event.preventDefault();
    };
    root.addEventListener("keydown", onKeyDown, true);
    return () => root.removeEventListener("keydown", onKeyDown, true);
}
const EDITABLE = "input, textarea, select, [contenteditable='true'], [role='textbox'], [role='combobox'], [role='slider']";
const PRESSABLE = "button, a[href], summary, [role='button'], [role='checkbox'], [role='switch'], [role='menuitem']";
