import { expect, test } from "bun:test"
import { synth } from "@coderline/alphatab"
import { createMixer, setMute, setSolo, setTrackVolume } from "../charts/score-mixer.ts"
import { createScorePlayer, type PlayerApi, type PlayerTrack } from "./score-player.ts"

class Emitter<T = void> {
  handlers = new Set<(value: T) => void>()
  on(handler: (value: T) => void) {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }
  emit(value: T) {
    for (const handler of this.handlers) handler(value)
  }
}

/** `scoreLoaded` with a score that has no tracks unless a test gives some. */
class ScoreLoadedEmitter extends Emitter<{ tempo: number; tracks: ReadonlyArray<PlayerTrack> }> {
  override emit(value: { tempo: number; tracks?: ReadonlyArray<PlayerTrack> }) {
    super.emit({ tracks: [], ...value })
  }
}

/** A track whose file volume is `volume` / 16. */
const track = (index: number, name: string, volume = 16): PlayerTrack => ({
  index,
  name,
  shortName: name.slice(0, 3),
  playbackInfo: { volume },
})

const SCORE_TRACKS = [track(0, "Guitar", 16), track(1, "  "), track(2, "Bass", 8)]

function fakeApi() {
  const calls: string[] = []
  const api = {
    scoreLoaded: new ScoreLoadedEmitter(),
    renderStarted: new Emitter<boolean>(),
    postRenderFinished: new Emitter(),
    playerReady: new Emitter(),
    playerStateChanged: new Emitter<{ state: number }>(),
    playerPositionChanged: new Emitter<{ currentTime: number; endTime: number }>(),
    playerFinished: new Emitter(),
    error: new Emitter<{ message: string }>(),
    accepts: true,
    timePosition: 0,
    metronomeVolume: 0,
    countInVolume: 0,
    playbackSpeed: 1,
    isLooping: false,
    masterVolume: 1,
    changeTrackVolume: (tracks: PlayerTrack[], volume: number) =>
      void calls.push(`volume:${tracks.map((track) => track.index).join()}:${volume}`),
    changeTrackSolo: (tracks: PlayerTrack[], solo: boolean) =>
      void calls.push(`solo:${tracks.map((track) => track.index).join()}:${solo}`),
    changeTrackMute: (tracks: PlayerTrack[], mute: boolean) =>
      void calls.push(`mute:${tracks.map((track) => track.index).join()}:${mute}`),
    renderTracks: (tracks: PlayerTrack[]) => void calls.push(`render:${tracks.map((track) => track.index).join()}`),
    load(data: unknown) {
      calls.push(`load:${typeof data === "string" ? data : "bytes"}`)
      return api.accepts
    },
    tex: (tex: string) => void calls.push(`tex:${tex}`),
    play: () => (calls.push("play"), true),
    pause: () => void calls.push("pause"),
    playPause: () => void calls.push("playPause"),
    stop: () => void calls.push("stop"),
  }
  return { api: api satisfies PlayerApi, calls }
}

const handlerCount = (api: ReturnType<typeof fakeApi>["api"]) =>
  [
    api.scoreLoaded,
    api.renderStarted,
    api.postRenderFinished,
    api.playerReady,
    api.playerStateChanged,
    api.playerPositionChanged,
    api.playerFinished,
    api.error,
  ].reduce(
    (sum, emitter) => sum + emitter.handlers.size,
    0,
  )

test("a loaded score makes the state ready, and the draw events bracket rendered", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api)
  expect(player.getState().status).toBe("loading")
  api.scoreLoaded.emit({ tempo: 120 })
  api.renderStarted.emit(false)
  expect(player.getState()).toMatchObject({ status: "ready", rendered: false })
  api.postRenderFinished.emit()
  expect(player.getState().rendered).toBe(true)
  api.renderStarted.emit(true)
  expect(player.getState().rendered).toBe(false)
})

test("load passes a URL or bytes to alphaTab and tex to its tex call", () => {
  const { api, calls } = fakeApi()
  const player = createScorePlayer(api)
  player.load({ url: "/a.gp" })
  player.load({ bytes: new Uint8Array(1) })
  player.load({ tex: "3.3.4" })
  expect(calls).toEqual(["load:/a.gp", "load:bytes", "tex:3.3.4"])
})

test("load fails when alphaTab cannot read the data, and an error event fails the state", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api)
  api.accepts = false
  player.load({ bytes: new Uint8Array(1) })
  expect(player.getState()).toMatchObject({ status: "error", error: "The score viewer cannot read this file." })
  api.accepts = true
  player.load({ url: "/b.gp" })
  expect(player.getState()).toMatchObject({ status: "loading", error: null })
  api.error.emit({ message: "bad header" })
  expect(player.getState()).toMatchObject({ status: "error", error: "bad header" })
})

test("play and playPause wait for the player to be ready", () => {
  const { api, calls } = fakeApi()
  const player = createScorePlayer(api)
  player.play()
  player.playPause()
  expect(calls).toEqual([])
  api.playerReady.emit()
  player.play()
  player.playPause()
  player.pause()
  expect(calls).toEqual(["play", "playPause", "pause"])
})

