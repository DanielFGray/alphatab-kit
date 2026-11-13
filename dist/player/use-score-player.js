import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlphaTabApi, Settings } from "@coderline/alphatab";
import { alphaTabAssetUrls } from "../index.js";
import { createMixer } from "../charts/score-mixer.js";
import { createScorePlayer, DEFAULT_TRAINER, STANDARD_ONLY, } from "./score-player.js";
/**
 * Builds an `AlphaTabApi` on `host`, loads `source` and returns the controller's state and actions.
 * The API is destroyed on unmount and rebuilt when the source changes (compared by the bytes object,
 * URL or tex text, so pass the same `Uint8Array` across renders). Browser only: it reads `location`.
 */
export function useScorePlayer(options) {
    const host = useRef(null);
    const [player, setPlayer] = useState(null);
    const latest = useRef(options);
    latest.current = options;
    const { source } = options;
    const identity = "bytes" in source ? source.bytes : "url" in source ? source.url : source.tex;
    const kind = "bytes" in source ? "bytes" : "url" in source ? "url" : "tex";
    useEffect(() => {
        const element = host.current;
        if (!element)
            return;
        const { configure, source: current, ...initial } = latest.current;
        const settings = new Settings();
        const urls = alphaTabAssetUrls();
        settings.core.engine = "svg";
        settings.core.scriptFile = urls.scriptFile;
        settings.core.fontDirectory = urls.fontDirectory;
        settings.player.enablePlayer = true;
        settings.player.enableCursor = true;
        settings.player.soundFont = urls.soundFont;
        configure?.(settings);
        const api = new AlphaTabApi(element, settings);
        // Getters, so a callback from a later render is the one called: this controller is built once.
        const live = {
            ...initial,
            get trackLabel() {
                return latest.current.trackLabel;
            },
            get onMixerChange() {
                return latest.current.onMixerChange;
            },
            get onZoomChange() {
                return latest.current.onZoomChange;
            },
            get onNotationChange() {
                return latest.current.onNotationChange;
            },
        };
        const created = createScorePlayer(api, live);
        setPlayer(created);
        created.load(current);
        return () => {
            created.dispose();
            api.destroy();
            setPlayer(null);
        };
    }, [kind, identity]);
    const state = useSyncExternalStore(player?.subscribe ?? subscribeNothing, player?.getState ?? (() => INITIAL_STATE), () => INITIAL_STATE);
    return { host, state, actions: player ?? INERT_ACTIONS };
}
const INITIAL_STATE = {
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
    tracks: [],
    track: null,
    mixer: createMixer([]),
    zoom: 1,
    notation: STANDARD_ONLY,
};
const subscribeNothing = () => () => { };
const noop = () => { };
/** Stands in until the API exists, so a control can call an action on the first render. */
const INERT_ACTIONS = {
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
};
