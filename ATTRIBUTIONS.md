# Attributions

This file lists every outside source gigbag.js (this kit) uses: code we adapted, data we fitted to, fonts we serve, research the code follows, and libraries whose license asks more than MIT does.

When a change brings in a source, add its entry in the same commit, with a link. The code comment that uses the source names it, so a reader can find the entry here.

## License condition for every consumer

ChordSheetJS is GPL-2.0-only. Its only non-test import is `src/charts/lyrics.ts`. These modules import `lyrics.ts`, directly or through another module, so they carry the condition too:

- `src/charts/lyrics.ts`
- `src/charts/doc.ts`
- `src/charts/marks.ts`
- `src/charts/scanned.ts`
- `src/charts/score-chart.ts`
- `src/charts/suggest.ts`

An app whose client bundle includes any of these modules takes on the GPL-2.0 condition for that bundle. The test files import ChordSheetJS too, but they are not shipped.

dfg.rocks and setlist both accept this condition.

## Data

- **ChordSheetJS chord table**: the scoring weights in `src/charts/voicing.ts` were fitted to its guitar shapes, and `src/charts/spelling.test.ts` checks that every one of its 902 chord names spells. GPL-2.0-only. <https://github.com/martijnversluis/ChordSheetJS>
- **Rock corpus (rs200)** by Trevor de Clercq and David Temperley, _A corpus analysis of rock harmony_. CC BY 4.0. `src/charts/rock-prior.json` holds the class unigram and bigram counts that `scripts/buildRockPrior.ts` builds from both analysts' readings of every song. `src/charts/suggest.ts` uses those counts as the fallback prior. `scripts/rockCorpus.ts`, `scripts/checkNumerals.ts` and `scripts/checkSuggestions.ts` read the corpus to check the code against it. The attribution is in the `source` field of `rock-prior.json`. <https://rockcorpus.midside.com>

## Fonts

- **Bravura** by Steinberg Media Technologies: the music font that alphaTab's dist folder holds as `font/Bravura.woff2`. `src/vite.ts` serves it under `/alphatab/font/`, `src/react.tsx` preloads it, and `src/static.ts` names it in the `@font-face` of a standalone SVG. SIL Open Font License 1.1. <https://github.com/steinbergmedia/bravura>. Glyph names follow SMuFL: <https://w3c.github.io/smufl/latest/>

## Libraries with conditions beyond MIT

- **alphaTab** (`@coderline/alphatab` 1.9.0-alpha.1891): draws and plays scores and phrases. The kit's one patch, `patches/alphatab-1.9.0-alpha.1891.patch`, changes alphaTab's `dist/`. `src/cli.ts` copies it into a consumer's `patches/` and pins alphaTab to that version. MPL-2.0. <https://alphatab.net>
- **ChordSheetJS** (18.0.0): parses, transposes and formats stored ChordPro in `src/charts/lyrics.ts`. GPL-2.0-only. See the license condition above. <https://github.com/martijnversluis/ChordSheetJS>
- **diff-match-patch** (1.0.5): maps a player's marks through later chart revisions (`src/charts/follow.ts`). Apache-2.0. <https://github.com/JackuB/diff-match-patch>

## Research

- **Krumhansl, C. L.** (1990). _Cognitive Foundations of Musical Pitch_. Oxford University Press. The key profiles and the correlation method in `guessKey` (`src/charts/lyrics.ts`). <https://global.oup.com/academic/product/cognitive-foundations-of-musical-pitch-9780195054663>
- **Fisher, N. I.** (1993). _Statistical Analysis of Circular Data_. Cambridge University Press. The circular mean that `readTake` in `src/charts/take.ts` uses to find a take's offset from the grid, where a note just before a slot and one just after it pull the same way. <https://doi.org/10.1017/CBO9780511564345>

Read while planning key detection from chord symbols; no code follows these yet:

- **Noland, K. and Sandler, M.** (2006). "Key Estimation Using a Hidden Markov Model." ISMIR 2006. A 24-state HMM over chord transitions; 91% correct on 110 Beatles songs. <https://archives.ismir.net/ismir2006/paper/000091.pdf>
- **Lee, K.** (2007). "A Unified System for Chord Transcription and Key Extraction Using Hidden Markov Models." ISMIR 2007. One HMM per key. <https://archives.ismir.net/ismir2007/paper/000245.pdf>
- **Temperley, D. and de Clercq, T.** (2013). "Statistical Analysis of Harmony and Melody in Rock Music." _Journal of New Music Research_ 42(3): 187–204. Key finding from chord roots and metrical position. <https://doi.org/10.1080/09298215.2013.788039>. Author copy: <https://www.midside.com/publications/temperley_declercq_2013.pdf>
- **Bunks, C. and Weyde, T.** (2022). "Jazz Contrafact Detection." arXiv:2208.00792. Picks the key signature whose diatonic chords hold the most beats. <https://arxiv.org/abs/2208.00792>

## Test material

- **"Amazing Grace"**: words by John Newton (1779), in the public domain. `test/fixtures/amazing-grace.txt` holds the text. `test/fixtures/make-scans.ts` typesets it into the PDF, PNG, word-box and Tesseract fixtures beside it (`amazing-grace.pdf`, `amazing-grace.png`, `amazing-grace.bbox.xhtml`, `amazing-grace.tsv`).