test("playing follows the player state event", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api)
  api.playerStateChanged.emit({ state: synth.PlayerState.Playing })
  expect(player.getState().playing).toBe(true)
  api.playerStateChanged.emit({ state: synth.PlayerState.Paused })
  expect(player.getState().playing).toBe(false)
})

test("position follows the position event; stop rewinds; seek clamps to the end", () => {
  const { api, calls } = fakeApi()
  const player = createScorePlayer(api)
  api.playerPositionChanged.emit({ currentTime: 1500, endTime: 60000 })
  expect(player.getState()).toMatchObject({ positionMs: 1500, endMs: 60000 })
  player.seek(99999)
  expect(api.timePosition).toBe(60000)
  player.seek(-5)
  expect(api.timePosition).toBe(0)
  player.seek(2500)
  expect(player.getState().positionMs).toBe(2500)
  player.stop()
  expect(calls).toEqual(["stop"])
  expect(player.getState().positionMs).toBe(0)
})

test("metronome and count-in set their volumes, and the initial choice is applied at once", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api, { metronome: true })
  expect(api.metronomeVolume).toBe(1)
  expect(api.countInVolume).toBe(0)
  player.setMetronome(false)
  player.setCountIn(true)
  expect(api.metronomeVolume).toBe(0)
  expect(api.countInVolume).toBe(1)
  expect(player.getState()).toMatchObject({ metronome: false, countIn: true })
})

test("speed is clamped, applied to the API at once, and set from the options", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api, { speed: 0.5 })
  expect(api.playbackSpeed).toBe(0.5)
  player.setSpeed(10)
  expect(api.playbackSpeed).toBe(3)
  expect(player.getState().speed).toBe(3)
  player.setSpeed(0)
  expect(api.playbackSpeed).toBe(0.25)
  expect(player.getState().speed).toBe(0.25)
})

test("tempo is the score's tempo at the current speed, and null when the score names none", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api)
  expect(player.getState().tempo).toBeNull()
  api.scoreLoaded.emit({ tempo: 120 })
  expect(player.getState().tempo).toBe(120)
  player.setSpeed(0.75)
  expect(player.getState().tempo).toBe(90)
  player.setSpeed(1.33)
  expect(player.getState().tempo).toBe(159.6)
  api.scoreLoaded.emit({ tempo: 0 })
  expect(player.getState().tempo).toBeNull()
})

test("a finished loop counts, and the speed steps up after loopCount passes", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api, { loop: true, loopCount: 2, stepMode: "percent", stepValue: 10 })
  api.playerFinished.emit()
  expect(player.getState().speed).toBe(1)
  api.playerFinished.emit()
  expect(player.getState().speed).toBe(1.1)
  expect(api.playbackSpeed).toBe(1.1)
})

test("a bpm step adds beats to the score's tempo, not to the displayed tempo", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api, { loop: true, stepMode: "bpm", stepValue: 12 })
  api.scoreLoaded.emit({ tempo: 120 })
  player.setSpeed(0.5)
  api.playerFinished.emit()
  expect(player.getState().speed).toBe(0.6)
})

test("no step happens when the trainer loop is off", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api, { loopCount: 1, stepValue: 10 })
  api.playerFinished.emit()
  api.playerFinished.emit()
  api.playerFinished.emit()
  expect(player.getState().speed).toBe(1)
  expect(api.playbackSpeed).toBe(1)
})

test("stop restarts the loop count, so a pass before it does not count", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api, { loop: true, loopCount: 2, stepValue: 10 })
  api.playerFinished.emit()
  player.stop()
  api.playerFinished.emit()
  expect(player.getState().speed).toBe(1)
})

test("seek and a speed the player chose also restart the loop count", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api, { loop: true, loopCount: 2, stepValue: 10 })
  api.playerFinished.emit()
  player.seek(0)
  api.playerFinished.emit()
  player.setSpeed(1)
  api.playerFinished.emit()
  expect(player.getState().speed).toBe(1)
})

test("setLoop drives the API's loop flag; trainer settings update the state, and an equal one is silent", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api)
  player.setLoop(true)
  expect(api.isLooping).toBe(true)
  player.setLoopCount(3)
  player.setStepMode("bpm")
  player.setStepValue(4)
  expect(player.getState().trainer).toEqual({ loop: true, loopCount: 3, stepMode: "bpm", stepValue: 4 })
  let heard = 0
  player.subscribe(() => heard++)
  player.setLoopCount(3)
  expect(heard).toBe(0)
  player.setLoop(false)
  expect(api.isLooping).toBe(false)
})

test("subscribers hear a change once, an equal update is silent, and dispose removes every handler", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api)
  let heard = 0
  const unsubscribe = player.subscribe(() => heard++)
  api.playerReady.emit()
  api.playerReady.emit()
  expect(heard).toBe(1)
  const before = player.getState()
  api.postRenderFinished.emit()
  expect(player.getState()).not.toBe(before)
  unsubscribe()
  api.playerReady.emit()
  expect(heard).toBe(2)
  player.dispose()
  expect(handlerCount(api)).toBe(0)
})

