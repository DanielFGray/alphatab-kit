/**
 * What a score asks a player to play, in time: each moment one or more notes
 * start, with their pitches, in milliseconds from the start of a run of bars.
 * The score practice view pairs these with the notes the click engine hears.
 *
 * alphaTab's MIDI generator does the reading, so the onsets follow playback
 * exactly: repeats and alternate endings in play order, tied notes as one
 * note, grace notes before their beat, strums, and tempo changes.
 */
import { midi } from "@coderline/alphatab";
import { TICKS_PER_QUARTER } from "./score-bars.js";
/** The onsets of `track` over `bars`, in play order. Empty when the run never plays. */
export function scoreOnsets(score, { track, bars, speed }) {
    const played = playScore(score, track);
    const slices = played.masterBars;
    const from = slices.findIndex((slice) => slice.masterBar.index === bars.first);
    if (from === -1)
        return [];
    const to = slices.findIndex((slice, i) => i >= from && slice.masterBar.index === bars.last);
    if (to === -1)
        return [];
    const msAt = tickToMs(played.tempos);
    const zero = msAt(slices[from].start);
    const time = (tick) => (msAt(tick) - zero) / speed;
    const onsets = [];
    // A grace note before a bar's first beat sounds in the previous bar's slice:
    // look one slice either side, and keep the onsets whose beats belong to the run.
    for (let i = Math.max(0, from - 1); i <= Math.min(slices.length - 1, to + 1); i++) {
        const slice = slices[i];
        for (const beatSlice of beatSlicesOf(slice)) {
            const beats = beatSlice.highlightedBeats.map((item) => item.beat).filter((beat) => trackOf(beat) === track);
            const home = beats.some((beat) => beat.voice.bar.index !== slice.masterBar.index) ? i + 1 : i;
            if (beats.length === 0 || home < from || home > to)
                continue;
            const start = slice.start + beatSlice.start;
            const end = slice.start + beatSlice.end;
            const notes = played.notes.filter((note) => note.start >= start && note.start < end);
            // A beat of rests or of tied notes starts nothing.
            if (notes.length === 0)
                continue;
            const first = Math.min(...notes.map((note) => note.start));
            onsets.push({
                atMs: time(first),
                pitches: [...new Set(notes.map((note) => note.key))].sort((a, b) => a - b),
                durationMs: Math.max(...notes.map((note) => time(note.start + note.length) - time(note.start))),
                beats,
            });
        }
    }
    return onsets;
}
/** alphaTab's playback of the score: the notes of `track`, the tempo changes, and the slices in play order. */
function playScore(score, track) {
    const notes = [];
    const tempos = [];
    const generator = new midi.MidiFileGenerator(score, null, {
        addNote: (noteTrack, start, length, key) => {
            if (noteTrack === track)
                notes.push({ start, length, key });
        },
        addTempo: (tick, bpm) => {
            tempos.push({ tick, bpm });
        },
        addTimeSignature: () => { },
        addRest: () => { },
        addControlChange: () => { },
        addProgramChange: () => { },
        addNoteBend: () => { },
        addBend: () => { },
        finishTrack: () => { },
        addTickShift: () => { },
        addMetronome: () => { },
    });
    generator.generate();
    return { notes, tempos, masterBars: generator.tickLookup.masterBars };
}
/** A master bar slice's beat slices, in order. Their ticks are counted from the slice's start. */
function beatSlicesOf(slice) {
    const out = [];
    for (let beat = slice.firstBeat; beat !== null; beat = beat === slice.lastBeat ? null : beat.nextBeat)
        out.push(beat);
    return out;
}
const trackOf = (beat) => beat.voice.bar.staff.track.index;
/** Milliseconds since tick 0 at each tick, through the tempo changes (sorted by tick, the first at 0). */
function tickToMs(tempos) {
    const changes = [...tempos].sort((a, b) => a.tick - b.tick);
    return (tick) => {
        let ms = 0;
        let at = 0;
        let bpm = changes[0]?.bpm ?? DEFAULT_BPM;
        for (const change of changes) {
            if (change.tick >= tick)
                break;
            ms += msOfTicks(change.tick - at, bpm);
            at = change.tick;
            bpm = change.bpm;
        }
        return ms + msOfTicks(tick - at, bpm);
    };
}
const msOfTicks = (ticks, bpm) => (ticks / TICKS_PER_QUARTER) * (60_000 / bpm);
/** alphaTab's tempo for a score with no tempo marking. */
const DEFAULT_BPM = 120;
