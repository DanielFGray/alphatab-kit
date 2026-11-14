import { type Parts } from "../player/parts.ts";
import { type Hit } from "./timing.ts";
export type OffsetChartProps = {
    /** `UseClickTrack.hits`. */
    hits: ReadonlyArray<Hit>;
    /** The drawing's height in CSS pixels; it fills its container's width. */
    height?: number;
    parts?: Parts<"root" | "band" | "zero" | "mark" | "label">;
};
/**
 * Every note of the take in order, left to right, placed up when late and
 * down when early, over a band of ±TIGHT_MS. Each mark carries its offset in
 * `data-offset-ms` and a tooltip; the last also has `data-last`. The marks
 * and band draw in the text color, so the app's CSS restyles any of them.
 */
export declare function OffsetChart({ hits, height, parts }: OffsetChartProps): import("react").JSX.Element;
export type TakeSummaryProps = {
    hits: ReadonlyArray<Hit>;
    parts?: Parts<"root" | "item" | "label" | "value">;
};
/** The take's notes in four numbers: how many, their average offset, their spread and the share within ±TIGHT_MS. */
export declare function TakeSummary({ hits, parts }: TakeSummaryProps): import("react").JSX.Element;
export type MicMeterProps = {
    /** `Take.level`. */
    peak: number;
    parts?: Parts<"root" | "fill">;
};
/** The mic's level, from -60 dBFS (empty) to full scale. The fill's width is set inline; the app gives it a height and color. */
export declare function MicMeter({ peak, parts }: MicMeterProps): import("react").JSX.Element;
