import { synth, type model } from "@coderline/alphatab"
import { beatSpanOf, type BeatSpan } from "../charts/score-bars.ts"
import { barEdgeBeat, beatIndexAt, collectBeats, type NavBeat } from "../charts/score-navigation.ts"
import {
  createMixer,
  fitMixer,
  setMaster,
  setMute,
  setSolo,
  setTrackVolume,
  type Mixer,
} from "../charts/score-mixer.ts"
import { displayForWidth } from "../charts/score-layout.ts"
import { defaultNotation, staffNotation, toggleNotation, type Notation } from "../charts/score-notation.ts"
import { clampZoom } from "../charts/score-zoom.ts"
import { trackOptions, type TrackOption } from "../charts/score-tracks.ts"
import { clampSpeed, nextSpeed, type StepMode } from "../charts/speed-trainer.ts"
import type { KeyPress } from "./keyboard.ts"

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

/** The notation before a score loads: standard only, since no track is known to have strings. */
export const STANDARD_ONLY: Notation = { standard: true, tab: false }

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
  /** The score's tracks; empty until a score loads. */
  readonly tracks: ReadonlyArray<TrackOption>
  /** The index of the track drawn; null before a score loads. */
  readonly track: number | null
  /** Master volume and each track's volume, solo and mute. Holds the saved settings until a score loads. */
  readonly mixer: Mixer
  /** The user's zoom, 0.5 to 2.5. The drawn scale is this on top of a base that depends on the host's width. */
  readonly zoom: number
  /** What every track's staves show. It resets to the drawn track's default when a score loads or `setTrack` runs. */
  readonly notation: Notation
  /** The beats the playback range covers, or null for the whole score. The app words it with `selectionLabel`. */
  readonly selection: BeatSpan | null
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
  /** Draws only this track and restarts the trainer's loop count. An index outside the score is ignored. */
  setTrack: (index: number) => void
  /** Volumes are clamped to 0..1. Each mixer action calls `onMixerChange`; a track index outside the score throws a RangeError. */
  setMasterVolume: (volume: number) => void
  setTrackVolume: (track: number, volume: number) => void
  setSolo: (track: number, solo: boolean) => void
  setMute: (track: number, mute: boolean) => void
  /** Clamped to the zoom range. Redraws when the scale changes, and calls `onZoomChange`. */
  setZoom: (zoom: number) => void
  /** Flips one notation for every track and redraws. At least one stays on. Calls `onNotationChange`. */
  setNotation: (which: keyof Notation) => void
  /** Plays the whole score again: drops the playback range and the selection. */
  clearSelection: () => void
  /**
   * Handles one key press and returns true when it was a score shortcut, so the caller can `preventDefault`.
   * Space plays or pauses (Ctrl: from the start); the arrows move one beat (Ctrl: one bar); Home and End go to
   * the edge of the bar (Ctrl: of the score); Shift with a move extends the selection from the beat it began on.
   * Alt, Meta and every other key are not handled, and nothing is handled before a score is loaded.
   */
  handleKey: (key: KeyPress) => boolean
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
  /** Builds a track's label; the default is the trimmed name, or "Track n" when it is blank. */
  readonly trackLabel?: (track: PlayerTrack, index: number) => string
  /** The track drawn first. An index outside the score falls back to 0. */
  readonly defaultTrack?: number
  /** Saved settings, fitted to the score on load. Without them each track starts at its file's volume. */
  readonly mixer?: Mixer
  /** Called with the new mixer after a user action changes it, not when the load fits it. */
  readonly onMixerChange?: (mixer: Mixer) => void
  /** A saved zoom, used from the start. */
  readonly zoom?: number
  /** Called with the new zoom after `setZoom`, not when the options or a width set it. */
  readonly onZoomChange?: (zoom: number) => void
  /** A saved notation. It wins over the track's default on load; `setTrack` still resets to the default. */
  readonly notation?: Notation
  /** Called with the new notation after `setNotation`, not when a load or `setTrack` sets it. */
  readonly onNotationChange?: (notation: Notation) => void
}

/** The display settings the player writes: how large alphaTab draws, and how tightly it packs bars. */
export interface DisplaySettings {
  scale: number
  stretchForce: number
}

/** The part of an alphaTab `Staff` the controller sets. */
export interface PlayerStaff {
  readonly isStringed: boolean
  readonly isPercussion: boolean
  showStandardNotation: boolean
  showTablature: boolean
}