test("the tracks are listed with the label function, or by name with a fallback", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api)
  expect(player.getState()).toMatchObject({ tracks: [], track: null })
  api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  expect(player.getState().tracks).toEqual([
    { index: 0, label: "Guitar" },
    { index: 1, label: "Track 2" },
    { index: 2, label: "Bass" },
  ])
  const second = fakeApi()
  const again = createScorePlayer(second.api, { trackLabel: (item) => item.shortName })
  second.api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  expect(again.getState().tracks.map((option) => option.label)).toEqual(["Gui", "  ", "Bas"])
})

test("the first track is track 0 without a second draw", () => {
  const { api, calls } = fakeApi()
  const player = createScorePlayer(api)
  api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  expect(player.getState().track).toBe(0)
  expect(calls).toEqual([])
})

test("defaultTrack is drawn on load, and an index outside the score falls back to 0", () => {
  const picked = fakeApi()
  const player = createScorePlayer(picked.api, { defaultTrack: 2 })
  picked.api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  expect(player.getState().track).toBe(2)
  expect(picked.calls).toEqual(["render:2"])
  const outside = fakeApi()
  const fallback = createScorePlayer(outside.api, { defaultTrack: 9 })
  outside.api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  expect(fallback.getState().track).toBe(0)
  expect(outside.calls).toEqual([])
})

test("setTrack draws only that track, ignores an index outside the score, and restarts the loop count", () => {
  const { api, calls } = fakeApi()
  const player = createScorePlayer(api, { loop: true, loopCount: 2, stepValue: 10 })
  api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  api.playerFinished.emit()
  player.setTrack(1)
  expect(calls).toEqual(["render:1"])
  expect(player.getState().track).toBe(1)
  api.playerFinished.emit()
  expect(player.getState().speed).toBe(1)
  player.setTrack(7)
  expect(calls).toEqual(["render:1"])
  expect(player.getState().track).toBe(1)
})

test("a score without a saved mixer starts each track at its file's volume", () => {
  const { api } = fakeApi()
  const player = createScorePlayer(api)
  api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  expect(player.getState().mixer).toEqual(createMixer([1, 1, 0.5]))
})

test("a saved mixer is fitted on load, master is applied at once, and tracks wait for playerReady", () => {
  const { api, calls } = fakeApi()
  const saved = setMute(setSolo(setTrackVolume({ ...createMixer([1, 1, 1, 1]), master: 0.4 }, 0, 0.3), 1, true), 2, true)
  const heard: unknown[] = []
  const player = createScorePlayer(api, { mixer: saved, onMixerChange: (mixer) => heard.push(mixer) })
  api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  expect(player.getState().mixer).toEqual({ ...saved, tracks: saved.tracks.slice(0, 3) })
  expect(api.masterVolume).toBe(0.4)
  expect(calls).toEqual([])
  api.playerReady.emit()
  expect(calls).toEqual([
    "volume:0:0.3",
    "solo:0:false",
    "mute:0:false",
    "volume:1:1",
    "solo:1:true",
    "mute:1:false",
    "volume:2:1",
    "solo:2:false",
    "mute:2:true",
  ])
  expect(heard).toEqual([])
})

test("each mixer action reaches the API and the callback", () => {
  const { api, calls } = fakeApi()
  const heard: unknown[] = []
  const player = createScorePlayer(api, { onMixerChange: (mixer) => heard.push(mixer) })
  api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  player.setMasterVolume(0.5)
  expect(api.masterVolume).toBe(0.5)
  player.setTrackVolume(2, 0.25)
  player.setSolo(1, true)
  player.setMute(0, true)
  expect(calls).toEqual(["volume:2:0.25", "solo:1:true", "mute:0:true"])
  const mixer = player.getState().mixer
  expect(mixer.master).toBe(0.5)
  expect(mixer.tracks).toEqual([
    { volume: 1, solo: false, mute: true },
    { volume: 1, solo: true, mute: false },
    { volume: 0.25, solo: false, mute: false },
  ])
  expect(heard).toHaveLength(4)
  expect(heard.at(-1)).toBe(mixer)
})

test("the mixer callback is read when it is called, so a later callback replaces an earlier one", () => {
  const { api } = fakeApi()
  const calls: string[] = []
  let current = () => calls.push("first")
  const player = createScorePlayer(api, {
    get onMixerChange() {
      return current
    },
  })
  api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  player.setMasterVolume(0.5)
  current = () => calls.push("second")
  player.setMasterVolume(0.6)
  expect(calls).toEqual(["first", "second"])
})

test("a volume above the range is clamped before it reaches the API", () => {
  const { api, calls } = fakeApi()
  const player = createScorePlayer(api)
  api.scoreLoaded.emit({ tempo: 120, tracks: SCORE_TRACKS })
  player.setTrackVolume(0, 4)
  player.setMasterVolume(-1)
  expect(calls).toEqual(["volume:0:1"])
  expect(api.masterVolume).toBe(0)
})
