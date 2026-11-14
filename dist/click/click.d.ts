/**
 * The metronome click is a short tone at one pitch. The mic hears it through
 * the speakers, so the listener splits the spectrum in two: the click bands
 * hold the click, and every other band shows the instrument. The arrival is
 * found by the tone band alone, against the bands beside it (clickToneBins).
 *
 * The click bands are the tone and the harmonics a distorting speaker adds:
 * the 2nd and 3rd above it, and the low thump below it (even-order distortion
 * turns the click's envelope into a pulse under 100 Hz).
 *
 * The envelope is a Gaussian, because a Gaussian keeps the tone's energy
 * within about ±150 Hz of its pitch. A sharper attack would be easier to hear
 * as a point in time, but it spreads energy into the instrument bands, where
 * every click would then read as a note.
 */
export declare const CLICK_PITCH_HZ = 2000;
/** Half the width of each tone band. It holds the tone's spread and the analysis window's leakage. */
export declare const CLICK_BAND_HALF_WIDTH_HZ = 500;
/**
 * Seconds from the waveform's first sample to the moment the click sounds:
 * where its power reaches half its peak. A note is placed by the same rule
 * (listener.ts), so a note played with the click reads 0 ms.
 */
export declare const CLICK_ONSET_SECONDS: number;
/**
 * Beats in the count-in: whole bars, at least two of them, and at least four
 * beats, because the session needs at least four clicks to measure the
 * speaker-to-mic delay. `beatsPerBar` is a whole number from 1.
 */
export declare const countInBeats: (beatsPerBar: number) => number;
/** The first beat of each bar is accented. */
export declare const ACCENT_GAIN = 1;
export declare const BEAT_GAIN = 0.55;
/** The click waveform at peak 1: a tone under a Gaussian envelope. */
export declare const clickWaveform: (sampleRate: number) => Float32Array;
/** Marks each bin of an FFT of `size` that lies in a click band. */
export declare const clickBins: (size: number, sampleRate: number) => Uint8Array;
/**
 * The bins of an FFT of `size` where the listener looks for the click's
 * arrival: the tone band at the click's pitch, and the bands of the same
 * width on each side of it. A click adds power only in the tone band. A drum
 * or a strum adds about as much on each side, so comparing the two tells a
 * click from other sounds, even when they sound together.
 */
export declare const clickToneBins: (size: number, sampleRate: number) => {
    readonly tone: ReadonlyArray<number>;
    readonly sides: ReadonlyArray<number>;
};
