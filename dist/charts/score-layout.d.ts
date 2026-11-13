/**
 * How tightly alphaTab packs bars in a page-layout row, for a container this
 * wide. A value of 1 stretches each row to the full width, so a narrow row
 * holds one bar; a lower value packs more bars into each row. Narrow phone
 * widths pack tighter, because a bar at full stretch is wider than the screen.
 */
export declare function stretchForWidth(width: number): number;
