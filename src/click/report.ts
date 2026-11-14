import { countInBeats } from "./click.ts"
import type { Take } from "./take.ts"
import { type Hit, type Subdivision, summarize, TIGHT_MS } from "./timing.ts"

/**
 * The words and numbers a take shows the player, shared by the click parts and
 * any app that lays out its own. Nothing is saved: a take lives while it is shown.
 */

/** One line on what the player should do now. `beatsPerBar` is the click's, which sets the count-in's length. */
export const takeStatus = (take: Take, running: boolean, beatsPerBar: number): string => {
  if (take.failure !== null) return take.failure
  if (take.missedClick) return MISSED_CLICK
  const notes = take.notesMs.length
  if (!running) return `Stopped after ${notes} ${notes === 1 ? "note" : "notes"}.`
  if (take.device === null) return "Opening the microphone…"
  if (take.beat === null) return "Starting…"
  const countIn = countInBeats(beatsPerBar)
  if (take.latencyMs === null)
    return `Count-in ${Math.min(take.beat, countIn - 1) + 1} of ${countIn}: listen while the mic measures the click.`
  const play = `Play. Speaker-to-mic delay ${take.latencyMs.toFixed(0)} ms.`
  return take.dropouts === 0
    ? play
    : `${play} The audio dropped out ${take.dropouts === 1 ? "once" : `${take.dropouts} times`}; notes right after a dropout may be missing.`
}

/** The summary of a take's notes: a label and a value each. */
export const hitTiles = (hits: ReadonlyArray<Hit>): ReadonlyArray<readonly [string, string]> => {
  const summary = summarize(hits)
  const none = summary.count === 0
  return [
    ["Notes", String(summary.count)],
    ["Average", none ? "—" : `${signedMs(summary.meanMs)} ${tendency(summary.meanMs)}`],
    ["Spread", summary.count < 2 ? "—" : `±${summary.spreadMs.toFixed(1)} ms`],
    [`Within ±${TIGHT_MS} ms`, none ? "—" : `${Math.round(summary.tight * 100)}%`],
  ]
}

/**
 * The grids a player can aim at, counted in notes per click: the click may be
 * a quarter note, or a dotted quarter in 6/8, so a note value would mislead.
 */
export const SUBDIVISIONS: ReadonlyArray<readonly [Subdivision, string]> = [
  [1, "1 note per click"],
  [2, "2 notes per click"],
  [3, "3 notes per click"],
  [4, "4 notes per click"],
]

/** A note's offset as the player reads it: "+4.2 ms", "−3.0 ms". */
export const signedMs = (ms: number): string => `${ms > 0 ? "+" : ms < 0 ? "−" : "±"}${Math.abs(ms).toFixed(1)} ms`

export const judgement = (ms: number): string => (Math.abs(ms) < 1 ? "on the beat" : ms < 0 ? "early" : "late")

/** A mic meter's fill, 0 to 1, for a peak sample from 0 to 1: empty at -60 dBFS, full at 0 dBFS. */
export const meterFill = (peak: number): number =>
  peak <= 0 ? 0 : Math.min(1, Math.max(0, 1 + (20 * Math.log10(peak)) / -METER_FLOOR_DB))

/**
 * How far either side of 0 the offset chart reaches, in ms: twice the tight
 * band at least, and otherwise the widest offset rounded up to 10 ms.
 */
export const chartRangeMs = (hits: ReadonlyArray<Hit>): number =>
  Math.max(2 * TIGHT_MS, Math.ceil(Math.max(0, ...hits.map((hit) => Math.abs(hit.offsetMs))) / 10) * 10)

const tendency = (meanMs: number): string => (Math.abs(meanMs) < 2 ? "centred" : meanMs < 0 ? "rushing" : "dragging")

const METER_FLOOR_DB = -60

const MISSED_CLICK =
  "The mic did not hear the click, so it cannot time your notes. Play the click through speakers, not headphones, and turn it up."
