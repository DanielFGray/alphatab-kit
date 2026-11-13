/** A bar's span in MIDI ticks: `start` is inclusive, `end` is where the next bar starts. */
export type BarTicks = { readonly start: number; readonly end: number }

/** A run of bars, counted from 0, with both ends inclusive. */
export type BarSpan = { readonly first: number; readonly last: number }

/**
 * The bars a playback range covers: from the bar its start falls in through the
 * bar its end falls in. The end is exclusive, so a range that ends where a bar
 * begins does not take that bar.
 */
export function barsOfTicks(bars: ReadonlyArray<BarTicks>, startTick: number, endTick: number): BarSpan {
  const first = Math.max(0, bars.findLastIndex((bar) => bar.start <= startTick))
  const last = Math.max(first, bars.findLastIndex((bar) => bar.start < endTick))
  return { first, last }
}

/** The playback range of a run of bars, from the first bar's start to the last bar's end. */
export function ticksOfBars(bars: ReadonlyArray<BarTicks>, span: BarSpan): { startTick: number; endTick: number } {
  return { startTick: bars[span.first]!.start, endTick: bars[span.last]!.end }
}

/** Each master bar's span in ticks, from alphaTab's model. */
export function barTicksOf(masterBars: ReadonlyArray<{ readonly start: number; calculateDuration(): number }>): Array<BarTicks> {
  return masterBars.map((bar) => ({ start: bar.start, end: bar.start + bar.calculateDuration() }))
}

/**
 * The bars a drag selected, given the playback range alphaTab now holds. The
 * drawn bars are the range a view plays by default, so that range is no
 * selection, and neither is no range at all.
 */
export function selectedBars(
  bars: ReadonlyArray<BarTicks>,
  playbackRange: { readonly startTick: number; readonly endTick: number } | null,
  drawn: BarSpan | null,
): BarSpan | null {
  if (!playbackRange) return null
  const span = barsOfTicks(bars, playbackRange.startTick, playbackRange.endTick)
  return drawn && drawn.first === span.first && drawn.last === span.last ? null : span
}

/** A span written for a reader, which counts bars from 1: "Bar 3" or "Bars 3–4". */
export function barsLabel(span: BarSpan): string {
  return span.first === span.last ? `Bar ${span.first + 1}` : `Bars ${span.first + 1}–${span.last + 1}`
}

/** Whether two spans name the same bars. Two nulls are the same: no selection. */
export function sameBars(a: BarSpan | null, b: BarSpan | null): boolean {
  return a === b || (a !== null && b !== null && a.first === b.first && a.last === b.last)
}

/** A selected beat's place: its bar and its beat inside its voice, both counted from 0, and how many beats the voice holds. */
export type BeatPlace = { readonly bar: number; readonly beat: number; readonly beatCount: number }

/** A selection by beat: the first and the last beat it covers, both inclusive. */
export type BeatSpan = { readonly first: BeatPlace; readonly last: BeatPlace }

/** The part of alphaTab's beat model a selection reads. */
type BeatLike = {
  readonly index: number
  readonly voice: { readonly beats: ReadonlyArray<unknown>; readonly bar: { readonly masterBar: { readonly index: number } } }
}

/** The span from a selection's first beat to its last. The beat count is what tells the last beat of a bar from a middle one. */
export function beatSpanOf(startBeat: BeatLike, endBeat: BeatLike): BeatSpan {
  return { first: placeOf(startBeat), last: placeOf(endBeat) }
}

/**
 * A beat span written for a reader, counting bars and beats from 1. A span
 * that starts on a bar's first beat and ends on its last reads as bars ("Bar 3",
 * "Bars 3–5"); any other span names its beats ("Bar 3, beats 1–2").
 */
export function selectionLabel(span: BeatSpan): string {
  const { first, last } = span
  if (first.beat === 0 && last.beat === last.beatCount - 1) {
    return barsLabel({ first: first.bar, last: last.bar })
  }
  if (first.bar !== last.bar) {
    return `${barLabel(first.bar)} beat ${first.beat + 1} – ${barLabel(last.bar)} beat ${last.beat + 1}`
  }
  const beats = first.beat === last.beat ? `beat ${first.beat + 1}` : `beats ${first.beat + 1}–${last.beat + 1}`
  return `${barLabel(first.bar)}, ${beats}`
}

function barLabel(bar: number): string {
  return barsLabel({ first: bar, last: bar })
}

function placeOf(beat: BeatLike): BeatPlace {
  return { bar: beat.voice.bar.masterBar.index, beat: beat.index, beatCount: beat.voice.beats.length }
}
