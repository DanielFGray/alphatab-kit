/**
 * The shared player's mixer settings as plain data: a master volume and, per
 * track, a volume, solo and mute. Pure and free of alphaTab and React, so an
 * app can store a `Mixer` as JSON and the hook can apply it to the player.
 */
/** Lowest volume alphaTab accepts for the master and for a track, as a fraction of normal volume. */
export declare const MIN_VOLUME = 0;
/** Highest volume alphaTab accepts. Its `masterVolume` and `changeTrackVolume` docs both say "percent (0-1)". */
export declare const MAX_VOLUME = 1;
export type TrackMix = {
    readonly volume: number;
    readonly solo: boolean;
    readonly mute: boolean;
};
/** Tracks are indexed as in the score. */
export type Mixer = {
    readonly master: number;
    readonly tracks: ReadonlyArray<TrackMix>;
};
/**
 * A mixer with one track per entry of `fileVolumes`, nothing soloed or muted. The master is at normal
 * volume. Each track starts at the volume its file gives it (alphaTab's `playbackInfo.volume / 16`),
 * because setting a track's volume replaces that value rather than scaling it: a default of 1 would
 * overwrite the file's own balance between tracks.
 */
export declare function createMixer(fileVolumes: ReadonlyArray<number>): Mixer;
/** The mixer with the master volume set, clamped to the range alphaTab accepts. */
export declare function setMaster(mixer: Mixer, master: number): Mixer;
/** The mixer with one track's volume set, clamped to the range alphaTab accepts. Throws a RangeError for an index outside the score. */
export declare function setTrackVolume(mixer: Mixer, track: number, volume: number): Mixer;
/** The mixer with one track's solo flag set. Stored as given: which tracks are audible is alphaTab's decision. Throws a RangeError for an index outside the score. */
export declare function setSolo(mixer: Mixer, track: number, solo: boolean): Mixer;
/** The mixer with one track's mute flag set. Stored as given: which tracks are audible is alphaTab's decision. Throws a RangeError for an index outside the score. */
export declare function setMute(mixer: Mixer, track: number, mute: boolean): Mixer;
/**
 * Makes saved settings fit a score whose tracks have the volumes `fileVolumes` (one entry per track).
 * Tracks past the score's end are dropped, missing tracks get the file's volume as in `createMixer`,
 * and volumes are clamped. A saved mixer can come from an older revision of the score, so its track
 * count is not trusted.
 */
export declare function fitMixer(saved: Mixer, fileVolumes: ReadonlyArray<number>): Mixer;
/** A volume inside the range alphaTab accepts. A value that is not a number becomes normal volume. */
export declare function clampVolume(volume: number): number;
