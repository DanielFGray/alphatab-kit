import { synth } from "@coderline/alphatab";
import { clampSpeed, nextSpeed } from "../charts/speed-trainer.js";
/** The trainer's defaults when the app gives no choice: one loop per step, and a 5 % step. */
export const DEFAULT_TRAINER = { loop: false, loopCount: 1, stepMode: "percent", stepValue: 5 };
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
export function createScorePlayer(api, options = {}) {
    let state = {
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
    };
    const listeners = new Set();
    // The score's own tempo, before the speed; null until a score that names one loads.
    let baseTempo = null;
    // Loops of the passage finished since the trainer's count last restarted.
    let finishedRounds = 0;
    const update = (patch) => {
        const next = { ...state, ...patch };
        if (Object.keys(patch).every((key) => state[key] === next[key]))
            return;
        state = next;
        for (const listener of listeners)
            listener();
    };
    const fail = (message) => update({ status: "error", error: message });
    const tempoAt = (speed) => (baseTempo === null ? null : Number.parseFloat((baseTempo * speed).toFixed(1)));
    // Sets the speed in the API and the state. The trainer's loop count is the caller's to handle.
    const applySpeed = (speed) => {
        const clamped = clampSpeed(speed);
        api.playbackSpeed = clamped;
        update({ speed: clamped, tempo: tempoAt(clamped) });
    };
    // Compares each key first, so an equal setting is silent: the trainer object is new on every change.
    const setTrainer = (patch) => {
        const changed = Object.keys(patch).some((key) => state.trainer[key] !== patch[key]);
        if (changed)
            update({ trainer: { ...state.trainer, ...patch } });
    };
    // alphaTab keeps these volumes and the speed until its player exists, so they can be set now.
    api.metronomeVolume = state.metronome ? 1 : 0;
    api.countInVolume = state.countIn ? 1 : 0;
    api.playbackSpeed = state.speed;
    api.isLooping = state.trainer.loop;
    const unsubscribers = [
        api.scoreLoaded.on((score) => {
            baseTempo = score.tempo > 0 ? score.tempo : null;
            update({ status: "ready", error: null, tempo: tempoAt(state.speed) });
        }),
        api.renderStarted.on(() => update({ rendered: false })),
        api.postRenderFinished.on(() => update({ rendered: true })),
        api.playerReady.on(() => update({ playerReady: true })),
        api.playerStateChanged.on((event) => update({ playing: event.state === synth.PlayerState.Playing })),
        api.playerPositionChanged.on((event) => update({ positionMs: event.currentTime, endMs: event.endTime })),
        api.playerFinished.on(() => {
            if (!state.trainer.loop)
                return;
            finishedRounds += 1;
            if (finishedRounds < Math.max(1, state.trainer.loopCount))
                return;
            finishedRounds = 0;
            const { speed, trainer } = state;
            applySpeed(nextSpeed(speed, trainer.stepMode, trainer.stepValue, baseTempo));
        }),
        api.error.on((error) => fail(error.message)),
    ];
    return {
        getState: () => state,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        load: (source) => {
            update({ status: "loading", error: null, rendered: false });
            if ("tex" in source)
                return api.tex(source.tex);
            const accepted = api.load("bytes" in source ? source.bytes : source.url);
            if (!accepted)
                fail("The score viewer cannot read this file.");
        },
        play: () => {
            if (state.playerReady)
                api.play();
        },
        pause: () => {
            api.pause();
        },
        playPause: () => {
            if (state.playerReady)
                api.playPause();
        },
        stop: () => {
            api.stop();
            finishedRounds = 0;
            update({ positionMs: 0 });
        },
        seek: (ms) => {
            const clamped = Math.max(0, state.endMs > 0 ? Math.min(ms, state.endMs) : ms);
            api.timePosition = clamped;
            finishedRounds = 0;
            update({ positionMs: clamped });
        },
        setMetronome: (on) => {
            api.metronomeVolume = on ? 1 : 0;
            update({ metronome: on });
        },
        setCountIn: (on) => {
            api.countInVolume = on ? 1 : 0;
            update({ countIn: on });
        },
        setSpeed: (speed) => {
            finishedRounds = 0;
            applySpeed(speed);
        },
        setLoop: (on) => {
            finishedRounds = 0;
            api.isLooping = on;
            setTrainer({ loop: on });
        },
        setLoopCount: (count) => setTrainer({ loopCount: count }),
        setStepMode: (mode) => setTrainer({ stepMode: mode }),
        setStepValue: (value) => setTrainer({ stepValue: value }),
        dispose: () => {
            for (const unsubscribe of unsubscribers)
                unsubscribe();
            listeners.clear();
        },
    };
}
