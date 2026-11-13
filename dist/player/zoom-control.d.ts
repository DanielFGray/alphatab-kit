import { type Parts } from "./parts.ts";
export type ZoomControlProps = {
    /** How large the notation is drawn, where 1 is 100%. */
    zoom: number;
    onZoom: (zoom: number) => void;
    parts?: Parts<"root" | "zoomOut" | "zoomIn" | "reset">;
};
/**
 * Smaller and larger buttons around the zoom percentage. Tapping the percentage
 * returns to 100%. The out and in buttons are separate parts, so an app can
 * give each its own test id; they usually share one class string.
 */
export declare function ZoomControl({ zoom, onZoom, parts }: ZoomControlProps): import("react").JSX.Element;
