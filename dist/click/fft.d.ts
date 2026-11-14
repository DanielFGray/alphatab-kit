/**
 * Power spectra of fixed-size real frames, by an in-place radix-2 FFT.
 * One instance owns its scratch buffers, so a call allocates nothing.
 */
export declare class PowerSpectrum {
    readonly size: number;
    readonly bins: number;
    private readonly window;
    private readonly re;
    private readonly im;
    private readonly cos;
    private readonly sin;
    private readonly reversed;
    constructor(size: number);
    /**
     * Writes the power of each bin of the Hann-windowed frame into `out`.
     * `read(i)` returns sample i of the frame, so the caller can read a ring buffer.
     */
    compute(read: (i: number) => number, out: Float64Array): void;
}
