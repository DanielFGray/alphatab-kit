import { Effect, Queue, Schedule, Schema, Scope, Stream } from "effect"
import { ACCENT_GAIN, BEAT_GAIN, CLICK_ONSET_SECONDS, clickWaveform, countInBeats } from "./click.ts"
import { Session, type SessionEvent, type SessionPlan } from "./session.ts"
import { CAPTURE_PROCESSOR_NAME, CAPTURE_WORKLET_PATH } from "./capture-worklet.ts"

/**
 * `bpm` counts clicks, and `beatsPerBar` is the clicks in a bar, a whole
 * number from 1: the first of each bar is accented, and the count-in is
 * `countInBeats(beatsPerBar)` long. A compound meter clicks its dotted beats
 * (6/8 as 2 beats, with `Subdivision` 3 to score eighths) or every eighth
 * (6/8 as 6 beats). `listen` opens the mic and scores each note against the
 * click: the input whose `deviceId` is `micId`, or the browser's default
 * without one.
 */
export interface ClickOptions {
  readonly bpm: number
  readonly beatsPerBar: number
  readonly listen: boolean
  readonly micId?: string
}

export type ClickEvent =
  | SessionEvent
  /** A click is sounding now. Beat 0 is the first click of the count-in. */
  | { readonly _tag: "Beat"; readonly beat: number }
  | { readonly _tag: "Failed"; readonly reason: string }
  /**
   * The microphone is open; `device` is the name the browser gives it.
   * `reportedLatencyMs` is the browser's own estimate of the speaker-to-mic
   * delay. Browsers estimate it differently, and it leaves out the sound's
   * travel through the air; use it only when the mic missed the click.
   */
  | { readonly _tag: "Listening"; readonly device: string; readonly reportedLatencyMs: number }
  /** The loudest sample (0 to 1) heard since the last Level event. */
  | { readonly _tag: "Level"; readonly peak: number }

/**
 * Plays the click from the first beat of the count-in until the stream is
 * interrupted, and emits each beat as it sounds. With `listen`, it also opens
 * the mic and emits what the session hears. Interrupting the stream stops the
 * audio and closes the mic.
 */
export const clickTrack = ({ bpm, beatsPerBar, listen, micId }: ClickOptions): Stream.Stream<ClickEvent> =>
  Stream.callback<ClickEvent, AudioError>((queue) =>
    Effect.gen(function* () {
      const context = yield* Effect.acquireRelease(
        Effect.sync(() => new AudioContext({ latencyHint: "interactive" })),
        (context) => Effect.promise(() => context.close()),
      )
      yield* attempt("The browser would not start audio.", () => context.resume())
      const sampleRate = context.sampleRate
      const plan: SessionPlan = {
        sampleRate,
        firstClick: Math.round((context.currentTime + START_DELAY_SECONDS) * sampleRate),
        framesPerBeat: (60 / bpm) * sampleRate,
        countInBeats: countInBeats(beatsPerBar),
      }
      if (listen) yield* hearMic(context, plan, micId, (event) => Queue.offerUnsafe(queue, event))

      const click = context.createBuffer(1, clickWaveform(sampleRate).length, sampleRate)
      click.copyToChannel(clickWaveform(sampleRate) as Float32Array<ArrayBuffer>, 0)
      let next = 0
      const scheduleAhead = Effect.sync(() => {
        const horizon = context.currentTime + LOOKAHEAD_SECONDS
        for (; Session.clickFrame(plan, next) / sampleRate < horizon; next++) {
          const at = Session.clickFrame(plan, next) / sampleRate
          const gain = context.createGain()
          gain.gain.value = CLICK_VOLUME * (next % beatsPerBar === 0 ? ACCENT_GAIN : BEAT_GAIN)
          const source = context.createBufferSource()
          source.buffer = click
          source.connect(gain).connect(context.destination)
          // The waveform starts early, so that the click sounds at its scheduled time.
          source.start(at - CLICK_ONSET_SECONDS)
          const beat = next
          // The beat shows when the click leaves the speakers, not when it is scheduled.
          // Older Safari has no outputLatency; the beat then shows early by that delay.
          const delay = Math.max(0, (at - context.currentTime + (context.outputLatency || 0)) * 1000)
          setTimeout(() => Queue.offerUnsafe(queue, { _tag: "Beat", beat }), delay)
        }
      })
      yield* Effect.repeat(scheduleAhead, Schedule.spaced(SCHEDULE_EVERY)).pipe(Effect.forkScoped)
    }),
  ).pipe(Stream.catch((error): Stream.Stream<ClickEvent> => Stream.succeed({ _tag: "Failed", reason: error.message })))

/**
 * Opens the mic and feeds it to a session for `plan`, on the audio thread's
 * clock. Emits the device name, the mic level about ten times a second, and
 * every session event. The mic closes when the scope does.
 */
