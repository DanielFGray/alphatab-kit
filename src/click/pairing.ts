import { MERGE_SECONDS } from "./listener.ts"

/**
 * Scoring a take against written notes: each written onset (a moment the
 * score asks for one or more notes, such as `ScoreOnset`) is paired with the
 * note the player played for it, so the score itself says which beat a note
 * aimed at. Rests, ties and syncopation need no grid.
 *
 * The listener hears notes that start within MERGE_SECONDS of each other as
 * one, timed at the first of them or at the loudest. So written onsets that
 * close (a grace note and its beat, a flam) form one group: they share one
 * played note, timed from the onset in the group it lands nearest.
 *
 * Each group reaches halfway to its neighbours, and no further than
 * MAX_REACH_MS. The reaches do not overlap, so a played note belongs to one
 * group at most, and the pairs keep their order. Within a reach the played
 * note closest to the group is the one played for it; other notes there are
 * extra, and a group with no note in its reach was missed.
 *
 * Fixed reaches assume the player is off by less than half the gap between
 * notes: 16th notes at 200 BPM are 75 ms apart, so a note 40 ms late is paired
 * with the next onset, as 35 ms early.
 */

/** One written onset and the note played for it. */
export type PairedOnset<Written> = {
  readonly written: Written
  /** The played note, or null when the player missed this onset. Onsets in one group share it. */
  readonly played: PlayedNote | null
}

export type PlayedNote = {
  readonly atMs: number
  /** How far the note lands from the nearest written onset of its group: negative is early. */
  readonly offsetMs: number
}

export type Pairing<Written> = {
  /** Every written onset in order, each with its played note or null. */
  readonly onsets: ReadonlyArray<PairedOnset<Written>>
  /** Each played note paired with a group, once, in order: what `summarize` and the offset chart take. */
  readonly hits: ReadonlyArray<PlayedNote>
  /** Played notes that no written onset asked for, as their `atMs`. */
  readonly extra: ReadonlyArray<number>
}

/** A note further than this from every written onset is an extra note, not a late or early one. */
export const MAX_REACH_MS = 250

/**
 * Pairs the notes a player played, at `playedMs` after the first written beat
 * as the player heard it (a take's note times minus its measured latency), with
 * the `written` onsets, at their `atMs` on the same clock. Both are in time order.
 */
export function pairTake<Written extends { readonly atMs: number }>(
  playedMs: ReadonlyArray<number>,
  written: ReadonlyArray<Written>,
): Pairing<Written> {
  const { groups, groupOf } = groupsOf(written.map((onset) => onset.atMs))
  const reaches = groups.map((group, g) => reachOf(group, groups[g - 1], groups[g + 1]))
  const owners = playedMs.map((atMs) => {
    const g = reaches.findIndex((reach) => atMs < reach.to)
    return g !== -1 && atMs >= reaches[g]!.from ? g : null
  })
  const chosen = groups.map((group, g) =>
    playedMs.reduce<number | null>(
      (best, atMs, i) =>
        owners[i] === g && (best === null || distance(atMs, group) < distance(playedMs[best]!, group)) ? i : best,
      null,
    ),
  )
  const notes = chosen.map((i, g) => (i === null ? null : playedNote(playedMs[i]!, groups[g]!)))
  const used = new Set(chosen)
  return {
    onsets: written.map((onset, j) => ({ written: onset, played: notes[groupOf[j]!]! })),
    hits: notes.filter((note) => note !== null),
    extra: playedMs.filter((_, i) => !used.has(i)),
  }
}

/** Written times that the listener hears as one note: each within MERGE_SECONDS of the group's first. */
type Group = ReadonlyArray<number>

/** The written times split into groups, and each written onset's group index. */
function groupsOf(writtenMs: ReadonlyArray<number>) {
  const groups: Array<Array<number>> = []
  const groupOf = writtenMs.map((atMs) => {
    const last = groups.at(-1)
    if (last === undefined || atMs - last[0]! >= MERGE_SECONDS * 1000) groups.push([atMs])
    else last.push(atMs)
    return groups.length - 1
  })
  return { groups: groups as ReadonlyArray<Group>, groupOf }
}

/**
 * Where a group's played note may land: from halfway after the previous group
 * (inclusive) to halfway before the next (exclusive), and at most MAX_REACH_MS
 * outside the group.
 */
function reachOf(group: Group, before: Group | undefined, after: Group | undefined) {
  const first = group[0]!
  const last = group.at(-1)!
  return {
    from: Math.max(first - MAX_REACH_MS, before === undefined ? -Infinity : (before.at(-1)! + first) / 2),
    to: Math.min(last + MAX_REACH_MS, after === undefined ? Infinity : (last + after[0]!) / 2),
  }
}

const playedNote = (atMs: number, group: Group): PlayedNote => ({ atMs, offsetMs: atMs - nearest(atMs, group) })

const distance = (atMs: number, group: Group): number => Math.abs(atMs - nearest(atMs, group))

const nearest = (atMs: number, group: Group): number =>
  group.reduce((best, onsetMs) => (Math.abs(atMs - onsetMs) < Math.abs(atMs - best) ? onsetMs : best))
