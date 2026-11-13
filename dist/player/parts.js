/**
 * The props a control puts on one of its parts: the app's props for that slot,
 * then `data-part` naming the slot, so a test or stylesheet can find it by name.
 */
export function partProps(parts, slot) {
    return { ...parts?.[slot], "data-part": slot };
}
