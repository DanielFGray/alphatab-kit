import { expect, test } from "bun:test"
import { synth } from "@coderline/alphatab"
import { createScorePlayer, type PlayerApi } from "./score-player.ts"

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

function fakeApi() {
  const calls: string[] = []
  const api = {
    scoreLoaded: new Emitter<{ tempo: number }>(),
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
