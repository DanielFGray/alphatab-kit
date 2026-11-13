/**
 * The degree each note a guitar shape sounds is, as `R`, `3`, `b7` and so on.
 * Pure and free of the DOM, so the diagram and the tests share it.
 */
import type { Spelling } from "./spelling.ts";
import type { Voicing } from "./fretting.ts";
/**
 * One label per string of `voicing`, in the same order. An open string counts as
 * sounding: it gets a label like any other. The label is null where the string
 * is muted, or sounds a pitch the chord does not name.
 *
 * The name is the chord's own degree number with `b` or `#` for how far it sits
 * from the major scale: `3` a major 3rd above the root, `b3` a minor one, `b7`
 * a minor 7th, `#11` a raised 11th. Two tones on one pitch class keep the
 * lower degree's name, so a sus 4th reads `4` and not `11`.
 */
export declare function degrees(chord: Spelling, voicing: Voicing, tuning?: ReadonlyArray<number>): ReadonlyArray<string | null>;
export declare function degreeName(degree: number, semitones: number): string;
