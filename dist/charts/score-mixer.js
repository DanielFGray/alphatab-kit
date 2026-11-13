/**
 * The shared player's mixer settings as plain data: a master volume and, per
 * track, a volume, solo and mute. Pure and free of alphaTab and React, so an
 * app can store a `Mixer` as JSON and the hook can apply it to the player.
 */
/** Lowest volume alphaTab accepts for the master and for a track, as a fraction of normal volume. */
export const MIN_VOLUME = 0;
/** Highest volume alphaTab accepts. Its `masterVolume` and `changeTrackVolume` docs both say "percent (0-1)". */
export const MAX_VOLUME = 1;
/**
 * A mixer with one track per entry of `fileVolumes`, nothing soloed or muted. The master is at normal
 * volume. Each track starts at the volume its file gives it (alphaTab's `playbackInfo.volume / 16`),
 * because setting a track's volume replaces that value rather than scaling it: a default of 1 would
 * overwrite the file's own balance between tracks.
 */
export function createMixer(fileVolumes) {
    return {
        master: 1,
        tracks: fileVolumes.map((fileVolume) => defaultTrack(fileVolume)),
    };
}
/** The mixer with the master volume set, clamped to the range alphaTab accepts. */
export function setMaster(mixer, master) {
    return { ...mixer, master: clampVolume(master) };
}
/** The mixer with one track's volume set, clamped to the range alphaTab accepts. Throws a RangeError for an index outside the score. */
export function setTrackVolume(mixer, track, volume) {
    return updateTrack(mixer, track, { volume: clampVolume(volume) });
}
/** The mixer with one track's solo flag set. Stored as given: which tracks are audible is alphaTab's decision. Throws a RangeError for an index outside the score. */
export function setSolo(mixer, track, solo) {
    return updateTrack(mixer, track, { solo });
}
/** The mixer with one track's mute flag set. Stored as given: which tracks are audible is alphaTab's decision. Throws a RangeError for an index outside the score. */
export function setMute(mixer, track, mute) {
    return updateTrack(mixer, track, { mute });
}
/**
 * Makes saved settings fit a score whose tracks have the volumes `fileVolumes` (one entry per track).
 * Tracks past the score's end are dropped, missing tracks get the file's volume as in `createMixer`,
 * and volumes are clamped. A saved mixer can come from an older revision of the score, so its track
 * count is not trusted.
 */
export function fitMixer(saved, fileVolumes) {
    return {
        master: clampVolume(saved.master),
        tracks: fileVolumes.map((fileVolume, index) => {
            const track = saved.tracks[index];
            if (!track)
                return defaultTrack(fileVolume);
            return { ...track, volume: clampVolume(track.volume) };
        }),
    };
}
/** A volume inside the range alphaTab accepts. A value that is not a number becomes normal volume. */
export function clampVolume(volume) {
    if (!Number.isFinite(volume))
        return 1;
    return Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, volume));
}
function defaultTrack(fileVolume) {
    return { volume: clampVolume(fileVolume), solo: false, mute: false };
}
function updateTrack(mixer, track, patch) {
    if (!Number.isInteger(track) || track < 0 || track >= mixer.tracks.length) {
        throw new RangeError(`track ${track} is outside the ${mixer.tracks.length} tracks of the mixer`);
    }
    return {
        ...mixer,
        tracks: mixer.tracks.map((current, index) => (index === track ? { ...current, ...patch } : current)),
    };
}
