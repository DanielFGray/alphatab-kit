/**
 * The display settings alphaTab starts with for a container `width` pixels
 * wide at a user `zoom`. `scale` is the width band's base scale times the
 * clamped zoom, and `stretchForce` is `stretchForWidth(width)`.
 */
export declare function displayForWidth(width: number, zoom: number): {
    scale: number;
    stretchForce: number;
};
/**
 * How tightly alphaTab packs bars in a page-layout row, for a container this
 * wide. A value of 1 stretches each row to the full width, so a narrow row
 * holds one bar; a lower value packs more bars into each row. Narrow phone
 * widths pack tighter, because a bar at full stretch is wider than the screen.
 */
export declare function stretchForWidth(width: number): number;