/** The part of an alphaTab `Track` the controller reads. */
export interface PlayerTrack {
  readonly index: number
  readonly name: string
  readonly shortName: string
  readonly isPercussion: boolean
  /** `volume` is the file's own track volume, 0 to 16; `program` is the General MIDI program. */
  readonly playbackInfo: { readonly volume: number; readonly program: number }
  readonly staves: ReadonlyArray<PlayerStaff>
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
  readonly scoreLoaded: PlayerEventOf<{ readonly tempo: number; readonly tracks: ReadonlyArray<PlayerTrack> }>
  readonly renderStarted: PlayerEventOf<boolean>
  readonly postRenderFinished: PlayerEvent
  readonly playerReady: PlayerEvent
  readonly playerStateChanged: PlayerEventOf<{ readonly state: number }>
  readonly playerPositionChanged: PlayerEventOf<{ readonly currentTime: number; readonly endTime: number }>
  /** Fires once per pass of the playing range. With `isLooping` set, each loop round fires it. */
  readonly playerFinished: PlayerEvent
  readonly error: PlayerEventOf<{ readonly message: string }>
  /** Fires when the container's width changes; alphaTab then applies `settings` and redraws once. */
  readonly resize: PlayerEventOf<{
    readonly newWidth: number
    readonly settings: { readonly display: DisplaySettings } | null
  }>
  readonly container: { readonly width: number }
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
  masterVolume: number
  /** Takes effect only once the player exists: alphaTab drops these three before `playerReady`. */
  changeTrackVolume(tracks: PlayerTrack[], volume: number): void
  changeTrackSolo(tracks: PlayerTrack[], solo: boolean): void
  changeTrackMute(tracks: PlayerTrack[], mute: boolean): void
  readonly settings: { readonly display: DisplaySettings }
  /** Applies `settings` to the renderer; it does not draw. */
  updateSettings(): void
  /** Draws the loaded score again with the current settings. */
  render(): void
  /** Draws only these tracks. The sound is unchanged: alphaTab makes the MIDI from the whole score. */
  renderTracks(tracks: PlayerTrack[]): void
  /** The tracks drawn now: the beats the keyboard moves over. */
  readonly tracks: ReadonlyArray<model.Track>
  /** The ticks the player plays; null for the whole score. Setting it fires `playbackRangeChanged`. */
  playbackRange: { readonly startTick: number; readonly endTick: number } | null
  tickPosition: number
  /** Marks a selection without playing it; `applyPlaybackRangeFromHighlight` then makes it the range. */
  highlightPlaybackRange(startBeat: model.Beat, endBeat: model.Beat): void
  applyPlaybackRangeFromHighlight(): void
  clearPlaybackRangeHighlight(): void
  scrollToCursor(): void
  /** Fires after a drag or `applyPlaybackRangeFromHighlight`, once the highlight event has told which beats. */
  readonly playbackRangeChanged: PlayerEventOf<{ readonly playbackRange: unknown }>
  /** The beats of the marked selection; both are missing when it is cleared. */
  readonly playbackRangeHighlightChanged: PlayerEventOf<{
    readonly startBeat?: model.Beat
    readonly endBeat?: model.Beat
  }>
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
 *
 * The scale is the user's zoom on the base for the host's width (`displayForWidth`); until the host's width is known
 * the base is the full-width one. A redraw happens only when the scale or stretch changed, and
 * only once a score is loaded: before that the settings are set and the first draw uses them.
 *
 * `options.trackLabel` and the `on...Change` callbacks are read when they are needed, not at creation, so a
 * caller can pass an object whose getters return its latest callbacks.
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
    tracks: [],
    track: null,
    mixer: options.mixer ?? createMixer([]),
    zoom: clampZoom(options.zoom ?? 1),
    notation: options.notation ?? STANDARD_ONLY,
    selection: null,
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
  // The loaded score's tracks, as alphaTab needs them to draw one or change its mixer.
  let scoreTracks: ReadonlyArray<PlayerTrack> = []
  // The beats of alphaTab's last highlight event: the range event that follows it names only ticks.
  let highlighted: { start: model.Beat; end: model.Beat } | null = null
  // The beat a Shift move extends from. It lasts while the selection grows; any other change drops it.
  let anchor: model.Beat | null = null
  // True while a key press makes alphaTab fire range events, so the anchor survives its own selection.
  let extendingByKey = false

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

  // Sends a mixer's track settings to alphaTab, which has them only once its player exists.
  const applyTrackMixer = (mixer: Mixer) => {
    mixer.tracks.forEach((mix, index) => {
      const track = scoreTracks[index]
      if (!track) return
      api.changeTrackVolume([track], mix.volume)
      api.changeTrackSolo([track], mix.solo)
      api.changeTrackMute([track], mix.mute)
    })
  }

