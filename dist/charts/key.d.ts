/**
 * The musical keys a song can be written in: the 12 major and 12 minor keys.
 * A key on a black-key root is listed under both its sharp and its flat name
 * (C# and Db), so a caller can keep the spelling a song was saved with.
 */
export declare const MUSICAL_KEYS: readonly ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "Cm", "C#m", "Dbm", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gbm", "Gm", "G#m", "Abm", "Am", "A#m", "Bbm", "Bm"];
export type MusicalKey = (typeof MUSICAL_KEYS)[number];
