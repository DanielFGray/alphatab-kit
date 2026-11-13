import { type Mixer } from "../charts/score-mixer.ts";
import { type TrackOption } from "../charts/score-tracks.ts";
import { type StepMode } from "../charts/speed-trainer.ts";
/** Where a score comes from: file bytes, a URL alphaTab downloads, or alphaTex source. */
export type ScoreSource = {
    readonly bytes: Uint8Array;
} | {
    readonly url: string;
} | {
    readonly tex: string;
};
/** The speed trainer's settings. Each finished loop of the passage counts; after `loopCount` counts the speed steps up. */
export interface TrainerState {
    readonly loop: boolean;
    readonly loopCount: number;
    readonly stepMode: StepMode;
    readonly stepValue: number;
}
/** The trainer's defaults when the app gives no choice: one loop per step, and a 5 % step. */
export declare const DEFAULT_TRAINER: TrainerState;
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
    /** The playback speed: 1 is the score's own tempo. Always inside the range `clampSpeed` allows. */
    readonly speed: number;
    /** The score's tempo at `speed`, rounded to a tenth; null when the score names none. */
    readonly tempo: number | null;
    readonly trainer: TrainerState;
    /** The score's tracks; empty until a score loads. */
    readonly tracks: ReadonlyArray<TrackOption>;
    /** The index of the track drawn; null before a score loads. */
    readonly track: number | null;
    /** Master volume and each track's volume, solo and mute. Holds the saved settings until a score loads. */
    readonly mixer: Mixer;
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
    /** Clamped to the supported speed range. A speed the player chose restarts the trainer's loop count. */
    setSpeed: (speed: number) => void;
    setLoop: (on: boolean) => void;
    setLoopCount: (count: number) => void;
    setStepMode: (mode: StepMode) => void;
    setStepValue: (value: number) => void;
    /** Draws only this track and restarts the trainer's loop count. An index outside the score is ignored. */
    setTrack: (index: number) => void;
    /** Volumes are clamped to 0..1. Each mixer action calls `onMixerChange`; a track index outside the score throws a RangeError. */
    setMasterVolume: (volume: number) => void;
    setTrackVolume: (track: number, volume: number) => void;
    setSolo: (track: number, solo: boolean) => void;
    setMute: (track: number, mute: boolean) => void;
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
    readonly speed?: number;
    readonly loop?: boolean;
    readonly loopCount?: number;
    readonly stepMode?: StepMode;
    readonly stepValue?: number;
    /** Builds a track's label; the default is the trimmed name, or "Track n" when it is blank. */
    readonly trackLabel?: (track: PlayerTrack, index: number) => string;
    /** The track drawn first. An index outside the score falls back to 0. */
    readonly defaultTrack?: number;
    /** Saved settings, fitted to the score on load. Without them each track starts at its file's volume. */
    readonly mixer?: Mixer;
    /** Called with the new mixer after a user action changes it, not when the load fits it. */
    readonly onMixerChange?: (mixer: Mixer) => void;
}
/** The part of an alphaTab `Track` the controller reads. */
export interface PlayerTrack {
    readonly index: number;
    readonly name: string;
    readonly shortName: string;
    /** `volume` is the file's own track volume, 0 to 16. */
    readonly playbackInfo: {
        readonly volume: number;
    };
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
    readonly scoreLoaded: PlayerEventOf<{
        readonly tempo: number;
        readonly tracks: ReadonlyArray<PlayerTrack>;
    }>;
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
    /** Fires once per pass of the playing range. With `isLooping` set, each loop round fires it. */
    readonly playerFinished: PlayerEvent;
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
    playbackSpeed: number;
    isLooping: boolean;
    masterVolume: number;
    /** Takes effect only once the player exists: alphaTab drops these three before `playerReady`. */
    changeTrackVolume(tracks: PlayerTrack[], volume: number): void;
    changeTrackSolo(tracks: PlayerTrack[], solo: boolean): void;
    changeTrackMute(tracks: PlayerTrack[], mute: boolean): void;
    /** Draws only these tracks. The sound is unchanged: alphaTab makes the MIDI from the whole score. */
    renderTracks(tracks: PlayerTrack[]): void;
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
 *
 * The trainer's loop count lives here, not in the state: it is progress, not a setting. Stop, seek, a
 * loop toggle and a speed the player chose restart it, so a count never carries across a jump.
 *
 * `options.trackLabel` and `options.onMixerChange` are read when they are needed, not at creation, so a
 * caller can pass an object whose getters return its latest callbacks.
 */
export declare function createScorePlayer(api: PlayerApi, options?: ScorePlayerOptions): ScorePlayer;
