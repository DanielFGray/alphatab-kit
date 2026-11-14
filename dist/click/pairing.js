import { MERGE_SECONDS } from "./listener.js";
/** A note further than this from every written onset is an extra note, not a late or early one. */
export const MAX_REACH_MS = 250;
/**
 * Pairs the notes a player played, at `playedMs` after the first written beat
 * as the player heard it (a take's note times minus its measured latency), with
 * the `written` onsets, at their `atMs` on the same clock. Both are in time order.
 */
export function pairTake(playedMs, written) {
    const { groups, groupOf } = groupsOf(written.map((onset) => onset.atMs));
    const reaches = groups.map((group, g) => reachOf(group, groups[g - 1], groups[g + 1]));
    const owners = playedMs.map((atMs) => {
        const g = reaches.findIndex((reach) => atMs < reach.to);
        return g !== -1 && atMs >= reaches[g].from ? g : null;
    });
    const chosen = groups.map((group, g) => playedMs.reduce((best, atMs, i) => owners[i] === g && (best === null || distance(atMs, group) < distance(playedMs[best], group)) ? i : best, null));
    const notes = chosen.map((i, g) => (i === null ? null : playedNote(playedMs[i], groups[g])));
    const used = new Set(chosen);
    return {
        onsets: written.map((onset, j) => ({ written: onset, played: notes[groupOf[j]] })),
        hits: notes.filter((note) => note !== null),
        extra: playedMs.filter((_, i) => !used.has(i)),
    };
}
/** The written times split into groups, and each written onset's group index. */
function groupsOf(writtenMs) {
    const groups = [];
    const groupOf = writtenMs.map((atMs) => {
        const last = groups.at(-1);
        if (last === undefined || atMs - last[0] >= MERGE_SECONDS * 1000)
            groups.push([atMs]);
        else
            last.push(atMs);
        return groups.length - 1;
    });
    return { groups: groups, groupOf };
}
/**
 * Where a group's played note may land: from halfway after the previous group
 * (inclusive) to halfway before the next (exclusive), and at most MAX_REACH_MS
 * outside the group.
 */
function reachOf(group, before, after) {
    const first = group[0];
    const last = group.at(-1);
    return {
        from: Math.max(first - MAX_REACH_MS, before === undefined ? -Infinity : (before.at(-1) + first) / 2),
        to: Math.min(last + MAX_REACH_MS, after === undefined ? Infinity : (last + after[0]) / 2),
    };
}
const playedNote = (atMs, group) => ({ atMs, offsetMs: atMs - nearest(atMs, group) });
const distance = (atMs, group) => Math.abs(atMs - nearest(atMs, group));
const nearest = (atMs, group) => group.reduce((best, onsetMs) => (Math.abs(atMs - onsetMs) < Math.abs(atMs - best) ? onsetMs : best));
