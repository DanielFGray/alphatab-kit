import { CLICK_ONSET_SECONDS, clickWaveform } from "./click.js";
import { Listener } from "./listener.js";
/**
 * Places a note on the nearest grid point. `atMs` is the note's time after
 * the first beat after the count-in, as the mic heard that beat.
 */
export const placeHit = (atMs, beatMs, subdivision) => {
    const stepMs = beatMs / subdivision;
    const steps = Math.round(atMs / stepMs);
    return {
        offsetMs: atMs - steps * stepMs,
        // Adding 0 turns the -0 that Math.round gives just before beat 0 into 0.
        beat: Math.floor(steps / subdivision) + 0,
        step: ((steps % subdivision) + subdivision) % subdivision,
    };
};
/**
 * The listener's delay on the clean click: the frame it reports minus the
 * frame where the click sounds (CLICK_ONSET_SECONDS into the waveform).
 * Subtracting it from each measured arrival gives the time the click sounded
 * at the mic.
 */
export const clickBias = (sampleRate) => {
    const listener = new Listener(sampleRate);
    const start = Math.round(sampleRate * 0.2);
    const signal = new Float32Array(Math.round(sampleRate * 0.6));
    signal.set(clickWaveform(sampleRate), start);
    listener.push(signal, 0);
    const arrival = listener.clickArrival(0, signal.length);
    if (arrival === undefined)
        throw new Error("the listener does not hear the clean click");
    return arrival - start - CLICK_ONSET_SECONDS * sampleRate;
};
export const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
export const TIGHT_MS = 10;
export const summarize = (hits) => {
    const count = hits.length;
    if (count === 0)
        return { count, meanMs: 0, spreadMs: 0, tight: 0 };
    const meanMs = hits.reduce((sum, hit) => sum + hit.offsetMs, 0) / count;
    const variance = hits.reduce((sum, hit) => sum + (hit.offsetMs - meanMs) ** 2, 0) / count;
    const tight = hits.filter((hit) => Math.abs(hit.offsetMs) <= TIGHT_MS).length / count;
    return { count, meanMs, spreadMs: Math.sqrt(variance), tight };
};
