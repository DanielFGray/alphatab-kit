/**
 * A score link: a range of bars from a score chart, drawn inside a lyrics
 * chart. The chart text holds one directive per link:
 *
 *   {score: chart=<id> track="<name>" section="<marker>"}
 *   {score: chart=<id> track="<name>" bars=<from>-<to>}
 *
 * The directive names the score chart, never its file, so a re-upload of that
 * chart changes every link to it. Bars are 1-based, as the score shows them.
 *
 * Pure: the server and the browser share it, and it needs no DOM.
 */
export type ScoreLink = {
    readonly chartId: string;
    /** The track's label, as the score's track picker shows it. */
    readonly track: string;
    readonly range: {
        readonly section: string;
    } | {
        readonly from: number;
        readonly to: number;
    };
};
/** A directive's value read as a link, or the reason it cannot be read. */
export type ScoreLinkReading = {
    readonly link: ScoreLink;
} | {
    readonly problem: string;
};
/** What a score holds, as a link needs it: track labels, section markers and the bar count. */
export type ScoreOutline = {
    readonly tracks: ReadonlyArray<string>;
    readonly sections: ReadonlyArray<{
        readonly index: number;
        readonly marker: string;
    }>;
    readonly bars: number;
};
/** The bars a link draws: `track` indexes the outline's tracks; `first` and `last` are 0-based and inclusive. */
export type DrawnRange = {
    readonly track: number;
    readonly first: number;
    readonly last: number;
};
/** Reads a directive's value (the text after `score:`). */
export declare function readScoreLink(value: string): ScoreLinkReading;
/** A link's directive text (after `score:`): the inverse of readScoreLink. */
export declare function formatScoreLink(link: ScoreLink): string;
/**
 * The bars a link draws in a score. A section runs from its marker's bar up to
 * the bar before the next marker, or to the last bar. A bar range must lie
 * inside the score, so a link whose bars moved past the end says so.
 */
export declare function drawnRange(link: ScoreLink, outline: ScoreOutline): DrawnRange | {
    readonly problem: string;
};
/**
 * Each section marker with the bars it covers (0-based, inclusive). A link names a
 * section by its marker, so a marker used by two sections cannot be linked to
 * either: `repeated` is set on both, and the bars must be named instead.
 */
export declare function sectionChoices(outline: ScoreOutline): Array<{
    marker: string;
    first: number;
    last: number;
    repeated: boolean;
}>;
/** The fields of an alphaTab bar that an excerpt changes. */
export type ExcerptBar<Tempo> = {
    isRepeatStart: boolean;
    repeatCount: number;
    tempoAutomations: Array<Tempo>;
};
/**
 * Makes bars `first` to `last` play as an excerpt. A repeat sign whose partner
 * lies outside the range is cleared: a close with no open in the excerpt would
 * repeat back to the excerpt's start, and an open with no close would repeat
 * to a close the excerpt does not show. The tempo in effect at `first` is
 * written on it, since a tempo change is stored on the bar that makes it.
 * Edits the bars in place.
 */
export declare function excerpt<Tempo>(bars: Array<ExcerptBar<Tempo>>, first: number, last: number): void;
