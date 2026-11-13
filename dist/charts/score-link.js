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
/** Reads a directive's value (the text after `score:`). */
export function readScoreLink(value) {
    const fields = new Map();
    for (const match of value.matchAll(/(\w+)=(?:"([^"]*)"|(\S+))/g))
        fields.set(match[1], match[2] ?? match[3]);
    const chartId = fields.get("chart");
    const track = fields.get("track");
    if (chartId === undefined)
        return { problem: "The score link names no chart" };
    if (track === undefined)
        return { problem: "The score link names no track" };
    const section = fields.get("section");
    const bars = fields.get("bars");
    if (section !== undefined && bars === undefined)
        return { link: { chartId, track, range: { section } } };
    if (bars === undefined || section !== undefined)
        return { problem: "The score link needs a section or bars, not both" };
    const numbers = /^(\d+)-(\d+)$/.exec(bars);
    if (numbers === null)
        return { problem: `The bars "${bars}" are not a range such as 5-8` };
    const from = Number(numbers[1]);
    const to = Number(numbers[2]);
    if (from < 1 || to < from)
        return { problem: `The bars ${from}-${to} are not a range of bars` };
    return { link: { chartId, track, range: { from, to } } };
}
/** A link's directive text (after `score:`): the inverse of readScoreLink. */
export function formatScoreLink(link) {
    const range = "section" in link.range ? `section="${link.range.section}"` : `bars=${link.range.from}-${link.range.to}`;
    return `chart=${link.chartId} track="${link.track}" ${range}`;
}
/**
 * The bars a link draws in a score. A section runs from its marker's bar up to
 * the bar before the next marker, or to the last bar. A bar range must lie
 * inside the score, so a link whose bars moved past the end says so.
 */
export function drawnRange(link, outline) {
    const track = outline.tracks.indexOf(link.track);
    if (track === -1)
        return { problem: `No track named "${link.track}" in this score` };
    const range = link.range;
    if ("section" in range) {
        const at = outline.sections.findIndex((s) => s.marker === range.section);
        if (at === -1)
            return { problem: `No section "${range.section}" in this score` };
        return { track, ...sectionSpan(outline, at) };
    }
    const { from, to } = range;
    if (to > outline.bars)
        return { problem: `The bars ${from}-${to} run past the score's ${outline.bars} bars` };
    return { track, first: from - 1, last: to - 1 };
}
/** A section marker's bars, 0-based and inclusive: from its bar to the bar before the next marker, or to the last bar. */
function sectionSpan(outline, at) {
    const next = outline.sections[at + 1];
    return { first: outline.sections[at].index, last: next ? next.index - 1 : outline.bars - 1 };
}
/**
 * Each section marker with the bars it covers (0-based, inclusive). A link names a
 * section by its marker, so a marker used by two sections cannot be linked to
 * either: `repeated` is set on both, and the bars must be named instead.
 */
export function sectionChoices(outline) {
    return outline.sections.map((section, at) => ({
        marker: section.marker,
        ...sectionSpan(outline, at),
        repeated: outline.sections.some((other, i) => i !== at && other.marker === section.marker),
    }));
}
/**
 * Makes bars `first` to `last` play as an excerpt. A repeat sign whose partner
 * lies outside the range is cleared: a close with no open in the excerpt would
 * repeat back to the excerpt's start, and an open with no close would repeat
 * to a close the excerpt does not show. The tempo in effect at `first` is
 * written on it, since a tempo change is stored on the bar that makes it.
 * Edits the bars in place.
 */
export function excerpt(bars, first, last) {
    for (let close = 0; close < bars.length; close++) {
        if (bars[close].repeatCount === 0)
            continue;
        // The open is the last repeat start at or before the close; with none, it is the piece's start.
        let open = 0;
        for (let i = 0; i <= close; i++)
            if (bars[i].isRepeatStart)
                open = i;
        if (close >= first && close <= last && open < first)
            bars[close].repeatCount = 0;
        if (open >= first && open <= last && close > last)
            bars[open].isRepeatStart = false;
    }
    let tempo = null;
    for (let i = 0; i < first; i++)
        if (bars[i].tempoAutomations.length > 0)
            tempo = bars[i].tempoAutomations;
    if (tempo !== null && bars[first].tempoAutomations.length === 0)
        bars[first].tempoAutomations = tempo;
}
