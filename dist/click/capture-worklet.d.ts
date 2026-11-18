/**
 * The mic capture processor, which runs on the audio thread. It sends the mic's
 * first channel to the page in blocks, each tagged with the context frame of
 * its first sample, so the page can time every sample on the AudioContext
 * clock. A quantum with no input (the mic not yet connected) is sent as
 * silence, which keeps blocks contiguous.
 *
 * `captureWorkletSource` turns this function into the worklet file, which the
 * `gigbag.js/vite` plugin serves at `CAPTURE_WORKLET_PATH`; the engine loads it
 * from there. A file on the app's own origin is covered by `script-src 'self'`,
 * which governs worklets (`worker-src` does not), so no app loosens its
 * Content-Security-Policy. The function must stay self-contained: it runs in
 * another global scope, where nothing outside it exists. That is also why the
 * class sets its fields in the constructor: an app built for an older target
 * lowers class field declarations to helper calls defined outside the
 * function.
 */
export declare const CAPTURE_PROCESSOR_NAME = "capture";
/** Where the Vite plugin serves the worklet file, and where the engine loads it from. */
export declare const CAPTURE_WORKLET_PATH = "/gigbag/capture-worklet.js";
/** The worklet file's text: a script that registers the processor. */
export declare function captureWorkletSource(): string;
