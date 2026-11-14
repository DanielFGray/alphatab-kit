# gigbag.js

Browser music tools shared by dfg.codes, dfg.rocks and setlist.

| Import                                 | What it holds                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gigbag.js`                            | alphaTab asset URLs and settings helpers                                                                                                                                                                                                                      |
| `gigbag.js/vite`                       | the Vite plugin that serves alphaTab's fonts, sound font and script                                                                                                                                                                                           |
| `gigbag.js/react`                      | `StaticScoreFrame`: shows the static score until the player has drawn, and always in print                                                                                                                                                                    |
| `gigbag.js/player/*`                   | the score player: the `useScorePlayer` hook (load, play, seek, speed trainer, tracks and mixer) and its controls                                                                                                                                              |
| `gigbag.js/render`, `gigbag.js/static` | a score as static SVG, on the server or in the browser, with its HTML and print CSS                                                                                                                                                                           |
| `gigbag.js/charts/*`                   | chord charts: ChordPro documents, transposition, voicings, numerals, phrases, recorded takes, a score's notes in time (`score-onsets`)                                                                                                                        |
| `gigbag.js/click/*`                    | a click track that listens on the mic and scores how far each note lands from the beat: the `useClickTrack` hook, its controls (`controls`) and readouts (`readouts`), and `pairing`, which scores a take against written notes such as `charts/score-onsets` |
| `bunx gigbag patch`                    | writes the shared alphaTab patch into an app (see AGENTS.md)                                                                                                                                                                                                  |

## Install

Apps install the kit as a git dependency on a tag (`"gigbag.js": "git+…#vX.Y.Z"`), so container builds see it like any other package. For local work across both repos, `bun link gigbag.js` (without `--save`) in the app replaces the installed copy with a symlink until the next install.

`gigbag.js/click/engine` loads its audio worklet from a `blob:` URL. A page that sets a Content-Security-Policy needs `blob:` in `script-src` or `worker-src`.
