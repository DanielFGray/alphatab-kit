import { Effect, Fiber, Stream } from "effect"
import { useEffect, useMemo, useState } from "react"
import { clickTrack } from "./engine.ts"
import { NEW_TAKE, type Take, takeHits, takeStep } from "./take.ts"
import type { Hit, Subdivision } from "./timing.ts"

/** Off; the click alone; or the click with the mic open, timing each note. */
export type ClickMode = "off" | "click" | "listen"

/** A microphone the browser offers. */
export interface Mic {
  readonly id: string
  /** The browser's name for it, or a numbered stand-in before the page may read names. */
  readonly label: string
}

export interface UseClickTrackOptions {
  readonly mode: ClickMode
  readonly bpm: number
  /** Clicks in a bar, a whole number from 1 (see `ClickOptions`). */
  readonly beatsPerBar: number
  /** The grid the notes are scored against; changing it rescores the take without restarting the click. */
  readonly subdivision: Subdivision
  /** The `Mic` to listen on; null for the browser's default. */
  readonly micId: string | null
}

export interface UseClickTrack {
  /** The current take, or the last one after the click stops, until the next starts. */
  readonly take: Take
  /** The take's notes against the click, once the count-in has measured the delay. */
  readonly hits: ReadonlyArray<Hit>
  /** Every input the browser offers; empty on the server and on a page that is not secure. */
  readonly mics: ReadonlyArray<Mic>
}

/**
 * Runs the click while `mode` is not "off", and folds what it hears into a
 * take. A change of mode, tempo, bar or mic starts a new take; leaving the
 * page stops the audio and closes the mic. Browser APIs are touched only in
 * effects, so a server render shows an empty take.
 */
export function useClickTrack({ mode, bpm, beatsPerBar, subdivision, micId }: UseClickTrackOptions): UseClickTrack {
  const [take, setTake] = useState<Take>(NEW_TAKE)
  const mics = useMics(take.device)

  useEffect(() => {
    if (mode === "off") return
    setTake(NEW_TAKE)
    const options = { bpm, beatsPerBar, listen: mode === "listen", ...(micId === null ? {} : { micId }) }
    const fiber = Effect.runFork(
      Stream.runForEach(clickTrack(options), (event) => Effect.sync(() => setTake((take) => takeStep(take, event)))),
    )
    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
      // The take stays on show; only what is live about it ends.
      setTake((take) => ({ ...take, beat: null, level: 0 }))
    }
  }, [mode, bpm, beatsPerBar, micId])

  // The mic level updates the take about ten times a second; the hits change only with a note.
  const { notesMs, latencyMs } = take
  const hits = useMemo(() => takeHits({ notesMs, latencyMs }, bpm, subdivision), [notesMs, latencyMs, bpm, subdivision])
  return { take, hits, mics }
}

/**
 * The browser's audio inputs, read again when one is plugged in or out, and
 * when a mic opens (`openedDevice` changes): until the page has had mic
 * access, browsers hide the inputs' names, and some list only one input.
 */
function useMics(openedDevice: string | null): ReadonlyArray<Mic> {
  const [mics, setMics] = useState<ReadonlyArray<Mic>>([])
  useEffect(() => {
    const devices = navigator.mediaDevices as MediaDevices | undefined
    if (devices === undefined) return
    let live = true
    const refresh = () =>
      void devices.enumerateDevices().then(
        (all) => {
          if (live) setMics(micsFrom(all))
        },
        () => {},
      )
    refresh()
    devices.addEventListener("devicechange", refresh)
    return () => {
      live = false
      devices.removeEventListener("devicechange", refresh)
    }
  }, [openedDevice])
  return mics
}

/**
 * The audio inputs among `devices`, named. Before mic access a browser may
 * list inputs with an empty `deviceId`, which cannot be asked for; they are
 * left out.
 */
export const micsFrom = (devices: ReadonlyArray<MediaDeviceInfo>): ReadonlyArray<Mic> =>
  devices
    .filter((device) => device.kind === "audioinput" && device.deviceId !== "")
    .map((device, i) => ({ id: device.deviceId, label: device.label || `Microphone ${i + 1}` }))
