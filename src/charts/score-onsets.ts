/**
 * What a score asks a player to play, in time: each moment one or more notes
 * start, with their pitches, in milliseconds from the start of a run of bars.
 * The score practice view pairs these with the notes the click engine hears.
 *
 * alphaTab's MIDI generator does the reading, so the onsets follow playback
 * exactly: repeats and alternate endings in play order, tied notes as one
 * note, grace notes before their beat, strums, and tempo changes.
 */
import { midi, type model } from "@coderline/alphatab"
import { type BarSpan, TICKS_PER_QUARTER } from "./score-bars.ts"

export type ScoreOnset = {
  /**
   * When the notes start, in ms after the first beat of the run at the
   * practice speed, like the click engine's `Note.atMs`. A strum starts at its
   * first string; a grace note before the run's first beat is negative.
   */
  readonly atMs: number
  /** The MIDI keys that start here, low to high. */
  readonly pitches: ReadonlyArray<number>
  /** How long the longest of them sounds, in ms at the practice speed; a tie lengthens it. */
  readonly durationMs: number
  /** The written beats these notes come from: one per voice and staff that plays here. */
  readonly beats: ReadonlyArray<model.Beat>
}

export type ScoreOnsetOptions = {
  /** The track's index in `score.tracks`. All its staves and voices count. */
  readonly track: number
  /**
   * Master bars, counted from 0. The run starts the first time playback
   * enters `first` and ends the first time it leaves `last`, so a repeat
   * inside the run plays as written, and a run inside a repeat plays once.
   */
  readonly bars: BarSpan
  /** The practice speed: 1 is the score's tempo, 0.5 half of it. */
  readonly speed: number
}

/** The onsets of `track` over `bars`, in play order. Empty when the run never plays. */
export function scoreOnsets(score: model.Score, { track, bars, speed }: ScoreOnsetOptions): ReadonlyArray<ScoreOnset> {
  const played = playScore(score, track)
  const slices = played.masterBars
  const from = slices.findIndex((slice) => slice.masterBar.index === bars.first)
  if (from === -1) return []
  const to = slices.findIndex((slice, i) => i >= from && slice.masterBar.index === bars.last)
  if (to === -1) return []

  const msAt = tickToMs(played.tempos)
  const zero = msAt(slices[from]!.start)
  const time = (tick: number) => (msAt(tick) - zero) / speed
  const onsets: Array<ScoreOnset> = []
  // A grace note before a bar's first beat sounds in the previous bar's slice:
  // look one slice either side, and keep the onsets whose beats belong to the run.
  for (let i = Math.max(0, from - 1); i <= Math.min(slices.length - 1, to + 1); i++) {
    const slice = slices[i]!
    for (const beatSlice of beatSlicesOf(slice)) {
      const beats = beatSlice.highlightedBeats.map((item) => item.beat).filter((beat) => trackOf(beat) === track)
      const home = beats.some((beat) => beat.voice.bar.index !== slice.masterBar.index) ? i + 1 : i
      if (beats.length === 0 || home < from || home > to) continue
      const start = slice.start + beatSlice.start
      const end = slice.start + beatSlice.end
      const notes = played.notes.filter((note) => note.start >= start && note.start < end)
      // A beat of rests or of tied notes starts nothing.
      if (notes.length === 0) continue
      const first = Math.min(...notes.map((note) => note.start))
      onsets.push({
        atMs: time(first),
        pitches: [...new Set(notes.map((note) => note.key))].sort((a, b) => a - b),
        durationMs: Math.max(...notes.map((note) => time(note.start + note.length) - time(note.start))),
        beats,
      })
    }
  }
  return onsets
}

type PlayedNote = { readonly start: number; readonly length: number; readonly key: number }
type TempoChange = { readonly tick: number; readonly bpm: number }

/** alphaTab's playback of the score: the notes of `track`, the tempo changes, and the slices in play order. */
function playScore(score: model.Score, track: number) {
  const notes: Array<PlayedNote> = []
  const tempos: Array<TempoChange> = []
  const generator = new midi.MidiFileGenerator(score, null, {
    addNote: (noteTrack, start, length, key) => {
      if (noteTrack === track) notes.push({ start, length, key })
    },
    addTempo: (tick, bpm) => {
      tempos.push({ tick, bpm })
    },
    addTimeSignature: () => {},
    addRest: () => {},
    addControlChange: () => {},
    addProgramChange: () => {},
    addNoteBend: () => {},
    addBend: () => {},
    finishTrack: () => {},
    addTickShift: () => {},
  })
  generator.generate()
  return { notes, tempos, masterBars: generator.tickLookup.masterBars }
}

/** A master bar slice's beat slices, in order. Their ticks are counted from the slice's start. */
function beatSlicesOf(slice: midi.MasterBarTickLookup): ReadonlyArray<midi.BeatTickLookup> {
  const out: Array<midi.BeatTickLookup> = []
  for (let beat = slice.firstBeat; beat !== null; beat = beat === slice.lastBeat ? null : beat.nextBeat) out.push(beat)
  return out
}

const trackOf = (beat: model.Beat): number => beat.voice.bar.staff.track.index

/** Milliseconds since tick 0 at each tick, through the tempo changes (sorted by tick, the first at 0). */
function tickToMs(tempos: ReadonlyArray<TempoChange>): (tick: number) => number {
  const changes = [...tempos].sort((a, b) => a.tick - b.tick)
  return (tick) => {
    let ms = 0
    let at = 0
    let bpm = changes[0]?.bpm ?? DEFAULT_BPM
    for (const change of changes) {
      if (change.tick >= tick) break
      ms += msOfTicks(change.tick - at, bpm)
      at = change.tick
      bpm = change.bpm
    }
    return ms + msOfTicks(tick - at, bpm)
  }
}

const msOfTicks = (ticks: number, bpm: number): number => (ticks / TICKS_PER_QUARTER) * (60_000 / bpm)

/** alphaTab's tempo for a score with no tempo marking. */
const DEFAULT_BPM = 120
