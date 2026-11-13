import { synth } from "@coderline/alphatab";
/**
 * Drives `api`: it listens to alphaTab's events and keeps the state from them, and its actions call the API.
 *
 * Event order matters: `scoreLoaded` makes the state ready before the first draw, `renderStarted` and
 * `postRenderFinished` bracket each draw, and `playerReady` comes later and on its own timing, since the
 * sound font loads in parallel. An `error` event is final until the next `load`.
 *
 * The position comes from `playerPositionChanged` only. `stop` and `seek` set it directly, because a
 * stopped or paused player may not emit that event for the move.
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
    };
    const listeners = new Set();
    const update = (patch) => {
        const next = { ...state, ...patch };
        if (Object.keys(patch).every((key) => state[key] === next[key]))
            return;
        state = next;
        for (const listener of listeners)
            listener();
    };
    const fail = (message) => update({ status: "error", error: message });
    // alphaTab keeps these volumes until its player exists, so they can be set now.
    api.metronomeVolume = state.metronome ? 1 : 0;
    api.countInVolume = state.countIn ? 1 : 0;
    const unsubscribers = [
        api.scoreLoaded.on(() => update({ status: "ready", error: null })),
        api.renderStarted.on(() => update({ rendered: false })),
        api.postRenderFinished.on(() => update({ rendered: true })),
        api.playerReady.on(() => update({ playerReady: true })),
        api.playerStateChanged.on((event) => update({ playing: event.state === synth.PlayerState.Playing })),
        api.playerPositionChanged.on((event) => update({ positionMs: event.currentTime, endMs: event.endTime })),
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
            update({ positionMs: 0 });
        },
        seek: (ms) => {
            const clamped = Math.max(0, state.endMs > 0 ? Math.min(ms, state.endMs) : ms);
            api.timePosition = clamped;
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
        dispose: () => {
            for (const unsubscribe of unsubscribers)
                unsubscribe();
            listeners.clear();
        },
    };
}
