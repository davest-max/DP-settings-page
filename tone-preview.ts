/**
 * Tiny Web Audio synthesizer backing the "Tone 1"-"Tone 4" options in
 * A/V Notifications. The shared `Select` component has no per-option
 * preview slot (see the note next to `TonePreviewButton` in
 * `settings-page-tile.tsx`), so instead of previewing a tone from inside
 * the open dropdown, a small speaker button next to each row's Select
 * plays back whichever tone is currently chosen for that row.
 *
 * Pure synthesis - no audio asset files to ship - with each tone built
 * to sound clearly distinct from the others played back to back: a
 * single beep, a two-note rise, a two-note fall, and three quick pulses.
 */

export type ToneValue = "tone-1" | "tone-2" | "tone-3" | "tone-4";

/** One oscillator burst: frequency (Hz), start offset and duration
 * (seconds, both relative to the preview's own start time). */
interface ToneNote {
  freq: number;
  start: number;
  duration: number;
}

const TONE_NOTES: Record<ToneValue, ToneNote[]> = {
  "tone-1": [{ freq: 880, start: 0, duration: 0.15 }],
  "tone-2": [
    { freq: 659.25, start: 0, duration: 0.09 },
    { freq: 880, start: 0.1, duration: 0.12 },
  ],
  "tone-3": [
    { freq: 1046.5, start: 0, duration: 0.09 },
    { freq: 783.99, start: 0.1, duration: 0.14 },
  ],
  "tone-4": [
    { freq: 523.25, start: 0, duration: 0.07 },
    { freq: 523.25, start: 0.1, duration: 0.07 },
    { freq: 523.25, start: 0.2, duration: 0.09 },
  ],
};

/** Lazily created and reused across previews - browsers only allow
 * creating/resuming an AudioContext from inside a user-gesture handler,
 * which every call site here is (a click on the preview button). */
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  if (sharedContext.state === "suspended") void sharedContext.resume();
  return sharedContext;
}

/** Plays the given tone's short synthesized preview. No-ops quietly if
 * Web Audio isn't available or `tone` isn't a recognized value. */
export function playTonePreview(tone: string): void {
  const ctx = getAudioContext();
  const notes = TONE_NOTES[tone as ToneValue];
  if (!ctx || !notes) return;

  const now = ctx.currentTime;
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;

    const noteStart = now + note.start;
    const noteEnd = noteStart + note.duration;
    // Quick fade in/out on every burst so it doesn't click at the edges.
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.015);
    gain.gain.setValueAtTime(0.25, Math.max(noteStart + 0.015, noteEnd - 0.02));
    gain.gain.linearRampToValueAtTime(0, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteEnd + 0.02);
  }
}
