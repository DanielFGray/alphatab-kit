import { NATURALS } from "./spelling.js";
/**
 * The chord's tones as stacked whole notes on a treble staff, bottom to top.
 * Every tone in spelling.tones sounds, required and optional alike: the staff
 * is a theory picture, the same for every instrument. Degree d sits d-1
 * letter steps above the root, so 9, 11 and 13 sit above the octave; a 6th
 * spells as a 13th and so draws above the octave too. A slash bass different
 * from the root sounds first, at the nearest pitch below the root.
 */
export function staffNotes(spelling) {
    const ordered = [...spelling.tones].sort(([a], [b]) => a - b);
    const notes = ordered.map(([degree, semitones]) => toneNote(spelling, degree, semitones));
    const bass = bassNote(spelling);
    if (bass !== null)
        return [bass, ...notes];
    return notes;
}
/** The note's height in letter steps from C0: one step per line or space of the staff. */
export function staffStep(note) {
    return note.octave * 7 + indexOf(note.letter);
}
/**
 * Which side of the stem line each note sits on, bottom to top, for notes a
 * second apart. A note a step above the note below it takes the opposite side
 * from that note; a note that starts such a run takes "left"; any other note
 * is "center".
 */
export function staffSides(steps) {
    const sides = [];
    for (let i = 0; i < steps.length; i += 1) {
        if (i > 0 && steps[i] - steps[i - 1] === 1) {
            sides.push(sides[i - 1] === "left" ? "right" : "left");
        }
        else if (i + 1 < steps.length && steps[i + 1] - steps[i] === 1) {
            sides.push("left");
        }
        else {
            sides.push("center");
        }
    }
    return sides;
}
function toneNote(spelling, degree, semitones) {
    const letter = letterAbove(spelling.rootLetter, degree - 1);
    const octave = 4 + Math.floor((indexOf(spelling.rootLetter) + (degree - 1)) / 7);
    const pitchClass = (((spelling.root + semitones) % 12) + 12) % 12;
    return { letter, accidental: accidentalOf(pitchClass, letter), octave, degree };
}
function bassNote(spelling) {
    if (spelling.bass === spelling.root)
        return null;
    const bassAccidental = accidentalOf(spelling.bass, spelling.bassLetter);
    const rootPitch = pitchOf(spelling.rootLetter, accidentalOf(spelling.root, spelling.rootLetter), 4);
    let octave = 4;
    while (pitchOf(spelling.bassLetter, bassAccidental, octave) >= rootPitch)
        octave -= 1;
    let degree = null;
    for (const [candidate, semitones] of spelling.tones) {
        const pitchClass = (((spelling.root + semitones) % 12) + 12) % 12;
        if (pitchClass === spelling.bass && (degree === null || candidate < degree))
            degree = candidate;
    }
    return { letter: spelling.bassLetter, accidental: bassAccidental, octave, degree };
}
const ORDER = ["C", "D", "E", "F", "G", "A", "B"];
function indexOf(letter) {
    return ORDER.indexOf(letter);
}
function letterAbove(root, steps) {
    return ORDER[(indexOf(root) + steps) % 7];
}
function accidentalOf(pitchClass, letter) {
    const diff = pitchClass - NATURALS[letter];
    return ((((diff + 6) % 12) + 12) % 12) - 6;
}
/** Absolute pitch: letter in its octave plus its accidental, C4 as 60. */
function pitchOf(letter, accidental, octave) {
    return (octave + 1) * 12 + NATURALS[letter] + accidental;
}
