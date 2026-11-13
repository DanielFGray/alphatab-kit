/** A take carries no time signature, so its grid counts four beats to a bar. */
export declare const BEATS_PER_BAR = 4;
export type TakeOptions = {
    readonly bpm: number;
    /**
     * The click-to-recording delay expected before the notes are read, in ms:
     * measured from the count-in clicks when the microphone heard them,
     * otherwise the delay the browser reports. It decides which slot a note
     * belongs to.
     */
    readonly expectedDelayMs: number;
    /** Slots to move every note, for a take that read a slot early or late as a whole. */
    readonly shift: number;
};
export type TakeReading = {
    /** A slash staff, or null when no note was played after the count-in. */
    readonly tex: string | null;
    /** The delay the take's notes show, in ms. */
    readonly delayMs: number;
    /** Bars (0 is the phrase's first) whose notes sit between slots: `drift` is their mean distance from their slots, in slots, late positive. */
    readonly driftingBars: ReadonlyArray<{
        readonly bar: number;
        readonly drift: number;
    }>;
};
/**
 * The rhythm of a take whose notes started `notesMs` after the first beat
 * after the count-in was scheduled to sound (the click engine's Note events).
 * Its delay is the notes' common offset from the grid (their circular mean, so
 * notes on either side of a slot pull it the same way), placed in the grid
 * slot nearest the expected delay. Sounds during the count-in are not notes.
 */
export declare function readTake(notesMs: ReadonlyArray<number>, { bpm, expectedDelayMs, shift }: TakeOptions): TakeReading;
