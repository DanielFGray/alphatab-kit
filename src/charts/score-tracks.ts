/**
 * The tracks of a score as a player picks them. A Guitar Pro file can name a
 * track with spaces only or not at all, so the default label falls back to the
 * track's place in the file.
 */
export type TrackOption = { readonly index: number; readonly label: string }

/**
 * One option per track, labelled by `label` (default: the trimmed name, or
 * "Track n" when the name is blank). `label` receives the caller's own track
 * type, so an app can build a label from fields such as a short name.
 */
export function trackOptions<T extends { readonly name: string }>(
  tracks: ReadonlyArray<T>,
  label: (track: T, index: number) => string = defaultTrackLabel,
): Array<TrackOption> {
  return tracks.map((track, index) => ({ index, label: label(track, index) }))
}

function defaultTrackLabel(track: { readonly name: string }, index: number): string {
  return track.name.trim() || `Track ${index + 1}`
}
