import { spell, spellNote } from "./spelling.js";
/**
 * Returns the Roman numeral for `chord` in `key`, or null when the key is null or
 * either name cannot be read.
 *
 * The degree counts semitones from the tonic against the major scale, in minor
 * keys too, so C in A minor is bIII (the rock-corpus convention). Case shows the
 * 3rd: lowercase for minor. Diminished reads °, half-diminished ø7, augmented +.
 * A slash bass that is the 3rd, 5th or 7th of a triad or seventh chord reads as
 * figured bass (V6, V65, I64); any other slash bass reads as its key degree in
 * Arabic numerals (Iadd9/3, IV/5).
 *
 * `next` is the chord that follows. A chord outside the key that resolves to it
 * (a dominant a 5th above it, or a diminished chord a half step below) reads as
 * an applied chord: A7 then D in G is V7/V. Without that resolution the chord
 * keeps its own degree, so A7 then C in G stays II7. See appliedTo.
 */
export function numeral(chord, key, next = null) {
    if (key === null)
        return null;
    const scale = keyScale(key);
    const spelling = spell(chord);
    if (scale === null || spelling === null)
        return null;
    const target = next === null ? null : spell(next);
    const applied = target === null ? null : appliedTo(spelling, target, scale);
    if (applied !== null)
        return label(chord, spelling, applied.root, null) + "/" + applied.numeral;
    return label(chord, spelling, scale.tonic, scale.tonic);
}
/**
 * The numeral of each of `chords`, given in reading order. Each is read against
 * the next chord with another name, so an applied chord shows as one.
 */
export function chordNumerals(chords, key) {
    const labels = [];
    let next = null;
    for (let index = chords.length - 1; index >= 0; index -= 1) {
        const following = chords[index + 1];
        // A repeat of the same chord shares the next chord of the one after it.
        if (following !== undefined && following !== chords[index])
            next = following;
        labels[index] = numeral(chords[index], key, next);
    }
    return labels;
}
/**
 * Reads a key name ("G", "F#m"). A minor key holds the natural minor scale plus
 * the raised 7th, so its V and vii° are in the key, as in harmonic minor.
 */
