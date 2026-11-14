import { Effect, Fiber, Stream } from "effect";
import { useEffect, useMemo, useState } from "react";
import { clickTrack } from "./engine.js";
import { NEW_TAKE, takeHits, takeStep } from "./take.js";
/**
 * Runs the click while `mode` is not "off", and folds what it hears into a
 * take. A change of mode, tempo, bar or mic starts a new take; leaving the
 * page stops the audio and closes the mic. Browser APIs are touched only in
 * effects, so a server render shows an empty take.
 */
export function useClickTrack({ mode, bpm, beatsPerBar, subdivision, micId }) {
    const [take, setTake] = useState(NEW_TAKE);
    const mics = useMics(take.device);
    useEffect(() => {
        if (mode === "off")
            return;
        setTake(NEW_TAKE);
        const options = { bpm, beatsPerBar, listen: mode === "listen", ...(micId === null ? {} : { micId }) };
        const fiber = Effect.runFork(Stream.runForEach(clickTrack(options), (event) => Effect.sync(() => setTake((take) => takeStep(take, event)))));
        return () => {
            Effect.runFork(Fiber.interrupt(fiber));
            // The take stays on show; only what is live about it ends.
            setTake((take) => ({ ...take, beat: null, level: 0 }));
        };
    }, [mode, bpm, beatsPerBar, micId]);
    // The mic level updates the take about ten times a second; the hits change only with a note.
    const { notesMs, latencyMs } = take;
    const hits = useMemo(() => takeHits({ notesMs, latencyMs }, bpm, subdivision), [notesMs, latencyMs, bpm, subdivision]);
    return { take, hits, mics };
}
/**
 * The browser's audio inputs, read again when one is plugged in or out, and
 * when a mic opens (`openedDevice` changes): until the page has had mic
 * access, browsers hide the inputs' names, and some list only one input.
 */
function useMics(openedDevice) {
    const [mics, setMics] = useState([]);
    useEffect(() => {
        const devices = navigator.mediaDevices;
        if (devices === undefined)
            return;
        let live = true;
        const refresh = () => void devices.enumerateDevices().then((all) => {
            if (live)
                setMics(micsFrom(all));
        }, () => { });
        refresh();
        devices.addEventListener("devicechange", refresh);
        return () => {
            live = false;
            devices.removeEventListener("devicechange", refresh);
        };
    }, [openedDevice]);
    return mics;
}
/**
 * The audio inputs among `devices`, named. Before mic access a browser may
 * list inputs with an empty `deviceId`, which cannot be asked for; they are
 * left out.
 */
export const micsFrom = (devices) => devices
    .filter((device) => device.kind === "audioinput" && device.deviceId !== "")
    .map((device, i) => ({ id: device.deviceId, label: device.label || `Microphone ${i + 1}` }));
