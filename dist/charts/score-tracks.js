export function trackOptions(tracks) {
    return tracks.map((track, index) => ({ index, label: track.name.trim() || `Track ${index + 1}` }));
}
