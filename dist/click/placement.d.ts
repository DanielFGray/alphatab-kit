/**
 * Where a detected note starts, and the measures that placed it.
 *
 * All positions are context frames. The short windows start at `trainStart`,
 * one every `hop` frames; window w covers [trainStart + w·hop, + size).
 */
export interface Placement {
    /** The note start, or undefined when nothing in the search span rises above the sound before it. */
    readonly frame: number | undefined;
    /** The training sound is [trainStart, searchStart); the note starts in [searchStart, searchEnd). */
    readonly trainStart: number;
    readonly searchStart: number;
    readonly searchEnd: number;
    readonly size: number;
    readonly hop: number;
    /** Windows that lie wholly in the training sound. */
    readonly trainedWindows: number;
    /** The prediction error's rise over the training sound. */
    readonly error: Rise;
    /** The samples' own rise over the training sound. */
    readonly sound: Rise;
}
/**
 * How a signal rises over the training sound, per short window, in the
 * instrument bins. Each bin is compared with its loudest in the training
 * windows, so in those windows both measures are 0.
 */
export interface Rise {
    /** The mean over the bins of the dB each rises, or 0 where it does not. */
    readonly db: Float64Array;
    /** The power the bins add over their loudest. */
    readonly added: Float64Array;
}
/**
 * Places a note in a span of mic samples where a detector found it, from the
 * sound just before the span (the training sound).
 *
 * Two signals rise when a note starts. The samples themselves rise when the
 * note adds power. The prediction error of a linear predictor fitted to the
 * training sound (lpc.ts) rises when the note brings a spectrum the training
 * sound did not have, such as a legato bass note at the old note's level. This
 * follows Glover, Lazzarini & Timoney (EURASIP 2011), who detect onsets by
 * linear-prediction error. Neither covers every note: the predictor treats a
 * new note in the old note's register as it treats the old note, so in room
 * noise only the samples show it.
 *
 * Each window takes the larger dB rise of the two (Rise.db). The note's rise is
 * the first window to reach half the largest, which finds the first note of a
 * strum, not the loudest. The dB scale finds the rise; it does not time it, as
 * high bins gain many dB as soon as a window touches the attack. The added
 * power does: when power steps up, a window's added power is half the level
 * after when the window's centre is on the step. So the note starts at the
 * centre of the window where the added power of the rising signal first
 * reaches half its first peak.
 */
export declare class NotePlacer {
    readonly size: number;
    readonly hop: number;
    /** Frames of training sound. */
    readonly trainFrames: number;
    private readonly spectrum;
    private readonly isClickBin;
    private readonly instrumentBins;
    /** Bin power that counts as silence: SILENCE_DB under a full-scale sine, which reads (size / 4)² in its bin. */
    private readonly silence;
    /** `isClickBin` marks the click's bins in a spectrum of `size`, which the measures leave out. */
    constructor(sampleRate: number, size: number, hop: number, isClickBin: Uint8Array);
    /** Frames before `searchStart` that `place` reads. */
    get history(): number;
    /** Places the note that started in [searchStart, searchEnd). `read` must hold the frames from `searchStart - history`. */
    place(read: (frame: number) => number, searchStart: number, searchEnd: number): Placement;
    /**
     * Compares each bin with its loudest in the first `trained` windows. The
     * loudest absorbs a low note's ripple, which a window shorter than its period
     * sees as power rising and falling with each cycle. Averaging dB over the bins
     * lets a broadband attack count in every bin, and keeps the loud low bins from
     * outweighing the rest (SuperFlux, Böck & Widmer, DAFx-13, compares bands the
     * same way).
     */
    private rise;
}
