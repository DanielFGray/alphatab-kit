import { partProps, type Parts } from "../player/parts.ts"
import { chartRangeMs, hitTiles, meterFill, signedMs } from "./report.ts"
import { type Hit, TIGHT_MS } from "./timing.ts"

export type OffsetChartProps = {
  /** The notes in the order played: `UseClickTrack.hits`, or the paired notes of a score take. */
  hits: ReadonlyArray<Pick<Hit, "offsetMs">>
  /** The drawing's height in CSS pixels; it fills its container's width. */
  height?: number
  parts?: Parts<"root" | "band" | "zero" | "mark" | "label">
}

/**
 * Every note of the take in order, left to right, placed up when late and
 * down when early, over a band of ±TIGHT_MS. Each mark carries its offset in
 * `data-offset-ms` and a tooltip; the last also has `data-last`. The marks
 * and band draw in the text color, so the app's CSS restyles any of them.
 */
export function OffsetChart({ hits, height = 120, parts }: OffsetChartProps) {
  const range = chartRangeMs(hits)
  const y = (ms: number) => PAD + ((range - ms) / (2 * range)) * (height - 2 * PAD)
  const x = (i: number) => `${(((i + 0.5) / hits.length) * 100).toFixed(3)}%`
  return (
    <svg
      {...partProps(parts, "root")}
      width="100%"
      height={height}
      role="img"
      aria-label={`${hits.length} ${hits.length === 1 ? "note" : "notes"} in order; up is late, down is early`}
    >
      <rect
        {...partProps(parts, "band")}
        x="0"
        y={y(TIGHT_MS)}
        width="100%"
        height={y(-TIGHT_MS) - y(TIGHT_MS)}
        fill="currentColor"
        fillOpacity={0.1}
      />
      <line
        {...partProps(parts, "zero")}
        x1="0"
        x2="100%"
        y1={y(0)}
        y2={y(0)}
        stroke="currentColor"
        strokeOpacity={0.4}
      />
      <text {...partProps(parts, "label")} x="0" y={PAD + 4} fill="currentColor" fontSize={11}>
        {`${signedMs(range)} late`}
      </text>
      <text {...partProps(parts, "label")} x="0" y={height - PAD} fill="currentColor" fontSize={11}>
        {`${signedMs(-range)} early`}
      </text>
      {hits.map((hit, i) => (
        <circle
          {...partProps(parts, "mark")}
          key={i}
          cx={x(i)}
          cy={y(hit.offsetMs)}
          r={i === hits.length - 1 ? 5 : 3.5}
          fill="currentColor"
          data-offset-ms={hit.offsetMs.toFixed(2)}
          data-last={i === hits.length - 1 ? "" : undefined}
        >
          <title>{`Note ${i + 1}: ${signedMs(hit.offsetMs)}`}</title>
        </circle>
      ))}
    </svg>
  )
}

/** Space above and below the drawing's range, for its labels and the marks' radius. */
const PAD = 10

export type TakeSummaryProps = {
  hits: ReadonlyArray<Pick<Hit, "offsetMs">>
  parts?: Parts<"root" | "item" | "label" | "value">
}

/** The take's notes in four numbers: how many, their average offset, their spread and the share within ±TIGHT_MS. */
export function TakeSummary({ hits, parts }: TakeSummaryProps) {
  return (
    <dl {...partProps(parts, "root")}>
      {hitTiles(hits).map(([label, value]) => (
        <div {...partProps(parts, "item")} key={label}>
          <dt {...partProps(parts, "label")}>{label}</dt>
          <dd {...partProps(parts, "value")}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export type MicMeterProps = {
  /** `Take.level`. */
  peak: number
  parts?: Parts<"root" | "fill">
}

/** The mic's level, from -60 dBFS (empty) to full scale. The fill's width is set inline; the app gives it a height and color. */
export function MicMeter({ peak, parts }: MicMeterProps) {
  const fill = Math.round(meterFill(peak) * 100)
  return (
    <div
      {...partProps(parts, "root")}
      role="meter"
      aria-label="Microphone level"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={fill}
    >
      <div {...partProps(parts, "fill")} style={{ width: `${fill}%` }} />
    </div>
  )
}
