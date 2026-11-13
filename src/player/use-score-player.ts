import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react"
import { AlphaTabApi, Settings } from "@coderline/alphatab"
import { alphaTabAssetUrls } from "../index.ts"
import {
  createScorePlayer,
  DEFAULT_TRAINER,
  type ScorePlayer,
  type ScorePlayerActions,
  type ScorePlayerOptions,
  type ScorePlayerState,
  type ScoreSource,
} from "./score-player.ts"

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
    settings.player.enablePlayer = true
    settings.player.enableCursor = true
    settings.player.soundFont = urls.soundFont
    configure?.(settings)
    const api = new AlphaTabApi(element, settings)
    const created = createScorePlayer(api, initial)
    setPlayer(created)
    created.load(current)
    return () => {
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
  playerReady: false,
  playing: false,
  positionMs: 0,
  endMs: 0,
  metronome: false,
  countIn: false,
  speed: 1,
  tempo: null,
  trainer: DEFAULT_TRAINER,
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
}
