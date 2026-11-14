export interface SessionPlan {
    readonly sampleRate: number;
    /** Context frame at which the first count-in click is scheduled. */
    readonly firstClick: number;
    readonly framesPerBeat: number;
    readonly countInBeats: number;
}
export type SessionEvent = 
/** `clickLeak` is the instrument-band flux of a click alone (Listener.clickLeak), reported to compare rooms and speakers. */
{
    readonly _tag: "MeasuredLatency";
    readonly latencyMs: number;
    readonly clickLeak: number;
}
/** Too few count-in clicks reached the mic to measure the latency. Notes still follow. */
 | {
    readonly _tag: "MissedClick";
}
/**
 * A note start, `atMs` after the moment the first beat after the count-in
 * was scheduled to sound. The time includes the speaker-to-mic latency:
 * subtract it to place the note against the click the player heard.
 */
 | {
    readonly _tag: "Note";
    readonly atMs: number;
}
/** The mic stream skipped `frames` frames. Notes just after the gap may be missed. */
 | {
    readonly _tag: "Dropout";
    readonly frames: number;
};
/**
 * One take: a count-in that measures the latency, then the notes played.
 *
 * During the count-in the session finds each click in the mic stream. The
 * first click heard fixes a rough latency; each later click is looked for close
 * to where that latency puts it, and the median of all of them is the latency.
 * A click can be lost, for example to a gap in the mic stream; the latency is
 * missed only when fewer than half the count-in clicks are heard, as with
 * headphones. The count-in also measures how much of each click leaks into the
 * instrument bands, which sets how far a note must rise to count
 * (Listener.clickLeak).
 *
 * Notes count from half a beat before the first beat after the count-in, as
 * the mic hears it: so a note on the count-in's last click never counts, and a
 * pickup note does. Notes heard before the count-in ends wait until it does.
 */
export declare class Session {
    private readonly plan;
    private listener;
    private readonly bias;
    private readonly latencies;
    private nextClick;
    /** The frame from which notes count, once the count-in is over. */
    private earliest;
    private readonly waiting;
    /** Arrivals of heard count-in clicks whose leak the listener cannot measure yet. */
    private readonly unmeasuredLeaks;
    private readonly clickLeaks;
    constructor(plan: SessionPlan);
    /** The context frame at which click `beat` is scheduled, the count-in's first click being 0. */
    static clickFrame(plan: SessionPlan, beat: number): number;
    hear(samples: Float32Array, start: number): Array<SessionEvent>;
    private endCountIn;
    /** The latency in frames shown by the next count-in click, once the mic has had time to hear it. */
    private measureNextClick;
    /**
     * Measures the leak of each heard count-in click once the listener has
     * analysed past it. The median keeps a stray note in the count-in from
     * raising the note threshold.
     */
    private measureLeaks;
    private clickLeak;
}
