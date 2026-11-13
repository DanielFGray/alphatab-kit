/** Where a score comes from: file bytes, a URL alphaTab downloads, or alphaTex source. */
export type ScoreSource = {
    readonly bytes: Uint8Array;
} | {
    readonly url: string;
} | {
    readonly tex: string;
};
/** What the controller shows: all of it derives from alphaTab's events and the actions below. */
export interface ScorePlayerState {
    /** `loading` until alphaTab has parsed the score; `error` after a load or render failure. */
    readonly status: "loading" | "ready" | "error";
    readonly error: string | null;
    /** True once the score is drawn; false again while a redraw runs. Beat positions are valid only when true. */
    readonly rendered: boolean;
    /** True once the synthesizer and sound font can play. Play does nothing before it. */
    readonly playerReady: boolean;
    readonly playing: boolean;
    readonly positionMs: number;
    readonly endMs: number;
    readonly metronome: boolean;
    readonly countIn: boolean;
}
/** The actions of a controller. Each is a bound function, so it can be passed on as is. */
export interface ScorePlayerActions {
    play: () => void;
    pause: () => void;
    playPause: () => void;
    /** Stops and rewinds to the start. */
    stop: () => void;
    /** Moves the playback position, clamped to the score's length once that is known. */
    seek: (ms: number) => void;
    setMetronome: (on: boolean) => void;
    setCountIn: (on: boolean) => void;
}
/** A score player: a state snapshot, a subscription to its changes, and the actions. */
export interface ScorePlayer extends ScorePlayerActions {
    /** The current snapshot. It is the same object until the state changes, as `useSyncExternalStore` needs. */
    getState: () => ScorePlayerState;
    /** Calls `listener` after each state change. Returns the function that removes it. */
    subscribe: (listener: () => void) => () => void;
    /** Starts loading a score. Call it once, after the player is created, so no event is missed. */
    load: (source: ScoreSource) => void;
    /** Removes every handler the player put on the API. It does not destroy the API: its creator does. */
    dispose: () => void;
}
export interface ScorePlayerOptions {
    readonly metronome?: boolean;
    readonly countIn?: boolean;
}
/** An alphaTab event without a payload, as the API exposes it. */
export interface PlayerEvent {
    on(handler: () => void): () => void;
}
/** An alphaTab event with a payload. */
export interface PlayerEventOf<T> {
    on(handler: (value: T) => void): () => void;
}
/**
 * The part of `AlphaTabApi` the controller touches. `AlphaTabApi` satisfies it as is; a test can pass
 * a plain object. A later feature adds the members it needs here, so this stays the smallest true list.
 */
export interface PlayerApi {
    readonly scoreLoaded: PlayerEventOf<unknown>;
    readonly renderStarted: PlayerEventOf<boolean>;
    readonly postRenderFinished: PlayerEvent;
    readonly playerReady: PlayerEvent;
    readonly playerStateChanged: PlayerEventOf<{
        readonly state: number;
    }>;
    readonly playerPositionChanged: PlayerEventOf<{
        readonly currentTime: number;
        readonly endTime: number;
    }>;
    readonly error: PlayerEventOf<{
        readonly message: string;
    }>;
    /** Returns false when alphaTab cannot read the data type. */
    load(scoreData: unknown): boolean;
    tex(tex: string): void;
    play(): boolean;
    pause: () => void;
    playPause: () => void;
    stop: () => void;
    timePosition: number;
    metronomeVolume: number;
    countInVolume: number;
}
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
export declare function createScorePlayer(api: PlayerApi, options?: ScorePlayerOptions): ScorePlayer;
