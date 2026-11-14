/**
 * What an app passes for one part of a control: its class names and its
 * `data-*` attributes, such as test ids. The kit adds nothing to these, so the
 * app owns all styling.
 */
export type PartProps = { className?: string } & { [attr: `data-${string}`]: string | undefined }

/** The app's props for each named part of one control. A part the app leaves out renders unstyled. */
export type Parts<Slot extends string> = Partial<Record<Slot, PartProps>>

/**
 * The props a control puts on one of its parts: the app's props for that slot,
 * then `data-part` naming the slot, so a test or stylesheet can find it by name.
 */
export function partProps<Slot extends string>(
  parts: Parts<Slot> | undefined,
  slot: Slot,
): PartProps & { "data-part": Slot } {
  return { ...parts?.[slot], "data-part": slot }
}
