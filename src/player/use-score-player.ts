import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react"
import { AlphaTabApi, PlayerMode, Settings } from "@coderline/alphatab"
import { alphaTabAssetUrls } from "../index.ts"
import { createMixer } from "../charts/score-mixer.ts"
import {
  createScorePlayer,
  DEFAULT_TRAINER,
  type ScorePlayer,
  type ScorePlayerActions,
  type ScorePlayerOptions,
  type ScorePlayerState,
  type ScoreSource,
  STANDARD_ONLY,
} from "./score-player.ts"
import { targetUsesKey } from "./keyboard.ts"

export interface UseScorePlayerOptions extends ScorePlayerOptions {
  readonly source: ScoreSource
  /**
   * Edits alphaTab's settings before the API is built: an app adds its colours, scroll element and
   * hidden elements here. The kit has already set the engine, the player and the asset URLs.
   * Only the function from the render that builds the API runs.
   */
  readonly configure?: (settings: Settings) => void
}

export interface UseScorePlayer {
  /** Attach to the element alphaTab draws into. The API exists after the first commit. */
  readonly host: RefObject<HTMLDivElement | null>
  readonly state: ScorePlayerState
  readonly actions: ScorePlayerActions
}

/**
 * Builds an `AlphaTabApi` on `host`, loads `source` and returns the controller's state and actions.
 * The API is destroyed on unmount and rebuilt when the source changes (compared by the bytes object,
 * URL or tex text, so pass the same `Uint8Array` across renders). Browser only: it reads `location`.
 */
export function useScorePlayer(options: UseScorePlayerOptions): UseScorePlayer {
  const host = useRef<HTMLDivElement>(null)
  const [player, setPlayer] = useState<ScorePlayer | null>(null)
  const latest = useRef(options)
  latest.current = options
  const { source } = options
  const identity = "bytes" in source ? source.bytes : "url" in source ? source.url : source.tex
  const kind = "bytes" in source ? "bytes" : "url" in source ? "url" : "tex"

  useEffect(() => {
    const element = host.current
    if (!element) return
    const { configure, source: current, ...initial } = latest.current
    const settings = new Settings()
    const urls = alphaTabAssetUrls()
    settings.core.engine = "svg"
    settings.core.scriptFile = urls.scriptFile
    settings.core.fontDirectory = urls.fontDirectory
    // No audio yet: the cursor and selection work, and the first play switches to the synthesizer.
    settings.player.playerMode = PlayerMode.EnabledExternalMedia
    settings.player.enableCursor = true
    settings.player.soundFont = urls.soundFont
    configure?.(settings)
    const api = new AlphaTabApi(element, settings)
    // Getters, so a callback from a later render is the one called: this controller is built once.
    const live: ScorePlayerOptions = {
      ...initial,
      get trackLabel() {
        return latest.current.trackLabel
      },
      get onMixerChange() {
        return latest.current.onMixerChange
      },
      get onZoomChange() {
        return latest.current.onZoomChange
      },
      get onNotationChange() {
        return latest.current.onNotationChange
      },
      get onPracticeTime() {
        return latest.current.onPracticeTime
      },
    }
    const created = createScorePlayer(api, live)
    setPlayer(created)
    created.load(current)
    // The host takes focus so the keys reach it. The listener sits on its parent in the capture phase, which is
    // where the app's controls live too, so a shortcut works with focus on any of them unless that control
    // uses the key itself (targetUsesKey).
    if (!element.hasAttribute("tabindex")) element.tabIndex = 0
    const keys = element.parentElement ?? element
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || targetUsesKey(event.target, event.code)) return
      if (created.handleKey(event)) event.preventDefault()
    }
    keys.addEventListener("keydown", onKeyDown, true)
    return () => {
      keys.removeEventListener("keydown", onKeyDown, true)
      created.dispose()
      api.destroy()
      setPlayer(null)
    }
  }, [kind, identity])

  const state = useSyncExternalStore(
    player?.subscribe ?? subscribeNothing,
    player?.getState ?? (() => INITIAL_STATE),
    () => INITIAL_STATE,
  )
  return { host, state, actions: player ?? INERT_ACTIONS }
}

const INITIAL_STATE: ScorePlayerState = {
  status: "loading",
  error: null,
  rendered: false,
  sound: "off",
  playing: false,
  positionMs: 0,
  endMs: 0,
  metronome: false,
  countIn: false,
  speed: 1,
  tempo: null,
  trainer: DEFAULT_TRAINER,
  tracks: [],
  track: null,
  mixer: createMixer([]),
  zoom: 1,
  notation: STANDARD_ONLY,
  selection: null,
}

const subscribeNothing = () => () => {}

const noop = () => {}

/** Stands in until the API exists, so a control can call an action on the first render. */
const INERT_ACTIONS: ScorePlayerActions = {
  play: noop,
  pause: noop,
  playPause: noop,
  stop: noop,
  seek: noop,
  setMetronome: noop,
  setCountIn: noop,
  setSpeed: noop,
  setLoop: noop,
  setLoopCount: noop,
  setStepMode: noop,
  setStepValue: noop,
  setTrack: noop,
  setMasterVolume: noop,
  setTrackVolume: noop,
  setSolo: noop,
  setMute: noop,
  setZoom: noop,
  setNotation: noop,
  clearSelection: noop,
  handleKey: () => false,
}
