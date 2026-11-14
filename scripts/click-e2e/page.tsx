/**
 * The page the click browser test drives: the click hook and every click part,
 * laid out plainly. `?mic=<id>` starts with that mic chosen, as an app that
 * saved a choice would.
 */
import { useState } from "react"
import { createRoot } from "react-dom/client"
import { BeatsPerBarSelect, BpmInput, ClickButton, MicPicker, SubdivisionSelect } from "../../src/click/controls.tsx"
import { MicMeter, OffsetChart, TakeSummary } from "../../src/click/readouts.tsx"
import { takeStatus } from "../../src/click/report.ts"
import type { Subdivision } from "../../src/click/timing.ts"
import { type ClickMode, useClickTrack } from "../../src/click/use-click-track.ts"

function Practice() {
  const [mode, setMode] = useState<ClickMode>("off")
  const [bpm, setBpm] = useState(100)
  const [beatsPerBar, setBeatsPerBar] = useState(4)
  const [subdivision, setSubdivision] = useState<Subdivision>(1)
  const [micId, setMicId] = useState(new URLSearchParams(location.search).get("mic"))
  const { take, hits, mics } = useClickTrack({ mode, bpm, beatsPerBar, subdivision, micId })
  const toggle = (pressed: ClickMode) => setMode(mode === pressed ? "off" : pressed)
  return (
    <main>
      <BpmInput bpm={bpm} onBpm={setBpm} parts={{ input: { "data-test": "bpm" } }} />
      <BeatsPerBarSelect beatsPerBar={beatsPerBar} onBeatsPerBar={setBeatsPerBar} />
      <SubdivisionSelect subdivision={subdivision} onSubdivision={setSubdivision} />
      <MicPicker mics={mics} micId={micId} onMic={setMicId} parts={{ select: { "data-test": "mic" } }} />
      <ClickButton
        label="Listen"
        pressed={mode === "listen"}
        beat={take.beat}
        beatsPerBar={beatsPerBar}
        onToggle={() => toggle("listen")}
        parts={{ root: { "data-test": "listen" } }}
      />
      <p data-test="status">{takeStatus(take, mode === "listen", beatsPerBar)}</p>
      <p data-test="device">{take.device ?? ""}</p>
      <MicMeter peak={take.level} />
      <OffsetChart hits={hits} />
      <TakeSummary hits={hits} />
    </main>
  )
}

createRoot(document.getElementById("root")!).render(<Practice />)