export function keyScale(key) {
    const minor = key.endsWith("m");
    const tonic = spell(minor ? key.slice(0, -1) : key)?.root;
    if (tonic === undefined)
        return null;
    const steps = minor ? [0, 2, 3, 5, 7, 8, 10, 11] : [0, 2, 4, 5, 7, 9, 11];
    return { tonic, minor, pitches: new Set(steps.map((step) => (tonic + step) % 12)) };
}
/** True when every note of the chord is in the key. */
export function inKey(spelling, scale) {
    return [...spelling.tones.values()].every((semitones) => scale.pitches.has((spelling.root + semitones) % 12));
}
/** Roman numeral names for each semitone above the tonic. */
export const DEGREE_NAME = ["I", "bII", "II", "bIII", "III", "IV", "#IV", "V", "bVI", "VI", "bVII", "VII"];
/** Letters above the tonic's letter for each numeral. */
export const ROMAN_STEP = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 };
/** The note at `pitch` as the key spells its degree (`DEGREE_NAME`): Db in Ab, A# in E, Bb in C. */
export function noteInKey(pitch, key) {
    const scale = keyScale(key);
    if (!scale)
        return spellNote(pitch, 0, "C");
    const degree = DEGREE_NAME[(pitch - scale.tonic + 12) % 12];
    return spellNote(pitch, ROMAN_STEP[degree.replace(/[b#]/, "")], key);
}
/** Scale degrees in Arabic numerals for each semitone above the tonic, for a slash bass. */
const BASS_DEGREE = ["1", "b2", "2", "b3", "3", "4", "#4", "5", "b6", "6", "b7", "7"];
/**
 * The chord `chord` is applied to, when it is one: it is outside the key, and it
 * is a major or dominant-7th chord a 5th above `target`'s root, or a diminished
 * chord a half step below it. Its slash bass, if any, must be one of its tones.
 *
 * The target counts by its root, which must be a degree of the key's own scale
 * (major, or natural minor) other than the tonic and must not carry a diminished
 * triad there. So a chain of dominants reads as one: E7 A7 D7 G in C is
 * V7/vi V7/ii V7/V V. The target is named by its own triad when it is in the
 * key, else by the scale's triad on its root. The tonic in second inversion (the
 * cadential 6-4) works as V, so F#°7 then C/G in C is vii°7/V.
 */
function appliedTo(chord, target, scale) {
    if (inKey(chord, scale) || inversion(chord) === null)
        return null;
    const cadential = target.root === scale.tonic && inversion(target) === 2;
    const root = cadential ? (scale.tonic + 7) % 12 : target.root;
    const triad = scaleTriad(root, scale);
    if (root === scale.tonic || triad === null || triad.endsWith("°"))
        return null;
    const third = chord.tones.get(3);
    const fifth = chord.tones.get(5);
    const seventh = chord.tones.get(7);
    const interval = (chord.root - root + 12) % 12;
    const dominant = third === 4 && fifth !== 6 && fifth !== 8 && (seventh === undefined || seventh === 10);
    const leading = third === 3 && fifth === 6;
    if (!(dominant && interval === 7) && !(leading && interval === 11))
        return null;
    const numeral = cadential ? "V" : inKey(target, scale) ? triadNumeral(target, scale.tonic) : triad;
    return { root, numeral };
}
/** The triad the key's own scale (major, or natural minor) builds on `root`, as a numeral; null when `root` is off the scale. */
function scaleTriad(root, scale) {
    const steps = scale.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const natural = new Set(steps.map((step) => (scale.tonic + step) % 12));
    if (!natural.has(root))
        return null;
    const name = DEGREE_NAME[(root - scale.tonic + 12) % 12];
    if (natural.has((root + 4) % 12))
        return name;
    return natural.has((root + 7) % 12) ? name.toLowerCase() : `${name.toLowerCase()}°`;
}
/** A chord's own triad as a numeral: V, vi, ii°. */
function triadNumeral(target, tonic) {
    const name = DEGREE_NAME[(target.root - tonic + 12) % 12];
    const third = target.tones.get(3);
    if (third !== 3)
        return name;
    return target.tones.get(5) === 6 ? `${name.toLowerCase()}°` : name.toLowerCase();
}
/**
 * The numeral of `chord` counted from `from`. `keyTonic` names the key degree of a
 * slash bass that is not a chord tone; it is null for an applied chord, which
 * appliedTo only accepts with a chord tone in the bass.
 */
function label(chord, spelling, from, keyTonic) {
    const degree = DEGREE_NAME[(spelling.root - from + 12) % 12];
    const minorThird = spelling.tones.get(3) === 3;
    const cased = minorThird ? degree.toLowerCase() : degree;
    const { mark, rest } = quality(suffixOf(chord), spelling);
    const position = inversion(spelling);
    if (position === 0 || (position === null && keyTonic === null))
        return cased + mark + rest;
    const figured = position === null ? null : figure(rest, position);
    if (figured !== null)
        return cased + mark + figured;
    return `${cased}${mark}${rest}/${BASS_DEGREE[(spelling.bass - keyTonic + 12) % 12]}`;
}
/**
 * Turns the start of a suffix into a quality mark: `dim` into °, `dim7` into °7,
 * `m7b5` into ø7, `aug` into +. The minor marker is already gone (case shows it).
 * The rest of the suffix is kept as written.
 */
function quality(suffix, spelling) {
    const minorThird = spelling.tones.get(3) === 3;
    const take = (pattern, mark) => {
        const found = suffix.match(pattern);
        return found ? { mark, rest: suffix.slice(found[0].length) } : null;
    };
    return (take(/^(dim7|°7|o7)/, "°7") ??
        take(/^ø7?/, "ø7") ??
        (minorThird ? take(/^7(b5|-5|\(b5\))/, "ø7") : null) ??
        take(/^(dim|°|o)(?!m)/, "°") ??
        take(/^(aug|\+)(?![0-9])/, "+") ?? { mark: "", rest: suffix });
}
/**
 * Which chord tone the bass is: 0 root, 1 the 3rd (or the tone a sus puts in its
 * place), 2 the 5th, 3 the 7th. Null when the bass is not a chord tone.
 */
function inversion(spelling) {
    const above = (spelling.bass - spelling.root + 12) % 12;
    if (above === 0)
        return 0;
    const thirdTone = spelling.tones.get(3) ?? spelling.tones.get(4) ?? spelling.tones.get(2);
    if (above === thirdTone)
        return 1;
    if (above === spelling.tones.get(5))
        return 2;
    if (above === spelling.tones.get(7))
        return 3;
    return null;
}
/**
 * Figured bass for a triad (6, 64) or a seventh chord (65, 43, 42) in inversion.
 * Null when the suffix names more than a triad or a seventh, or the bass is the
 * 7th of a chord written without one.
 */
function figure(rest, position) {
    if (rest === "" && position < 3)
        return ["", "6", "64"][position];
    const seventh = rest.match(/^(maj|M|Δ)?7$/);
    if (seventh === null)
        return null;
    return (seventh[1] === undefined ? "" : "maj") + ["7", "65", "43", "42"][position];
}
/**
 * The part of a chord name between the root and any slash bass, without a leading
 * minor marker (`m` or `min`, but not the `m` of `maj`).
 */
function suffixOf(chord) {
    const rootEnd = chord.match(/^[A-G][#b♯♭]*/)?.[0].length ?? 0;
    const slash = chord.search(/\/[A-G][#b♯♭]*$/);
    const suffix = chord.slice(rootEnd, slash >= rootEnd ? slash : chord.length);
    if (suffix.startsWith("min"))
        return suffix.slice(3);
    if (suffix.startsWith("mi"))
        return suffix.slice(2);
    // `Cmadd9` is Cm(add9), as spell reads it.
    if (suffix.startsWith("m") && (!suffix.startsWith("ma") || suffix.startsWith("madd")))
        return suffix.slice(1);
    // `-5` and `-9` lower a tone; a `-` before anything else is the minor marker.
    if (suffix.startsWith("-") && !/^-(5|9|11|13)/.test(suffix))
        return suffix.slice(1);
    return suffix;
}
