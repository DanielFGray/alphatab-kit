/**
 * The shared player's mixer settings as plain data: a master volume and, per
 * track, a volume, solo and mute. Pure and free of alphaTab and React, so an
 * app can store a `Mixer` as JSON and the hook can apply it to the player.
 */
/** Lowest volume alphaTab accepts for the master and for a track, as a fraction of normal volume. */
export const MIN_VOLUME = 0;
/** Highest volume alphaTab accepts. Its `masterVolume` and `changeTrackVolume` docs both say "percent (0-1)". */
export const MAX_VOLUME = 1;
/** A mixer for `trackCount` tracks at normal volume, nothing soloed or muted. */
export function createMixer(trackCount) {
    return {
        master: 1,
        tracks: Array.from({ length: trackCount }, defaultTrack),
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
 * Makes saved settings fit a score with `trackCount` tracks. Tracks past the
 * score's end are dropped, missing tracks get defaults, and volumes are
 * clamped. A saved mixer can come from an older revision of the score, so
 * its track count is not trusted.
 */
export function fitMixer(saved, trackCount) {
    return {
        master: clampVolume(saved.master),
        tracks: Array.from({ length: trackCount }, (_, index) => {
            const track = saved.tracks[index];
            if (!track)
                return defaultTrack();
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
function defaultTrack() {
    return { volume: 1, solo: false, mute: false };
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
