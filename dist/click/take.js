import { placeHit } from "./timing.js";
export const NEW_TAKE = {
    beat: null,
    device: null,
    level: 0,
    latencyMs: null,
    reportedLatencyMs: null,
    missedClick: false,
    notesMs: [],
    dropouts: 0,
    failure: null,
};
export const takeStep = (take, event) => {
    switch (event._tag) {
        case "Beat":
            return { ...take, beat: event.beat };
        case "Listening":
            return { ...take, device: event.device, reportedLatencyMs: event.reportedLatencyMs };
        case "Level":
            return { ...take, level: event.peak };
        case "MeasuredLatency":
            return { ...take, latencyMs: event.latencyMs };
        case "MissedClick":
            return { ...take, missedClick: true };
        case "Note":
            return { ...take, notesMs: [...take.notesMs, event.atMs] };
        case "Dropout":
            return { ...take, dropouts: take.dropouts + 1 };
        case "Failed":
            return { ...take, failure: event.reason };
    }
};
/**
 * The take's notes against the click the player heard. Only the measured
 * delay places a note to the millisecond; the browser's estimate is too rough
 * to score with, so a take without a measured delay has no hits.
 */
export const takeHits = (take, bpm, subdivision) => {
    const { latencyMs } = take;
    if (latencyMs === null)
        return [];
    return take.notesMs.map((atMs) => placeHit(atMs - latencyMs, 60_000 / bpm, subdivision));
};
