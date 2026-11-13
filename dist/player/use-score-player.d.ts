import { type RefObject } from "react";
import { Settings } from "@coderline/alphatab";
import { type ScorePlayerActions, type ScorePlayerOptions, type ScorePlayerState, type ScoreSource } from "./score-player.ts";
export interface UseScorePlayerOptions extends ScorePlayerOptions {
    readonly source: ScoreSource;
    /**
     * Edits alphaTab's settings before the API is built: an app adds its padding, scroll element and
     * hidden elements here. The kit has already set the engine, the player, the asset URLs and the ink (the
     * host's text color). Only the function from the render that builds the API runs.
     *
     * This is the place for `settings.player.scrollElement` when the app scrolls the score inside its own box:
     * alphaTab resolves that setting on its first scroll and keeps the element, so a later change has no effect.
     * An app whose scroll box changes rebuilds the player (a new `key` on the component that calls the hook).
     * A theme change re-applies the ink only; colors set here are not kept over it.
     */
    readonly configure?: (settings: Settings) => void;
}
export interface UseScorePlayer {
    /** Attach to the element alphaTab draws into. The API exists after the first commit. */
    readonly host: RefObject<HTMLDivElement | null>;
    readonly state: ScorePlayerState;
    readonly actions: ScorePlayerActions;
}
/**
 * Builds an `AlphaTabApi` on `host`, loads `source` and returns the controller's state and actions.
 * The API is destroyed on unmount and rebuilt when the source changes (compared by the bytes object,
 * URL or tex text, so pass the same `Uint8Array` across renders). Browser only: it reads `location`.
 */
export declare function useScorePlayer(options: UseScorePlayerOptions): UseScorePlayer;
