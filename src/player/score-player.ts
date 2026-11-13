import { synth } from "@coderline/alphatab"
import { clampSpeed, nextSpeed, type StepMode } from "../charts/speed-trainer.ts"

/** Where a score comes from: file bytes, a URL alphaTab downloads, or alphaTex source. */
export type ScoreSource = { readonly bytes: Uint8Array } | { readonly url: string } | { readonly tex: string }

/** The speed trainer's settings. Each finished loop of the passage counts; after `loopCount` counts the speed steps up. */
export interface TrainerState {
  readonly loop: boolean
  readonly loopCount: number
  readonly stepMode: StepMode
  readonly stepValue: number
}

/** The trainer's defaults when the app gives no choice: one loop per step, and a 5 % step. */
export const DEFAULT_TRAINER: TrainerState = { loop: false, loopCount: 1, stepMode: "percent", stepValue: 5 }

/** What the controller shows: all of it derives from alphaTab's events and the actions below. */
export interface ScorePlayerState {
  /** `loading` until alphaTab has parsed the score; `error` after a load or render failure. */
  readonly status: "loading" | "ready" | "error"
  readonly error: string | null
  /** True once the score is drawn; false again while a redraw runs. Beat positions are valid only when true. */
  readonly rendered: boolean
  /** True once the synthesizer and sound font can play. Play does nothing before it. */
  readonly playerReady: boolean
  readonly playing: boolean
  readonly positionMs: number
  readonly endMs: number
  readonly metronome: boolean
  readonly countIn: boolean
  /** The playback speed: 1 is the score's own tempo. Always inside the range `clampSpeed` allows. */
  readonly speed: number
  /** The score's tempo at `speed`, rounded to a tenth; null when the score names none. */
  readonly tempo: number | null
  readonly trainer: TrainerState
}

/** The actions of a controller. Each is a bound function, so it can be passed on as is. */
export interface ScorePlayerActions {
  play: () => void
  pause: () => void
  playPause: () => void
  /** Stops and rewinds to the start. */
  stop: () => void
  /** Moves the playback position, clamped to the score's length once that is known. */
  seek: (ms: number) => void
  setMetronome: (on: boolean) => void
  setCountIn: (on: boolean) => void
  /** Clamped to the supported speed range. A speed the player chose restarts the trainer's loop count. */
  setSpeed: (speed: number) => void
  setLoop: (on: boolean) => void
  setLoopCount: (count: number) => void
  setStepMode: (mode: StepMode) => void
  setStepValue: (value: number) => void
}

/** A score player: a state snapshot, a subscription to its changes, and the actions. */
export interface ScorePlayer extends ScorePlayerActions {
  /** The current snapshot. It is the same object until the state changes, as `useSyncExternalStore` needs. */
  getState: () => ScorePlayerState
  /** Calls `listener` after each state change. Returns the function that removes it. */
  subscribe: (listener: () => void) => () => void
  /** Starts loading a score. Call it once, after the player is created, so no event is missed. */
  load: (source: ScoreSource) => void
  /** Removes every handler the player put on the API. It does not destroy the API: its creator does. */
  dispose: () => void
}

export interface ScorePlayerOptions {
  readonly metronome?: boolean
  readonly countIn?: boolean
  readonly speed?: number
  readonly loop?: boolean
  readonly loopCount?: number
  readonly stepMode?: StepMode
  readonly stepValue?: number
}

/** An alphaTab event without a payload, as the API exposes it. */
export interface PlayerEvent {
  on(handler: () => void): () => void
}

/** An alphaTab event with a payload. */
export interface PlayerEventOf<T> {
  on(handler: (value: T) => void): () => void
}

/**
 * The part of `AlphaTabApi` the controller touches. `AlphaTabApi` satisfies it as is; a test can pass
 * a plain object. A later feature adds the members it needs here, so this stays the smallest true list.
 */
export interface PlayerApi {
  readonly scoreLoaded: PlayerEventOf<{ readonly tempo: number }>
  readonly renderStarted: PlayerEventOf<boolean>
  readonly postRenderFinished: PlayerEvent
  readonly playerReady: PlayerEvent
  readonly playerStateChanged: PlayerEventOf<{ readonly state: number }>
  readonly playerPositionChanged: PlayerEventOf<{ readonly currentTime: number; readonly endTime: number }>
  /** Fires once per pass of the playing range. With `isLooping` set, each loop round fires it. */
  readonly playerFinished: PlayerEvent
  readonly error: PlayerEventOf<{ readonly message: string }>
  /** Returns false when alphaTab cannot read the data type. */
  load(scoreData: unknown): boolean
  tex(tex: string): void
  play(): boolean
  pause: () => void
  playPause: () => void
  stop: () => void
  timePosition: number
  metronomeVolume: number
  countInVolume: number
  playbackSpeed: number
  isLooping: boolean
}

/**
 * Drives `api`: it listens to alphaTab's events and keeps the state from them, and its actions call the API.
 *
 * Event order matters: `scoreLoaded` makes the state ready before the first draw, `renderStarted` and
 * `postRenderFinished` bracket each draw, and `playerReady` comes later and on its own timing, since the
 * sound font loads in parallel. An `error` event is final until the next `load`.
 *
 * The position comes from `playerPositionChanged` only. `stop` and `seek` set it directly, because a
 * stopped or paused player may not emit that event for the move.
 *
 * The trainer's loop count lives here, not in the state: it is progress, not a setting. Stop, seek, a
 * loop toggle and a speed the player chose restart it, so a count never carries across a jump.
 */