const hearMic = (
  context: AudioContext,
  plan: SessionPlan,
  micId: string | undefined,
  emit: (event: ClickEvent) => void,
): Effect.Effect<void, AudioError, Scope.Scope> =>
  Effect.gen(function* () {
    const mic = yield* Effect.acquireRelease(
      attempt("The page could not open the microphone.", async () => {
        // Browsers leave out mediaDevices on a page that is not secure (plain HTTP away from localhost).
        if (navigator.mediaDevices === undefined) throw new DOMException("no mediaDevices", "SecurityError")
        return navigator.mediaDevices.getUserMedia({
          audio: {
            ...(micId === undefined ? {} : { deviceId: { exact: micId } }),
            // The browser's echo cancelling would remove the click the session listens for.
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      }),
      (mic) => Effect.sync(() => mic.getTracks().forEach((track) => track.stop())),
    )
    const track = mic.getAudioTracks()[0]
    // Older Safari has no outputLatency. Only some browsers give the input
    // latency, and the DOM types do not name it yet.
    const settings = track?.getSettings() ?? {}
    const inputSeconds = "latency" in settings && typeof settings.latency === "number" ? settings.latency : 0
    const reportedSeconds = (context.outputLatency || 0) + context.baseLatency + inputSeconds
    // The name shows the player which input the browser chose; an empty label means the default.
    emit({
      _tag: "Listening",
      device: track?.label || "the default microphone",
      reportedLatencyMs: reportedSeconds * 1000,
    })
    yield* attempt("The browser could not load the audio processor.", () =>
      context.audioWorklet.addModule(CAPTURE_WORKLET_PATH),
    )

    const session = new Session(plan)
    // The capture node outputs silence; its link to the destination keeps the browser running it.
    const capture = new AudioWorkletNode(context, CAPTURE_PROCESSOR_NAME, { numberOfInputs: 1, numberOfOutputs: 1 })
    let peak = 0
    let blocks = 0
    capture.port.onmessage = (event: MessageEvent<unknown>) => {
      if (!Schema.is(CaptureBlock)(event.data)) return
      for (const sample of event.data.samples) peak = Math.max(peak, Math.abs(sample))
      if (++blocks === LEVEL_BLOCKS) {
        emit({ _tag: "Level", peak })
        peak = 0
        blocks = 0
      }
      try {
        for (const heard of session.hear(event.data.samples, event.data.start)) emit(heard)
      } catch (cause) {
        // A fault in the analysis ends the take where the player can see it, not in silence.
        capture.port.onmessage = null
        emit({ _tag: "Failed", reason: `The analysis stopped: ${String(cause)}` })
      }
    }
    context.createMediaStreamSource(mic).connect(capture)
    capture.connect(context.destination)
    yield* Effect.addFinalizer(() => Effect.sync(() => capture.disconnect()))
  })

class AudioError extends Schema.TaggedError<AudioError, { readonly brand: unique symbol }>()("AudioError", {
  message: Schema.String,
}) {}

/** Runs a browser call that returns a promise, and names what failed in words the player can act on. */
const attempt = <A>(failure: string, run: () => Promise<A>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new AudioError({ message: describe(failure, cause) }),
  })

const describe = (failure: string, cause: unknown): string => {
  switch (errorName(cause)) {
    case "NotAllowedError":
      return "Microphone access was refused. Allow it in the browser's site settings, then start again."
    case "NotFoundError":
      return "The browser found no microphone."
    // The only constraint that can fail is the exact deviceId: the chosen mic is gone.
    case "OverconstrainedError":
      return "The chosen microphone is not connected. Choose another, then start again."
    case "SecurityError":
      return "The browser opens the microphone only on a secure page: HTTPS, or localhost."
  }
  return cause instanceof Error ? `${failure} ${cause.message}` : failure
}

/** A browser error's name. Firefox's OverconstrainedError is not a DOMException, so read `name` from any object. */
const errorName = (cause: unknown): string | undefined =>
  typeof cause === "object" && cause !== null && "name" in cause && typeof cause.name === "string"
    ? cause.name
    : undefined

const CaptureBlock = Schema.Struct({ start: Schema.Finite, samples: Schema.instanceOf(Float32Array) })

/** Time between pressing start and the first click, so the first click is never late. */
const START_DELAY_SECONDS = 0.3
/** Clicks are scheduled this far ahead, so a slow page never makes one late. */
const LOOKAHEAD_SECONDS = 0.15
const SCHEDULE_EVERY = "25 millis"
const CLICK_VOLUME = 0.8
/** Mic blocks per Level event: 5 blocks of 1024 frames is about 10 a second. */
const LEVEL_BLOCKS = 5
