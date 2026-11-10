import { type ReactNode } from "react";
import { type StaticScore } from "./static.ts";
export interface StaticScoreFrameProps {
    /** The score drawn ahead of time, on the server or at build time. */
    readonly score: StaticScore;
    /** True once the player inside has drawn the score. */
    readonly playerReady: boolean;
    /** Where the page serves alphaTab's fonts. Defaults to where the kit's Vite plugin serves them. */
    readonly fontDirectory?: string;
    /** The element alphaTab draws into. */
    readonly children: ReactNode;
}
/**
 * Shows a static score in place of a player until the player has drawn.
 *
 * The static score holds the page layout, so a server-rendered page shows the
 * music before any script runs. The player's element sits over it, at full
 * width but invisible, so alphaTab can measure it and draw. When
 * `playerReady` turns true the player takes the static score's place. Print
 * always shows the static score, which keeps whole systems on each page.
 */
export declare function StaticScoreFrame({ score, playerReady, fontDirectory, children, }: StaticScoreFrameProps): import("react").JSX.Element;