export function createScorePlayer(api: PlayerApi, options: ScorePlayerOptions = {}): ScorePlayer {
  let state: ScorePlayerState = {
    status: "loading",
    error: null,
    rendered: false,
    playerReady: false,
    playing: false,
    positionMs: 0,
    endMs: 0,
    metronome: options.metronome ?? false,
    countIn: options.countIn ?? false,
    speed: clampSpeed(options.speed ?? 1),
    tempo: null,
    trainer: {
      loop: options.loop ?? DEFAULT_TRAINER.loop,
      loopCount: options.loopCount ?? DEFAULT_TRAINER.loopCount,
      stepMode: options.stepMode ?? DEFAULT_TRAINER.stepMode,
      stepValue: options.stepValue ?? DEFAULT_TRAINER.stepValue,
    },
  }
  const listeners = new Set<() => void>()
  // The score's own tempo, before the speed; null until a score that names one loads.
  let baseTempo: number | null = null
  // Loops of the passage finished since the trainer's count last restarted.
  let finishedRounds = 0

  const update = (patch: Partial<ScorePlayerState>) => {
    const next = { ...state, ...patch }
    if ((Object.keys(patch) as Array<keyof ScorePlayerState>).every((key) => state[key] === next[key])) return
    state = next
    for (const listener of listeners) listener()
  }

  const fail = (message: string) => update({ status: "error", error: message })

  const tempoAt = (speed: number) => (baseTempo === null ? null : Number.parseFloat((baseTempo * speed).toFixed(1)))

  // Sets the speed in the API and the state. The trainer's loop count is the caller's to handle.
  const applySpeed = (speed: number) => {
    const clamped = clampSpeed(speed)
    api.playbackSpeed = clamped
    update({ speed: clamped, tempo: tempoAt(clamped) })
  }

  // Compares each key first, so an equal setting is silent: the trainer object is new on every change.
  const setTrainer = (patch: Partial<TrainerState>) => {
    const changed = (Object.keys(patch) as Array<keyof TrainerState>).some((key) => state.trainer[key] !== patch[key])
    if (changed) update({ trainer: { ...state.trainer, ...patch } })
  }

  // alphaTab keeps these volumes and the speed until its player exists, so they can be set now.
  api.metronomeVolume = state.metronome ? 1 : 0
  api.countInVolume = state.countIn ? 1 : 0
  api.playbackSpeed = state.speed
  api.isLooping = state.trainer.loop

  const unsubscribers = [
    api.scoreLoaded.on((score) => {
      baseTempo = score.tempo > 0 ? score.tempo : null
      update({ status: "ready", error: null, tempo: tempoAt(state.speed) })
    }),
    api.renderStarted.on(() => update({ rendered: false })),
    api.postRenderFinished.on(() => update({ rendered: true })),
    api.playerReady.on(() => update({ playerReady: true })),
    api.playerStateChanged.on((event) => update({ playing: event.state === synth.PlayerState.Playing })),
    api.playerPositionChanged.on((event) => update({ positionMs: event.currentTime, endMs: event.endTime })),
    api.playerFinished.on(() => {
      if (!state.trainer.loop) return
      finishedRounds += 1
      if (finishedRounds < Math.max(1, state.trainer.loopCount)) return
      finishedRounds = 0
      const { speed, trainer } = state
      applySpeed(nextSpeed(speed, trainer.stepMode, trainer.stepValue, baseTempo))
    }),
    api.error.on((error) => fail(error.message)),
  ]

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load: (source) => {
      update({ status: "loading", error: null, rendered: false })
      if ("tex" in source) return api.tex(source.tex)
      const accepted = api.load("bytes" in source ? source.bytes : source.url)
      if (!accepted) fail("The score viewer cannot read this file.")
    },
    play: () => {
      if (state.playerReady) api.play()
    },
    pause: () => {
      api.pause()
    },
    playPause: () => {
      if (state.playerReady) api.playPause()
    },
    stop: () => {
      api.stop()
      finishedRounds = 0
      update({ positionMs: 0 })
    },
    seek: (ms) => {
      const clamped = Math.max(0, state.endMs > 0 ? Math.min(ms, state.endMs) : ms)
      api.timePosition = clamped
      finishedRounds = 0
      update({ positionMs: clamped })
    },
    setMetronome: (on) => {
      api.metronomeVolume = on ? 1 : 0
      update({ metronome: on })
    },
    setCountIn: (on) => {
      api.countInVolume = on ? 1 : 0
      update({ countIn: on })
    },
    setSpeed: (speed) => {
      finishedRounds = 0
      applySpeed(speed)
    },
    setLoop: (on) => {
      finishedRounds = 0
      api.isLooping = on
      setTrainer({ loop: on })
    },
    setLoopCount: (count) => setTrainer({ loopCount: count }),
    setStepMode: (mode) => setTrainer({ stepMode: mode }),
    setStepValue: (value) => setTrainer({ stepValue: value }),
    dispose: () => {
      for (const unsubscribe of unsubscribers) unsubscribe()
      listeners.clear()
    },
  }
}
