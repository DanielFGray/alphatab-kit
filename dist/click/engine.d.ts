import { Stream } from "effect";
import { type SessionEvent } from "./session.ts";
/**
 * `bpm` counts clicks, and `beatsPerBar` is the clicks in a bar, a whole
 * number from 1: the first of each bar is accented, and the count-in is
 * `countInBeats(beatsPerBar)` long. A compound meter clicks its dotted beats
 * (6/8 as 2 beats, with `Subdivision` 3 to score eighths) or every eighth
 * (6/8 as 6 beats). `listen` opens the mic and scores each note against the
 * click.
 */
export interface ClickOptions {
    readonly bpm: number;
    readonly beatsPerBar: number;
    readonly listen: boolean;
}
export type ClickEvent = SessionEvent
/** A click is sounding now. Beat 0 is the first click of the count-in. */
 | {
    readonly _tag: "Beat";
    readonly beat: number;
} | {
    readonly _tag: "Failed";
    readonly reason: string;
}
/**
 * The microphone is open; `device` is the name the browser gives it.
 * `reportedLatencyMs` is the browser's own estimate of the speaker-to-mic
 * delay. Browsers estimate it differently, and it leaves out the sound's
 * travel through the air; use it only when the mic missed the click.
 */
 | {
    readonly _tag: "Listening";
    readonly device: string;
    readonly reportedLatencyMs: number;
}
/** The loudest sample (0 to 1) heard since the last Level event. */
 | {
    readonly _tag: "Level";
    readonly peak: number;
};
/**
 * Plays the click from the first beat of the count-in until the stream is
 * interrupted, and emits each beat as it sounds. With `listen`, it also opens
 * the mic and emits what the session hears. Interrupting the stream stops the
 * audio and closes the mic.
 */
export declare const clickTrack: ({ bpm, beatsPerBar, listen }: ClickOptions) => Stream.Stream<ClickEvent>;
