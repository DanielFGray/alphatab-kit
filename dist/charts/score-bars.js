/** The playback range of a run of bars, from the first bar's start to the last bar's end. */
export function ticksOfBars(bars, span) {
    return { startTick: bars[span.first].start, endTick: bars[span.last].end };
}
/** Each master bar's span in ticks, from alphaTab's model. */
export function barTicksOf(masterBars) {
    return masterBars.map((bar) => ({ start: bar.start, end: bar.start + bar.calculateDuration() }));
}
/** The bars a beat selection touches: a selection that covers part of a bar counts that whole bar. */
export function barsOfBeatSpan(span) {
    return { first: span.first.bar, last: span.last.bar };
}
/**
 * The tempo in effect at the start of bar `index`: the nearest tempo marking at or before that bar, since a
 * tempo change is stored on the bar that makes it. Null when no bar up to it has one.
 */
export function tempoAtBar(bars, index) {
    for (let i = Math.min(index, bars.length - 1); i >= 0; i--) {
        const value = bars[i].tempoAutomations[0]?.value;
        if (value !== undefined && value > 0)
            return value;
    }
    return null;
}
/** A span written for a reader, which counts bars from 1: "Bar 3" or "Bars 3–4". */
export function barsLabel(span) {
    return span.first === span.last ? `Bar ${span.first + 1}` : `Bars ${span.first + 1}–${span.last + 1}`;
}
/** Whether two spans name the same bars. Two nulls are the same: no selection. */
export function sameBars(a, b) {
    return a === b || (a !== null && b !== null && a.first === b.first && a.last === b.last);
}
/** The span from a selection's first beat to its last. The beat count is what tells the last beat of a bar from a middle one. */
export function beatSpanOf(startBeat, endBeat) {
    return { first: placeOf(startBeat), last: placeOf(endBeat) };
}
/**
 * A beat span written for a reader, counting bars and beats from 1. A span
 * that starts on a bar's first beat and ends on its last reads as bars ("Bar 3",
 * "Bars 3–5"); any other span names its beats ("Bar 3, beats 1–2").
 */
export function selectionLabel(span) {
    const { first, last } = span;
    if (first.beat === 0 && last.beat === last.beatCount - 1) {
        return barsLabel({ first: first.bar, last: last.bar });
    }
    if (first.bar !== last.bar) {
        return `${barLabel(first.bar)} beat ${first.beat + 1} – ${barLabel(last.bar)} beat ${last.beat + 1}`;
    }
    const beats = first.beat === last.beat ? `beat ${first.beat + 1}` : `beats ${first.beat + 1}–${last.beat + 1}`;
    return `${barLabel(first.bar)}, ${beats}`;
}
function barLabel(bar) {
    return barsLabel({ first: bar, last: bar });
}
function placeOf(beat) {
    return { bar: beat.voice.bar.masterBar.index, beat: beat.index, beatCount: beat.voice.beats.length };
}
/** Whether two selections name the same beats. Two nulls are the same: no selection. */
export function sameBeats(a, b) {
    return a === b || (a !== null && b !== null && samePlace(a.first, b.first) && samePlace(a.last, b.last));
}
function samePlace(a, b) {
    return a.bar === b.bar && a.beat === b.beat && a.beatCount === b.beatCount;
}
