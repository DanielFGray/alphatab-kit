import { PlayerMode, synth } from "@coderline/alphatab";
import { beatSpanOf } from "../charts/score-bars.js";
import { barEdgeBeat, beatIndexAt, collectBeats } from "../charts/score-navigation.js";
import { createMixer, fitMixer, setMaster, setMute, setSolo, setTrackVolume, } from "../charts/score-mixer.js";
import { displayForWidth } from "../charts/score-layout.js";
import { defaultNotation, staffNotation, toggleNotation } from "../charts/score-notation.js";
import { clampZoom } from "../charts/score-zoom.js";
import { trackOptions } from "../charts/score-tracks.js";
import { REPORT_THRESHOLD_MS, STOPPED_CLOCK, start, stop, takeWholeSeconds, tick } from "../charts/practice-time.js";
import { clampSpeed, nextSpeed } from "../charts/speed-trainer.js";
/** The trainer's defaults when the app gives no choice: one loop per step, and a 5 % step. */
export const DEFAULT_TRAINER = { loop: false, loopCount: 1, stepMode: "percent", stepValue: 5 };
/** The notation before a score loads: standard only, since no track is known to have strings. */
export const STANDARD_ONLY = { standard: true, tab: false };
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
 * Sound loads on demand. The API starts in external-media mode (cursor, seek and selection, no audio), and the first
 * `play` or `playPause` switches it to the synthesizer and plays once `playerReady` says the sound font is loaded.
 * The switch replaces alphaTab's player, which keeps the volumes, speed and loop but not the position or the range,
 * so those are put back at `playerReady`. alphaTab also fires `playerReady` in external-media mode, once the MIDI is
 * loaded; that event has no synthesizer behind it and is ignored while `sound` is `off`.
 *
 * Practice time counts from alphaTab's Playing state, and is measured with `now` (milliseconds; a test passes a
 * fake clock). It is reported at position events, so no timer runs here.
 *
 * `options.trackLabel` and the `on...Change` callbacks are read when they are needed, not at creation, so a
 * caller can pass an object whose getters return its latest callbacks.
 */
