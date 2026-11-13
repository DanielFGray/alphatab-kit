import { synth } from "@coderline/alphatab";
import { createMixer, fitMixer, setMaster, setMute, setSolo, setTrackVolume, } from "../charts/score-mixer.js";
import { trackOptions } from "../charts/score-tracks.js";
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
 *
 * `options.trackLabel` and `options.onMixerChange` are read when they are needed, not at creation, so a
 * caller can pass an object whose getters return its latest callbacks.
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
        tracks: [],
        track: null,
        mixer: options.mixer ?? createMixer([]),
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
    // The loaded score's tracks, as alphaTab needs them to draw one or change its mixer.
    let scoreTracks = [];
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
    // Sends a mixer's track settings to alphaTab, which has them only once its player exists.
    const applyTrackMixer = (mixer) => {
        mixer.tracks.forEach((mix, index) => {
            const track = scoreTracks[index];
            if (!track)
                return;
            api.changeTrackVolume([track], mix.volume);
            api.changeTrackSolo([track], mix.solo);
            api.changeTrackMute([track], mix.mute);
        });
    };
    // A mixer action by the user: keep the new mixer, tell alphaTab, then tell the app so it can save it.
    const changeMixer = (next, send) => {
        update({ mixer: next });
        send();
        options.onMixerChange?.(next);
    };
    const drawTrack = (index) => {
        const track = scoreTracks[index];
        if (!track)
            return;
        api.renderTracks([track]);
        update({ track: index });
    };
    // alphaTab keeps these volumes and the speed until its player exists, so they can be set now.
    api.metronomeVolume = state.metronome ? 1 : 0;
    api.countInVolume = state.countIn ? 1 : 0;
    api.playbackSpeed = state.speed;
    api.isLooping = state.trainer.loop;
    const unsubscribers = [
        api.scoreLoaded.on((score) => {
            baseTempo = score.tempo > 0 ? score.tempo : null;
            scoreTracks = score.tracks;
            const fileVolumes = scoreTracks.map((track) => track.playbackInfo.volume / 16);
            const mixer = options.mixer ? fitMixer(options.mixer, fileVolumes) : createMixer(fileVolumes);
            const wanted = options.defaultTrack ?? 0;
            const first = Number.isInteger(wanted) && wanted >= 0 && wanted < scoreTracks.length ? wanted : 0;
            api.masterVolume = mixer.master;
            update({
                status: "ready",
                error: null,
                tempo: tempoAt(state.speed),
                tracks: trackOptions(scoreTracks, options.trackLabel),
                track: scoreTracks.length > 0 ? first : null,
                mixer,
            });
            // alphaTab chose track 0 for this load and draws after this event. renderTracks switches the
            // track first, at the cost of one extra draw (the load still runs its own).
            if (first !== 0)
                api.renderTracks([scoreTracks[first]]);
        }),
        api.renderStarted.on(() => update({ rendered: false })),
        api.postRenderFinished.on(() => update({ rendered: true })),
        // alphaTab's own handler runs first and sets each track to its file's volume; ours then wins.
        api.playerReady.on(() => {
            applyTrackMixer(state.mixer);
            update({ playerReady: true });
        }),
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
        setTrack: (index) => {
            if (index === state.track)
                return;
            finishedRounds = 0;
            drawTrack(index);
        },
        setMasterVolume: (volume) => {
            const next = setMaster(state.mixer, volume);
            changeMixer(next, () => {
                api.masterVolume = next.master;
            });
        },
        setTrackVolume: (track, volume) => {
            const next = setTrackVolume(state.mixer, track, volume);
            changeMixer(next, () => api.changeTrackVolume([scoreTracks[track]], next.tracks[track].volume));
        },
        setSolo: (track, solo) => {
            changeMixer(setSolo(state.mixer, track, solo), () => api.changeTrackSolo([scoreTracks[track]], solo));
        },
        setMute: (track, mute) => {
            changeMixer(setMute(state.mixer, track, mute), () => api.changeTrackMute([scoreTracks[track]], mute));
        },
        dispose: () => {
            for (const unsubscribe of unsubscribers)
                unsubscribe();
            listeners.clear();
        },
    };
}
