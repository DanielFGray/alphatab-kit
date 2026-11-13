import { MAX_ZOOM, MIN_ZOOM, stepZoom } from "../charts/score-zoom.ts"
import { partProps, type Parts } from "./parts.ts"

export type ZoomControlProps = {
  /** How large the notation is drawn, where 1 is 100%. */
  zoom: number
  onZoom: (zoom: number) => void
  parts?: Parts<"root" | "zoomOut" | "zoomIn" | "reset">
}

/**
 * Smaller and larger buttons around the zoom percentage. Tapping the percentage
 * returns to 100%. The out and in buttons are separate parts, so an app can
 * give each its own test id; they usually share one class string.
 */
export function ZoomControl({ zoom, onZoom, parts }: ZoomControlProps) {
  return (
    <div {...partProps(parts, "root")}>
      Zoom
      <button
        {...partProps(parts, "zoomOut")}
        type="button"
        aria-label="Zoom out"
        disabled={zoom <= MIN_ZOOM}
        onClick={() => onZoom(stepZoom(zoom, -1))}
      >
        −
      </button>
      <button
        {...partProps(parts, "reset")}
        type="button"
        aria-label="Reset zoom to 100%"
        title="Reset zoom"
        onClick={() => onZoom(1)}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        {...partProps(parts, "zoomIn")}
        type="button"
        aria-label="Zoom in"
        disabled={zoom >= MAX_ZOOM}
        onClick={() => onZoom(stepZoom(zoom, 1))}
      >
        +
      </button>
    </div>
  )
}