export function createScorePlayer(api, options = {}, now = () => performance.now()) {
    let state = {
        status: "loading",
        error: null,
        rendered: false,
        sound: "off",
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
    };
    const listeners = new Set();
    // The score's own tempo, before the speed; null until a score that names one loads.
    let baseTempo = null;
    // Loops of the passage finished since the trainer's count last restarted.
    let finishedRounds = 0;
    // The loaded score's tracks, as alphaTab needs them to draw one or change its mixer.
    let scoreTracks = [];
    // The beats of alphaTab's last highlight event: the range event that follows it names only ticks.
    let highlighted = null;
    // The beat a Shift move extends from. It lasts while the selection grows; any other change drops it.
    let anchor = null;
    // True while a key press makes alphaTab fire range events, so the anchor survives its own selection.
    let extendingByKey = false;
    const update = (patch) => {
        const next = { ...state, ...patch };
        if (Object.keys(patch).every((key) => state[key] === next[key]))
            return;
        state = next;
        for (const listener of listeners)
            listener();
    };
    // Practice time: whole seconds are taken from the clock and handed to the app; the player keeps no total.
    let clock = STOPPED_CLOCK;
    const reportPractice = (minMs) => {
        const taken = takeWholeSeconds(clock, minMs);
        clock = taken.clock;
        if (taken.seconds > 0)
            options.onPracticeTime?.(taken.seconds);
    };
    // Reports what is pending and stops the clock: the next Playing event starts it again.
    const stopPractice = () => {
        clock = stop(clock, now());
        reportPractice(0);
    };
    // Reports what is pending and lets the clock run on, for an event after which playback may continue.
    const settlePractice = () => {
        clock = tick(clock, now());
        reportPractice(0);
    };
    // Play was asked for while the sound loads: it starts at `playerReady`.
    let wantsPlay = false;
    // Where the old player stood when the synthesizer replaced it; null once the user moved on, or when none is owed.
    let resume = null;
    const loadSound = () => {
        resume = { range: api.playbackRange, ms: api.timePosition };
        api.settings.player.playerMode = PlayerMode.EnabledSynthesizer;
        update({ sound: "loading" });
        api.updateSettings();
    };
    const startPlay = () => {
        if (state.sound === "ready")
            return void api.play();
        wantsPlay = true;
        if (state.sound === "off")
            loadSound();
    };
    // While the sound loads a second press cancels the pending play, as it would stop a playing one.
    const playPause = () => {
        if (state.sound === "ready")
            return api.playPause();
        if (wantsPlay)
            wantsPlay = false;
        else
            startPlay();
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
    // The host's width, from alphaTab's resize event; null while unknown, which means the full-width row.
    let width = null;
    // Writes the display settings for the current width and zoom into `display`. True when they changed.
    const setDisplay = (display) => {
        const { scale, stretchForce } = displayForWidth(width ?? Number.POSITIVE_INFINITY, state.zoom);
        if (display.scale === scale && display.stretchForce === stretchForce)
            return false;
        display.scale = scale;
        display.stretchForce = stretchForce;
        return true;
    };
    // Sets which staves every track draws; the next draw uses it. A staff without strings keeps standard notation.
    const applyNotation = (choice) => {
        for (const track of scoreTracks) {
            for (const staff of track.staves) {
                const shown = staffNotation(staff.isStringed && !staff.isPercussion, choice);
                staff.showStandardNotation = shown.standard;
                staff.showTablature = shown.tab;
            }
        }
    };
    const drawTrack = (index) => {
        const track = scoreTracks[index];
        if (!track)
            return;
        const notation = defaultNotation(track);
        applyNotation(notation);
        api.renderTracks([track]);
        update({ track: index, notation });
    };
    // Drops the playback range, the highlight and the selection: the whole score plays again.
    const dropSelection = () => {
        anchor = null;
        highlighted = null;
        finishedRounds = 0;
        api.playbackRange = null;
        api.clearPlaybackRangeHighlight();
        update({ selection: null });
    };
    // The playable beats and the index of the one the cursor stands on; null while the score has none.
    const cursor = () => {
        const beats = collectBeats(api.tracks);
        const index = beatIndexAt(beats, api.tickPosition);
        return index < 0 ? null : { beats, index };
    };
    // The first beat of the bar before or after the cursor's bar; null at the score's edge.
    const neighbourBar = (beats, index, direction) => {
        const edge = barEdgeBeat(beats, index, direction === 1 ? "end" : "start");
        const next = edge ? beats[beatIndexAt(beats, edge.startTick) + direction] : undefined;
        return next ? barEdgeBeat(beats, beatIndexAt(beats, next.startTick), "start") : null;
    };
    // The beat a navigation key goes to; null for a key that does not move the cursor, or has nowhere to go.
    const targetOf = (key, beats, index) => {
        switch (key.key) {
            case "ArrowLeft":
                return key.ctrlKey ? neighbourBar(beats, index, -1) : (beats[Math.max(0, index - 1)] ?? null);
            case "ArrowRight":
                return key.ctrlKey ? neighbourBar(beats, index, 1) : (beats[Math.min(beats.length - 1, index + 1)] ?? null);
            case "Home":
                return key.ctrlKey ? (beats[0] ?? null) : barEdgeBeat(beats, index, "start");
            case "End":
                return key.ctrlKey ? (beats.at(-1) ?? null) : barEdgeBeat(beats, index, "end");
            default:
                return null;
        }
    };
    // Moves the cursor to `target`. With `extend` the selection grows from the anchor to it; else the selection drops.
    const moveTo = (target, current, extend) => {
        if (extend) {
            const from = (anchor ??= current.beat);
            extendingByKey = true;
            try {
                api.highlightPlaybackRange(from, target.beat);
                api.applyPlaybackRangeFromHighlight();
            }
            finally {
                extendingByKey = false;
            }
        }
        else {
            dropSelection();
        }
        resume = null;
        api.tickPosition = target.startTick;
        api.scrollToCursor();
        update({ positionMs: api.timePosition });
    };
    const playFromStart = () => {
        dropSelection();
        api.stop();
        resume = null;
        const first = collectBeats(api.tracks)[0];
        if (first)
            api.tickPosition = first.startTick;
        else
            api.timePosition = 0;
        api.scrollToCursor();
        update({ positionMs: api.timePosition });
        startPlay();
    };
    // alphaTab keeps these volumes and the speed until its player exists, so they can be set now.
    api.metronomeVolume = state.metronome ? 1 : 0;
    api.countInVolume = state.countIn ? 1 : 0;
    api.playbackSpeed = state.speed;
    api.isLooping = state.trainer.loop;
    // alphaTab fires its first resize inside its constructor, before this player can listen, so read the width.
    const initialWidth = api.container.width;
    if (initialWidth > 0)
        width = initialWidth;
    if (setDisplay(api.settings.display))
        api.updateSettings();
    const unsubscribers = [
        // alphaTab applies these settings and redraws after the event, so this handler neither updates nor renders.
        api.resize.on((args) => {
            if (!args.settings || !(args.newWidth > 0))
                return;
            width = args.newWidth;
            setDisplay(args.settings.display);
        }),
        api.scoreLoaded.on((score) => {
            baseTempo = score.tempo > 0 ? score.tempo : null;
            scoreTracks = score.tracks;
            dropSelection();
            const fileVolumes = scoreTracks.map((track) => track.playbackInfo.volume / 16);
            const mixer = options.mixer ? fitMixer(options.mixer, fileVolumes) : createMixer(fileVolumes);
            const wanted = options.defaultTrack ?? 0;
            const first = Number.isInteger(wanted) && wanted >= 0 && wanted < scoreTracks.length ? wanted : 0;
            api.masterVolume = mixer.master;
            const drawn = scoreTracks[first];
            const notation = options.notation ?? (drawn ? defaultNotation(drawn) : state.notation);
            // alphaTab fires this event before its first draw, so the staves set here need no extra draw.
            applyNotation(notation);
            update({
                status: "ready",
                error: null,
                tempo: tempoAt(state.speed),
                tracks: trackOptions(scoreTracks, options.trackLabel),
                track: scoreTracks.length > 0 ? first : null,
                mixer,
                notation,
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
            if (state.sound === "off")
                return;
            applyTrackMixer(state.mixer);
            const owed = resume;
            resume = null;
            if (owed) {
                if (owed.range)
                    api.playbackRange = owed.range;
                api.timePosition = owed.ms;
            }
            update({ sound: "ready" });
            if (!wantsPlay)
                return;
            wantsPlay = false;
            api.play();
        }),
        api.playerStateChanged.on((event) => {
            const playing = event.state === synth.PlayerState.Playing;
            if (playing)
                clock = start(clock, now());
            else
                stopPractice();
            update({ playing });
        }),
        api.playerPositionChanged.on((event) => {
            clock = tick(clock, now());
            reportPractice(REPORT_THRESHOLD_MS);
            update({ positionMs: event.currentTime, endMs: event.endTime });
        }),
        api.playerFinished.on(() => {
            // A looping player fires this and plays on without a state change, so the clock keeps running.
            settlePractice();
            if (!state.trainer.loop)
                return;
            finishedRounds += 1;
            if (finishedRounds < Math.max(1, state.trainer.loopCount))
                return;
            finishedRounds = 0;
            const { speed, trainer } = state;
            applySpeed(nextSpeed(speed, trainer.stepMode, trainer.stepValue, baseTempo));
        }),
        api.playbackRangeHighlightChanged.on((event) => {
            highlighted = event.startBeat && event.endBeat ? { start: event.startBeat, end: event.endBeat } : null;
        }),
        api.playbackRangeChanged.on((event) => {
            // A mouse drag is no key press: the next Shift move starts from the cursor, not from an old anchor.
            resume = null;
            if (!extendingByKey)
                anchor = null;
            finishedRounds = 0;
            // A range with no highlight is alphaTab's own reset, not a selection.
            update({ selection: event.playbackRange && highlighted ? beatSpanOf(highlighted.start, highlighted.end) : null });
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
            wantsPlay = false;
            resume = null;
            stopPractice();
            update({ status: "loading", error: null, rendered: false });
            dropSelection();
            if ("tex" in source)
                return api.tex(source.tex);
            const accepted = api.load("bytes" in source ? source.bytes : source.url);
            if (!accepted)
                fail("The score viewer cannot read this file.");
        },
        play: startPlay,
        pause: () => {
            wantsPlay = false;
            api.pause();
        },
        playPause,
        stop: () => {
            wantsPlay = false;
            resume = null;
            api.stop();
            finishedRounds = 0;
            update({ positionMs: 0 });
        },
        seek: (ms) => {
            resume = null;
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
            settlePractice();
            dropSelection();
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
        setZoom: (zoom) => {
            const clamped = clampZoom(zoom);
            update({ zoom: clamped });
            // alphaTab does not redraw for a settings change on its own, so a zoom update and draw is ours.
            if (setDisplay(api.settings.display)) {
                api.updateSettings();
                if (scoreTracks.length > 0)
                    api.render();
            }
            options.onZoomChange?.(clamped);
        },
        setNotation: (which) => {
            const next = toggleNotation(state.notation, which);
            update({ notation: next });
            applyNotation(next);
            if (scoreTracks.length > 0)
                api.render();
            options.onNotationChange?.(next);
        },
        clearSelection: dropSelection,
        handleKey: (key) => {
            if (state.status !== "ready" || key.altKey || key.metaKey)
                return false;
            if (key.code === "Space") {
                if (key.repeat)
                    return true;
                if (key.ctrlKey)
                    playFromStart();
                else
                    playPause();
                return true;
            }
            const here = cursor();
            const current = here?.beats[here.index];
            const target = here && targetOf(key, here.beats, here.index);
            if (!current || !target)
                return false;
            moveTo(target, current, key.shiftKey);
            return true;
        },
        dispose: () => {
            wantsPlay = false;
            stopPractice();
            for (const unsubscribe of unsubscribers)
                unsubscribe();
            listeners.clear();
        },
    };
}
