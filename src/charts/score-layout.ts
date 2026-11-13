import { clampZoom } from "./score-zoom.ts"

/**
 * The display settings alphaTab starts with for a container `width` pixels
 * wide at a user `zoom`. `scale` is the width band's base scale times the
 * clamped zoom, and `stretchForce` is `stretchForWidth(width)`.
 */
export function displayForWidth(width: number, zoom: number): { scale: number; stretchForce: number } {
  const band = bandFor(width)
  return { scale: band.scale * clampZoom(zoom), stretchForce: band.stretch }
}

/**
 * How tightly alphaTab packs bars in a page-layout row, for a container this
 * wide. A value of 1 stretches each row to the full width, so a narrow row
 * holds one bar; a lower value packs more bars into each row. Narrow phone
 * widths pack tighter, because a bar at full stretch is wider than the screen.
 */
export function stretchForWidth(width: number): number {
  return bandFor(width).stretch
}

/**
 * Bands are checked in order and the first whose `maxWidth` the width does not
 * exceed wins. The last band ends below the 768 px tablet breakpoint, so a
 * fractional width between 767 and 768 counts as full width.
 */
const WIDTH_BANDS: { maxWidth: number; scale: number; stretch: number }[] = [
  { maxWidth: 360, scale: 0.78, stretch: 0.82 },
  { maxWidth: 420, scale: 0.84, stretch: 0.88 },
  { maxWidth: 520, scale: 0.9, stretch: 0.94 },
  { maxWidth: 767, scale: 0.96, stretch: 0.97 },
]

/** Used for any width past the last band, and for a width that is not a number. */
const FULL_WIDTH_BAND = { scale: 1, stretch: 1 }

function bandFor(width: number): { scale: number; stretch: number } {
  return WIDTH_BANDS.find((band) => width <= band.maxWidth) ?? FULL_WIDTH_BAND
}