  // A mixer action by the user: keep the new mixer, tell alphaTab, then tell the app so it can save it.
  const changeMixer = (next: Mixer, send: () => void) => {
    update({ mixer: next })
    send()
    options.onMixerChange?.(next)
  }

  // The host's width, from alphaTab's resize event; null while unknown, which means the full-width row.
  let width: number | null = null

  // Writes the display settings for the current width and zoom into `display`. True when they changed.
  const setDisplay = (display: DisplaySettings) => {
    const { scale, stretchForce } = displayForWidth(width ?? Number.POSITIVE_INFINITY, state.zoom)
    if (display.scale === scale && display.stretchForce === stretchForce) return false
    display.scale = scale
    display.stretchForce = stretchForce
    return true
  }

  // Sets which staves every track draws; the next draw uses it. A staff without strings keeps standard notation.
  const applyNotation = (choice: Notation) => {
    for (const track of scoreTracks) {
      for (const staff of track.staves) {
        const shown = staffNotation(staff.isStringed && !staff.isPercussion, choice)
        staff.showStandardNotation = shown.standard
        staff.showTablature = shown.tab
      }
    }
  }

  const drawTrack = (index: number) => {
    const track = scoreTracks[index]
    if (!track) return
    const notation = defaultNotation(track)
    applyNotation(notation)
    api.renderTracks([track])
    update({ track: index, notation })
  }

  // Drops the playback range, the highlight and the selection: the whole score plays again.
  const dropSelection = () => {
    anchor = null
    highlighted = null
    finishedRounds = 0
    api.playbackRange = null
    api.clearPlaybackRangeHighlight()
    update({ selection: null })
  }

  // The playable beats and the index of the one the cursor stands on; null while the score has none.
  const cursor = (): { beats: NavBeat[]; index: number } | null => {
    const beats = collectBeats(api.tracks)
    const index = beatIndexAt(beats, api.tickPosition)
    return index < 0 ? null : { beats, index }
  }

  // The first beat of the bar before or after the cursor's bar; null at the score's edge.
  const neighbourBar = (beats: NavBeat[], index: number, direction: -1 | 1): NavBeat | null => {
    const edge = barEdgeBeat(beats, index, direction === 1 ? "end" : "start")
    const next = edge ? beats[beatIndexAt(beats, edge.startTick) + direction] : undefined
    return next ? barEdgeBeat(beats, beatIndexAt(beats, next.startTick), "start") : null
  }

  // The beat a navigation key goes to; null for a key that does not move the cursor, or has nowhere to go.
  const targetOf = (key: KeyPress, beats: NavBeat[], index: number): NavBeat | null => {
    switch (key.key) {
      case "ArrowLeft":
        return key.ctrlKey ? neighbourBar(beats, index, -1) : (beats[Math.max(0, index - 1)] ?? null)
      case "ArrowRight":
        return key.ctrlKey ? neighbourBar(beats, index, 1) : (beats[Math.min(beats.length - 1, index + 1)] ?? null)
      case "Home":
        return key.ctrlKey ? (beats[0] ?? null) : barEdgeBeat(beats, index, "start")
      case "End":
        return key.ctrlKey ? (beats.at(-1) ?? null) : barEdgeBeat(beats, index, "end")
      default:
        return null
    }
  }

  // Moves the cursor to `target`. With `extend` the selection grows from the anchor to it; else the selection drops.
  const moveTo = (target: NavBeat, current: NavBeat, extend: boolean) => {
    if (extend) {
      const from = (anchor ??= current.beat)
      extendingByKey = true
      try {
        api.highlightPlaybackRange(from, target.beat)
        api.applyPlaybackRangeFromHighlight()
      } finally {
        extendingByKey = false
      }
    } else {
      dropSelection()
    }
    api.tickPosition = target.startTick
    api.scrollToCursor()
    update({ positionMs: api.timePosition })
  }

  const playFromStart = () => {
    dropSelection()
    api.stop()
    const first = collectBeats(api.tracks)[0]
    if (first) api.tickPosition = first.startTick
    else api.timePosition = 0
    api.scrollToCursor()
    update({ positionMs: api.timePosition })
    if (state.playerReady) api.play()
  }

  // alphaTab keeps these volumes and the speed until its player exists, so they can be set now.
  api.metronomeVolume = state.metronome ? 1 : 0
  api.countInVolume = state.countIn ? 1 : 0
  api.playbackSpeed = state.speed
  api.isLooping = state.trainer.loop
  // alphaTab fires its first resize inside its constructor, before this player can listen, so read the width.
  const initialWidth = api.container.width
  if (initialWidth > 0) width = initialWidth
  if (setDisplay(api.settings.display)) api.updateSettings()

