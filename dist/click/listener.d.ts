import { type Placement } from "./placement.ts";
/**
 * Finds note starts and click arrivals in a mic stream.
 *
 * The spectrum is split into click bands and instrument bands (see click.ts).
 * A note is first detected, then placed:
 *
 * - Detection is SuperFlux (Böck & Widmer, DAFx-13), as its reference
 *   implementation SuperFlux.py runs offline: long windows (about 43 ms), the
 *   magnitude spectrum pooled into 24 bands per octave and compressed as
 *   log10(1 + magnitude), and the summed rise of each band over the loudest of
 *   its three neighbours two frames earlier, so vibrato makes no onset. A
 *   peak is a note when it is the largest from 10 ms before to 70 ms after it,
 *   and rises DELTA over twice the median of the 150 ms before it (Böck,
 *   Krebs & Schedl, ISMIR 2012, with the median of Bello et al. 2005). Only
 *   the instrument bands count, and in a room where the mic hears the click,
 *   a peak must also clear what a click alone leaks into them (clickLeak).
 *
 *   The reference reads files at a normal recording level, and its
 *   thresholds assume that level. A mic has any gain, so before the log each
 *   window is scaled so that the loudest band of the last few seconds reads
 *   LOUDEST_BAND. The flux is then the same at any input gain.
 * - Placement looks for the note start in the span the detecting windows
 *   cover, in short windows (about 5 ms): where the sound, or the error of a
 *   linear predictor fitted to the sound before, first rises (placement.ts).
 *
 * The papers are in ATTRIBUTIONS.md.
 *
 * A click arrival is where the power added in the click's tone band, less what
 * the bands beside it add (clickToneBins), crosses half its peak. That carries
 * a small fixed bias, which the session measures on the clean click and removes.
 *
 * All times are context frames: sample indices on the AudioContext clock.
 */
export declare class Listener {
    readonly sampleRate: number;
    private readonly fine;
    private readonly coarse;
    private readonly isClickBin;
    /** Where the click's arrival is looked for (clickToneBins). */
    private readonly toneBins;
    /** Fine power spectra, kept to place clicks, indexed by fine frame modulo their count. */
    private readonly spectra;
    /** Instrument bands of the long windows (see logBands). */
    private readonly bands;
    /** The band magnitudes of the last lag + 1 long windows, indexed by coarse frame modulo their count. */
    private readonly bandSpectra;
    /** Each long window's loudest band magnitude over the last LEVEL_SECONDS, indexed by coarse frame modulo their count. */
    private readonly loudestBands;
    private readonly coarsePower;
    private readonly ring;
    private readonly mask;
    private readonly peakBefore;
    private readonly merge;
    private readonly medianBefore;
    private readonly recent;
    private readonly leakRadius;
    private readonly placer;
    private origin;
    /** Context frame one past the last sample received. */
    private received;
    private readonly clickFlux;
    private readonly detection;
    private nextCandidate;
    private lastOnset;
    /**
     * The instrument-band flux that a click alone makes in this room, which the
     * session measures during the count-in. A note must rise to
     * CLICK_LEAK_MARGIN times this: a speaker spreads some of every click into
     * the instrument bands, and in a quiet room that alone would read as a note.
     */
    clickLeak: number;
    constructor(sampleRate: number);
    /**
     * Adds the next block of mic samples, which starts at context frame `start`,
     * and returns the notes it completes. A note is reported about 100 ms after it
     * starts, once the frames after it have arrived.
     */
    push(samples: Float32Array, start: number): Array<Placement>;
    /**
     * The context frame at which a click in [from, to) arrived, or undefined
     * when no click there stands clearly above the sound before it.
     */
    clickArrival(from: number, to: number): number | undefined;
    /**
     * The largest detection flux within the peak radius of a click that arrived
     * at context frame `arrival`; undefined until the listener has analysed past it.
     */
    leakAt(arrival: number): number | undefined;
    /** The context frame the next mic block must start at; NaN before the first block. */
    get expects(): number;
    /** The last context frame that `clickArrival` can search up to. */
    get analysedUpTo(): number;
    private analyseFine;
    private analyseCoarse;
    private pickOnsets;
    /**
     * SuperFlux's peak picking: the largest flux from PEAK_BEFORE_SECONDS before
     * to MERGE_SECONDS after, and DELTA over MEDIAN_WEIGHT times the median of
     * the MEDIAN_BEFORE_SECONDS up to it. Looking ahead lets the loudest of two
     * close rises win, such as a note just after the noise of the last one
     * being stopped.
     */
    private isDetectionPeak;
    /**
     * Places a click near fine frame `near`: the fractional fine frame where the
     * click-band energy added over the spectrum two windows earlier crosses half its peak.
     */
    private placeClick;
    /**
     * The power `power` adds over `reference` in the click's tone band, less
     * what it adds in the bands beside it (clickToneBins). A click shows here;
     * a sound that rises across the spectrum, such as a drum, cancels out.
     */
    private toneRise;
    private reader;
    private frameStart;
    /** The context frame at the centre of a frame, which may be fractional. */
    private contextFrameAt;
    private fineIndexAt;
    private coarseFramesIn;
}
/**
 * A note is the largest rise from PEAK_BEFORE_SECONDS before it to this long
 * after it, and a rise this soon after a note is part of that note. A strum or
 * a slow attack rises for up to about 60 ms; 16th notes at 200 BPM are 75 ms
 * apart. The reference looks 50 ms ahead and merges 30 ms, which splits a strum
 * into two notes.
 */
export declare const MERGE_SECONDS = 0.07;
