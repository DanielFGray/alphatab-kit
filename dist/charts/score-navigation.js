/**
 * Every beat of the given tracks, one entry per start tick, sorted by tick.
 * Tracks are scanned in order, so when two tracks have a beat on the same
 * tick, the earlier track's beat is kept.
 */
export function collectBeats(tracks) {
    const beatsByTick = new Map();
    for (const track of tracks) {
        for (const staff of track.staves) {
            for (const bar of staff.bars) {
                for (const voice of bar.voices) {
                    for (const beat of voice.beats) {
                        if (beatsByTick.has(beat.absolutePlaybackStart)) {
                            continue;
                        }
                        beatsByTick.set(beat.absolutePlaybackStart, {
                            beat,
                            startTick: beat.absolutePlaybackStart,
                            masterBarIndex: beat.voice.bar.masterBar.index,
                        });
                    }
                }
            }
        }
    }
    return [...beatsByTick.values()].sort((left, right) => left.startTick - right.startTick);
}
/**
 * Index of the last beat that starts at or before `tick`. Returns 0 when the
 * tick comes before the first beat, and -1 when there are no beats at all.
 * Binary search, so `beats` must already be sorted by `startTick`.
 */
export function beatIndexAt(beats, tick) {
    if (beats.length === 0) {
        return -1;
    }
    let low = 0;
    let high = beats.length - 1;
    let result = 0;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const middleBeat = beats[middle];
        if (!middleBeat || middleBeat.startTick > tick) {
            high = middle - 1;
            continue;
        }
        result = middle;
        low = middle + 1;
    }
    return result;
}
/**
 * The first or last beat of the bar that holds `beats[currentIndex]`, or null
 * when the index is out of range. Stops at the bar boundary, so a bar with
 * one beat returns that beat for both edges.
 */
export function barEdgeBeat(beats, currentIndex, edge) {
    const currentBeat = beats[currentIndex];
    if (!currentBeat) {
        return null;
    }
    let index = currentIndex;
    if (edge === "start") {
        while (index > 0 && beats[index - 1]?.masterBarIndex === currentBeat.masterBarIndex) {
            index -= 1;
        }
    }
    else {
        while (index < beats.length - 1 && beats[index + 1]?.masterBarIndex === currentBeat.masterBarIndex) {
            index += 1;
        }
    }
    return beats[index] ?? null;
}
