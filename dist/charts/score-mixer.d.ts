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
/** A mixer for `trackCount` tracks at normal volume, nothing soloed or muted. */
export declare function createMixer(trackCount: number): Mixer;
/** The mixer with the master volume set, clamped to the range alphaTab accepts. */
export declare function setMaster(mixer: Mixer, master: number): Mixer;
/** The mixer with one track's volume set, clamped to the range alphaTab accepts. Throws a RangeError for an index outside the score. */
export declare function setTrackVolume(mixer: Mixer, track: number, volume: number): Mixer;
/** The mixer with one track's solo flag set. Stored as given: which tracks are audible is alphaTab's decision. Throws a RangeError for an index outside the score. */
export declare function setSolo(mixer: Mixer, track: number, solo: boolean): Mixer;
/** The mixer with one track's mute flag set. Stored as given: which tracks are audible is alphaTab's decision. Throws a RangeError for an index outside the score. */
export declare function setMute(mixer: Mixer, track: number, mute: boolean): Mixer;
/**
 * Makes saved settings fit a score with `trackCount` tracks. Tracks past the
 * score's end are dropped, missing tracks get defaults, and volumes are
 * clamped. A saved mixer can come from an older revision of the score, so
 * its track count is not trusted.
 */
export declare function fitMixer(saved: Mixer, trackCount: number): Mixer;
/** A volume inside the range alphaTab accepts. A value that is not a number becomes normal volume. */
export declare function clampVolume(volume: number): number;