  const unsubscribers = [
    // alphaTab applies these settings and redraws after the event, so this handler neither updates nor renders.
    api.resize.on((args) => {
      if (!args.settings || !(args.newWidth > 0)) return
      width = args.newWidth
      setDisplay(args.settings.display)
    }),
    api.scoreLoaded.on((score) => {
      baseTempo = score.tempo > 0 ? score.tempo : null
      scoreTracks = score.tracks
      dropSelection()
      const fileVolumes = scoreTracks.map((track) => track.playbackInfo.volume / 16)
      const mixer = options.mixer ? fitMixer(options.mixer, fileVolumes) : createMixer(fileVolumes)
      const wanted = options.defaultTrack ?? 0
      const first = Number.isInteger(wanted) && wanted >= 0 && wanted < scoreTracks.length ? wanted : 0
      api.masterVolume = mixer.master
      const drawn = scoreTracks[first]
      const notation = options.notation ?? (drawn ? defaultNotation(drawn) : state.notation)
      // alphaTab fires this event before its first draw, so the staves set here need no extra draw.
      applyNotation(notation)
      update({
        status: "ready",
        error: null,
        tempo: tempoAt(state.speed),
        tracks: trackOptions(scoreTracks, options.trackLabel),
        track: scoreTracks.length > 0 ? first : null,
        mixer,
        notation,
      })
      // alphaTab chose track 0 for this load and draws after this event. renderTracks switches the
      // track first, at the cost of one extra draw (the load still runs its own).
      if (first !== 0) api.renderTracks([scoreTracks[first]!])
    }),
    api.renderStarted.on(() => update({ rendered: false })),
    api.postRenderFinished.on(() => update({ rendered: true })),
    // alphaTab's own handler runs first and sets each track to its file's volume; ours then wins.
    api.playerReady.on(() => {
      applyTrackMixer(state.mixer)
      update({ playerReady: true })
    }),
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
    api.playbackRangeHighlightChanged.on((event) => {
      highlighted = event.startBeat && event.endBeat ? { start: event.startBeat, end: event.endBeat } : null
    }),
    api.playbackRangeChanged.on((event) => {
      // A mouse drag is no key press: the next Shift move starts from the cursor, not from an old anchor.
      if (!extendingByKey) anchor = null
      finishedRounds = 0
      // A range with no highlight is alphaTab's own reset, not a selection.
      update({ selection: event.playbackRange && highlighted ? beatSpanOf(highlighted.start, highlighted.end) : null })
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
      dropSelection()
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
    setTrack: (index) => {
      if (index === state.track) return
      dropSelection()
      drawTrack(index)
    },
    setMasterVolume: (volume) => {
      const next = setMaster(state.mixer, volume)
      changeMixer(next, () => {
        api.masterVolume = next.master
      })
    },
    setTrackVolume: (track, volume) => {
      const next = setTrackVolume(state.mixer, track, volume)
      changeMixer(next, () => api.changeTrackVolume([scoreTracks[track]!], next.tracks[track]!.volume))
    },
    setSolo: (track, solo) => {
      changeMixer(setSolo(state.mixer, track, solo), () => api.changeTrackSolo([scoreTracks[track]!], solo))
    },
    setMute: (track, mute) => {
      changeMixer(setMute(state.mixer, track, mute), () => api.changeTrackMute([scoreTracks[track]!], mute))
    },
    setZoom: (zoom) => {
      const clamped = clampZoom(zoom)
      update({ zoom: clamped })
      // alphaTab does not redraw for a settings change on its own, so a zoom update and draw is ours.
      if (setDisplay(api.settings.display)) {
        api.updateSettings()
        if (scoreTracks.length > 0) api.render()
      }
      options.onZoomChange?.(clamped)
    },
    setNotation: (which) => {
      const next = toggleNotation(state.notation, which)
      update({ notation: next })
      applyNotation(next)
      if (scoreTracks.length > 0) api.render()
      options.onNotationChange?.(next)
    },
    clearSelection: dropSelection,
    handleKey: (key) => {
      if (state.status !== "ready" || key.altKey || key.metaKey) return false
      if (key.code === "Space") {
        if (key.repeat) return true
        if (key.ctrlKey) playFromStart()
        else if (state.playerReady) api.playPause()
        return true
      }
      const here = cursor()
      const current = here?.beats[here.index]
      const target = here && targetOf(key, here.beats, here.index)
      if (!current || !target) return false
      moveTo(target, current, key.shiftKey)
      return true
    },
    dispose: () => {
      for (const unsubscribe of unsubscribers) unsubscribe()
      listeners.clear()
    },
  }
}
