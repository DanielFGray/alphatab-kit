/**
 * Which notation a score shows: standard notation (the five-line staff), guitar
 * tablature, or both. At least one is always on, so the score never goes blank.
 * Pure and free of the DOM, so the player and the tests share it.
 */

export type Notation = { standard: boolean; tab: boolean }

export const BOTH_NOTATIONS: Notation = { standard: true, tab: true }

/**
 * `choice` with `which` flipped. Turning off the only notation on turns the other
 * one on, so the two swap and the score never goes blank.
 */
export function toggleNotation(choice: Notation, which: keyof Notation): Notation {
  const next = { ...choice, [which]: !choice[which] }
  if (next.standard || next.tab) return next
  return { standard: which === "tab", tab: which === "standard" }
}

/**
 * What one staff shows. Only a pitched stringed instrument has tablature: a piano
 * has no strings, and a drum staff's "tab" would print MIDI note numbers. Such a
 * staff cannot follow the tab choice and keeps its standard notation whatever
 * the player chose.
 */
export function staffNotation(hasTab: boolean, choice: Notation): Notation {
  return { standard: choice.standard || !hasTab, tab: hasTab && choice.tab }
}

/**
 * The notation a track shows before the user toggles anything: standard plus
 * tablature for a guitar or bass, standard alone for every other track. A file's
 * own tab setting is ignored on purpose, so every app opens the same instrument
 * with the same notation.
 *
 * Guitar and bass are told apart by General MIDI program: 24-31 are guitars,
 * 32-39 basses. Percussion never shows tab, whatever its program number.
 */
export function defaultNotation(track: {
  readonly isPercussion: boolean
  readonly playbackInfo: { readonly program: number }
}): Notation {
  const { program } = track.playbackInfo
  const isGuitarOrBass = program >= 24 && program <= 39
  return { standard: true, tab: isGuitarOrBass && !track.isPercussion }
}
