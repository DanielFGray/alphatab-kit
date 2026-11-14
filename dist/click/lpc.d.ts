/**
 * Linear prediction: models each sample as a weighted sum of the samples
 * before it. Fitted to a stretch of steady sound (ringing notes, noise), the
 * model predicts that sound well, so the prediction error stays small until
 * something the model has not seen, such as a new note, begins.
 */
/** Prediction weights of the given order for `samples`, by autocorrelation and Levinson-Durbin. */
export declare const predictor: (samples: ArrayLike<number>, order: number) => Float64Array;
/** The prediction error of sample `at` of a signal read through `read`. */
export declare const predictionError: (weights: Float64Array, read: (i: number) => number, at: number) => number;
