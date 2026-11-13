/**
 * One option per track, labelled by `label` (default: the trimmed name, or
 * "Track n" when the name is blank). `label` receives the caller's own track
 * type, so an app can build a label from fields such as a short name.
 */
export function trackOptions(tracks, label = defaultTrackLabel) {
    return tracks.map((track, index) => ({ index, label: label(track, index) }));
}
function defaultTrackLabel(track, index) {
    return track.name.trim() || `Track ${index + 1}`;
}
