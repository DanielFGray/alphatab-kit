import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlphaTabApi, Settings } from "@coderline/alphatab";
import { alphaTabAssetUrls } from "../index.js";
import { createScorePlayer, } from "./score-player.js";
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
        const { configure, metronome, countIn, source: current } = latest.current;
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
        const created = createScorePlayer(api, { metronome, countIn });
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
};
