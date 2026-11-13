/**
 * Practice time the score player counts while a score plays. The clock is
 * pure: the caller passes the current time in milliseconds, so no timers or
 * `Date.now()` live here, and the player and the tests share one copy.
 */

/**
 * `pendingMs` is playing time not yet reported. `since` is the time playing
 * last started or was last ticked, or null while stopped.
 */
export type PracticeClock = {
  readonly pendingMs: number
  readonly since: number | null
}

/** A stopped clock with nothing pending. */
export const STOPPED_CLOCK: PracticeClock = { pendingMs: 0, since: null }

/**
 * The pending time the player reports during play, once it reaches this many
 * milliseconds. Reporting is coarser than the one-second tick so the player
 * writes to storage about every five seconds.
 */
export const REPORT_THRESHOLD_MS = 5000

/** The clock after playback starts at `now`. Returns the same clock when already playing. */
export function start(clock: PracticeClock, now: number): PracticeClock {
  if (clock.since !== null) return clock
  return { pendingMs: clock.pendingMs, since: now }
}

/**
 * The clock after playback stops at `now`: the time since the last tick joins
 * the pending time. Returns the same clock when already stopped.
 */
export function stop(clock: PracticeClock, now: number): PracticeClock {
  if (clock.since === null) return clock
  return { pendingMs: clock.pendingMs + (now - clock.since), since: null }
}

/**
 * The clock after a tick at `now`: the time since the last tick joins the
 * pending time, and the tick becomes the new start. Returns the same clock when
 * stopped, because a stopped clock has no elapsed time to count.
 */
export function tick(clock: PracticeClock, now: number): PracticeClock {
  if (clock.since === null) return clock
  return { pendingMs: clock.pendingMs + (now - clock.since), since: now }
}

/**
 * Whole seconds to report from the pending time, and the clock with those
 * seconds removed. The seconds are reported only when at least `minMs` is
 * pending, so the player passes `REPORT_THRESHOLD_MS` during play and a lower
 * bound when it stops. Returns the same clock when nothing is reported.
 */
export function takeWholeSeconds(
  clock: PracticeClock,
  minMs: number,
): { readonly seconds: number; readonly clock: PracticeClock } {
  if (clock.pendingMs < minMs) return { seconds: 0, clock }
  const seconds = Math.floor(clock.pendingMs / 1000)
  if (seconds === 0) return { seconds: 0, clock }
  return { seconds, clock: { pendingMs: clock.pendingMs - seconds * 1000, since: clock.since } }
}
