/**
 * What a Guitar Pro file says about its song: its title, artist and starting
 * tempo, tidied for display. Pure and free of the DOM: the caller reads the
 * file with alphaTab and passes the score's fields here, and the tests pass
 * plain objects.
 */
export function scoreMeta(score) {
    const tempo = Math.round(score.tempo);
    return {
        title: tidy(score.title),
        artist: tidy(score.artist),
        tempo: tempo >= 1 && tempo <= 999 ? tempo : null,
    };
}
/** The text with runs of whitespace (a file's non-breaking spaces too) as one space, or null if nothing is left. */
function tidy(text) {
    const clean = text.replace(/\s+/gu, " ").trim();
    return clean === "" ? null : clean.slice(0, 500);
}
