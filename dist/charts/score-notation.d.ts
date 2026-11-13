/**
 * Which notation a score shows: standard notation (the five-line staff), guitar
 * tablature, or both. At least one is always on, so the score never goes blank.
 * Pure and free of the DOM, so the player and the tests share it.
 */
export type Notation = {
    standard: boolean;
    tab: boolean;
};
export declare const BOTH_NOTATIONS: Notation;
/**
 * `choice` with `which` flipped. Turning off the only notation on turns the other
 * one on, so the two swap and the score never goes blank.
 */
export declare function toggleNotation(choice: Notation, which: keyof Notation): Notation;
/**
 * What one staff shows. Only a pitched stringed instrument has tablature: a piano
 * has no strings, and a drum staff's "tab" would print MIDI note numbers. Such a
 * staff cannot follow the tab choice and keeps its standard notation whatever
 * the player chose.
 */
export declare function staffNotation(hasTab: boolean, choice: Notation): Notation;
/**
 * The notation a track shows before the user toggles anything: standard plus
 * tablature for a guitar or bass, standard alone for every other track. A file's
 * own tab setting is ignored on purpose, so every app opens the same instrument
 * with the same notation.
 *
 * Guitar and bass are told apart by General MIDI program: 24-31 are guitars,
 * 32-39 basses. Percussion never shows tab, whatever its program number.
 */
export declare function defaultNotation(track: {
    readonly isPercussion: boolean;
    readonly playbackInfo: {
        readonly program: number;
    };
}): Notation;
