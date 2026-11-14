/**
 * The mic capture processor, which runs on the audio thread. It sends the mic's
 * first channel to the page in blocks, each tagged with the context frame of
 * its first sample, so the page can time every sample on the AudioContext
 * clock. A quantum with no input (the mic not yet connected) is sent as
 * silence, which keeps blocks contiguous.
 *
 * `captureWorkletUrl` loads the processor from a Blob built from this
 * function's source, so the kit needs no bundler support for worklet files and
 * consumers need no asset setup. The function must stay self-contained: it
 * runs in another global scope, where nothing outside it exists. That is also
 * why the class sets its fields in the constructor: an app built for an older
 * target lowers class field declarations to helper calls defined outside the
 * function. A page that sets a Content-Security-Policy needs `blob:` in
 * `script-src` (or `worker-src`).
 */
export declare const CAPTURE_PROCESSOR_NAME = "capture";
/** A URL for `AudioWorklet.addModule`; revoke it once the module has loaded. */
export declare function captureWorkletUrl(): string;
