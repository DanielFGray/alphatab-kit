import { Effect, Queue, Schedule, Schema, Stream } from "effect";
import { BEATS_PER_BAR } from "../charts/take.js";
import { ACCENT_GAIN, BEAT_GAIN, CLICK_ONSET_SECONDS, clickWaveform, COUNT_IN_BEATS } from "./click.js";
import { Session } from "./session.js";
import { CAPTURE_PROCESSOR_NAME, captureWorkletUrl } from "./capture-worklet.js";
/**
 * Plays the click from the first beat of the count-in until the stream is
 * interrupted, and emits each beat as it sounds. With `listen`, it also opens
 * the mic and emits what the session hears. Interrupting the stream stops the
 * audio and closes the mic.
 */
export const clickTrack = ({ bpm, listen }) => Stream.callback((queue) => Effect.gen(function* () {
    const context = yield* Effect.acquireRelease(Effect.sync(() => new AudioContext({ latencyHint: "interactive" })), (context) => Effect.promise(() => context.close()));
    yield* attempt("The browser would not start audio.", () => context.resume());
    const sampleRate = context.sampleRate;
    const plan = {
        sampleRate,
        firstClick: Math.round((context.currentTime + START_DELAY_SECONDS) * sampleRate),
        framesPerBeat: (60 / bpm) * sampleRate,
        countInBeats: COUNT_IN_BEATS,
    };
    if (listen)
        yield* hearMic(context, plan, (event) => Queue.offerUnsafe(queue, event));
    const click = context.createBuffer(1, clickWaveform(sampleRate).length, sampleRate);
    click.copyToChannel(clickWaveform(sampleRate), 0);
    let next = 0;
    const scheduleAhead = Effect.sync(() => {
        const horizon = context.currentTime + LOOKAHEAD_SECONDS;
        for (; Session.clickFrame(plan, next) / sampleRate < horizon; next++) {
            const at = Session.clickFrame(plan, next) / sampleRate;
            const gain = context.createGain();
            gain.gain.value = CLICK_VOLUME * (next % BEATS_PER_BAR === 0 ? ACCENT_GAIN : BEAT_GAIN);
            const source = context.createBufferSource();
            source.buffer = click;
            source.connect(gain).connect(context.destination);
            // The waveform starts early, so that the click sounds at its scheduled time.
            source.start(at - CLICK_ONSET_SECONDS);
            const beat = next;
            // The beat shows when the click leaves the speakers, not when it is scheduled.
            // Older Safari has no outputLatency; the beat then shows early by that delay.
            const delay = Math.max(0, (at - context.currentTime + (context.outputLatency || 0)) * 1000);
            setTimeout(() => Queue.offerUnsafe(queue, { _tag: "Beat", beat }), delay);
        }
    });
    yield* Effect.repeat(scheduleAhead, Schedule.spaced(SCHEDULE_EVERY)).pipe(Effect.forkScoped);
})).pipe(Stream.catch((error) => Stream.succeed({ _tag: "Failed", reason: error.message })));
/**
 * Opens the mic and feeds it to a session for `plan`, on the audio thread's
 * clock. Emits the device name, the mic level about ten times a second, and
 * every session event. The mic closes when the scope does.
 */
const hearMic = (context, plan, emit) => Effect.gen(function* () {
    const mic = yield* Effect.acquireRelease(attempt("The page could not open the microphone.", () => navigator.mediaDevices.getUserMedia({
        // The browser's echo cancelling would remove the click the session listens for.
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })), (mic) => Effect.sync(() => mic.getTracks().forEach((track) => track.stop())));
    const track = mic.getAudioTracks()[0];
    // Older Safari has no outputLatency. Only some browsers give the input
    // latency, and the DOM types do not name it yet.
    const settings = track?.getSettings() ?? {};
    const inputSeconds = "latency" in settings && typeof settings.latency === "number" ? settings.latency : 0;
    const reportedSeconds = (context.outputLatency || 0) + context.baseLatency + inputSeconds;
    // The name shows the player which input the browser chose; an empty label means the default.
    emit({
        _tag: "Listening",
        device: track?.label || "the default microphone",
        reportedLatencyMs: reportedSeconds * 1000,
    });
    yield* attempt("The browser could not load the audio processor.", async () => {
        const url = captureWorkletUrl();
        try {
            await context.audioWorklet.addModule(url);
        }
        finally {
            URL.revokeObjectURL(url);
        }
    });
    const session = new Session(plan);
    // The capture node outputs silence; its link to the destination keeps the browser running it.
    const capture = new AudioWorkletNode(context, CAPTURE_PROCESSOR_NAME, { numberOfInputs: 1, numberOfOutputs: 1 });
    let peak = 0;
    let blocks = 0;
    capture.port.onmessage = (event) => {
        if (!Schema.is(CaptureBlock)(event.data))
            return;
        for (const sample of event.data.samples)
            peak = Math.max(peak, Math.abs(sample));
        if (++blocks === LEVEL_BLOCKS) {
            emit({ _tag: "Level", peak });
            peak = 0;
            blocks = 0;
        }
        try {
            for (const heard of session.hear(event.data.samples, event.data.start))
                emit(heard);
        }
        catch (cause) {
            // A fault in the analysis ends the take where the player can see it, not in silence.
            capture.port.onmessage = null;
            emit({ _tag: "Failed", reason: `The analysis stopped: ${String(cause)}` });
        }
    };
    context.createMediaStreamSource(mic).connect(capture);
    capture.connect(context.destination);
    yield* Effect.addFinalizer(() => Effect.sync(() => capture.disconnect()));
});
class AudioError extends Schema.TaggedError()("AudioError", {
    message: Schema.String,
}) {
}
/** Runs a browser call that returns a promise, and names what failed in words the player can act on. */
const attempt = (failure, run) => Effect.tryPromise({
    try: run,
    catch: (cause) => new AudioError({ message: describe(failure, cause) }),
});
const describe = (failure, cause) => {
    if (cause instanceof DOMException && cause.name === "NotAllowedError")
        return "Microphone access was refused. Allow it in the browser's site settings, then start again.";
    if (cause instanceof DOMException && cause.name === "NotFoundError")
        return "The browser found no microphone.";
    return cause instanceof Error ? `${failure} ${cause.message}` : failure;
};
const CaptureBlock = Schema.Struct({ start: Schema.Finite, samples: Schema.instanceOf(Float32Array) });
/** Time between pressing start and the first click, so the first click is never late. */
const START_DELAY_SECONDS = 0.3;
/** Clicks are scheduled this far ahead, so a slow page never makes one late. */
const LOOKAHEAD_SECONDS = 0.15;
const SCHEDULE_EVERY = "25 millis";
const CLICK_VOLUME = 0.8;
/** Mic blocks per Level event: 5 blocks of 1024 frames is about 10 a second. */
const LEVEL_BLOCKS = 5;
