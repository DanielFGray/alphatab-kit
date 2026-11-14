import { type Take } from "./take.ts";
import type { Hit, Subdivision } from "./timing.ts";
/** Off; the click alone; or the click with the mic open, timing each note. */
export type ClickMode = "off" | "click" | "listen";
/** A microphone the browser offers. */
export interface Mic {
    readonly id: string;
    /** The browser's name for it, or a numbered stand-in before the page may read names. */
    readonly label: string;
}
export interface UseClickTrackOptions {
    readonly mode: ClickMode;
    readonly bpm: number;
    /** Clicks in a bar, a whole number from 1 (see `ClickOptions`). */
    readonly beatsPerBar: number;
    /** The grid the notes are scored against; changing it rescores the take without restarting the click. */
    readonly subdivision: Subdivision;
    /** The `Mic` to listen on; null for the browser's default. */
    readonly micId: string | null;
}
export interface UseClickTrack {
    /** The current take, or the last one after the click stops, until the next starts. */
    readonly take: Take;
    /** The take's notes against the click, once the count-in has measured the delay. */
    readonly hits: ReadonlyArray<Hit>;
    /** Every input the browser offers; empty on the server and on a page that is not secure. */
    readonly mics: ReadonlyArray<Mic>;
}
/**
 * Runs the click while `mode` is not "off", and folds what it hears into a
 * take. A change of mode, tempo, bar or mic starts a new take; leaving the
 * page stops the audio and closes the mic. Browser APIs are touched only in
 * effects, so a server render shows an empty take.
 */
export declare function useClickTrack({ mode, bpm, beatsPerBar, subdivision, micId }: UseClickTrackOptions): UseClickTrack;
/**
 * The audio inputs among `devices`, named. Before mic access a browser may
 * list inputs with an empty `deviceId`, which cannot be asked for; they are
 * left out.
 */
export declare const micsFrom: (devices: ReadonlyArray<MediaDeviceInfo>) => ReadonlyArray<Mic>;
