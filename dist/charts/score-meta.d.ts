/**
 * What a Guitar Pro file says about its song: its title, artist and starting
 * tempo, tidied for display. Pure and free of the DOM: the caller reads the
 * file with alphaTab and passes the score's fields here, and the tests pass
 * plain objects.
 */
export type ScoreMeta = {
    readonly title: string | null;
    readonly artist: string | null;
    /** Beats per minute at the start of the score. */
    readonly tempo: number | null;
};
/** The part of an alphaTab score this reads. */
type ScoreLike = {
    readonly title: string;
    readonly artist: string;
    readonly tempo: number;
};
export declare function scoreMeta(score: ScoreLike): ScoreMeta;
export {};
