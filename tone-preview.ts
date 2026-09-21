/**
 * Tiny Web Audio synthesizer backing the "Tone 1"-"Tone 4" options in
 * A/V Notifications, and the "Ring 1"-"Ring 4" options for Ringtone.
 * The shared `Select` component has no per-option preview slot (see the
 * note next to `TonePreviewButton` in `settings-page-tile.tsx`), so
 * instead of previewing a sound from inside the open dropdown, a small
 * speaker button next to each row's Select plays back whichever value
 * is currently chosen for that row.
 *
 * Pure synthesis - no audio asset files to ship. Tones are short sine
 * beeps (single, two-note rise, two-note fall, three quick pulses);
 * ringtones use square/triangle waves instead of sine, on top of their
 * own distinct patterns (double-buzz, trill, ascending chime, low
 * pulse), so a ringtone doesn't just sound like a notification tone in
 * a different pitch - the waveform itself reads as "a phone ringing"
 * rather than "an alert."
 */

export type ToneValue = "tone-1" | "tone-2" | "tone-3" | "tone-4";
export type RingValue = "ring-1" | "ring-2" | "ring-3" | "ring-4";
export type PreviewSoundValue = ToneValue | RingValue;

/** One oscillator burst: frequency (Hz), start offset and duration
 * (seconds, both relative to the preview's own start time), and the
 * oscillator waveform (defaults to "sine" when omitted). */
interface ToneNote {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
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

const RING_NOTES: Record<RingValue, ToneNote[]> = {
  // Classic double-buzz phone ring: two short square-wave bursts.
  "ring-1": [
    { freq: 400, start: 0, duration: 0.12, type: "square" },
    { freq: 400, start: 0.16, duration: 0.12, type: "square" },
  ],
  // Fast trill alternating between two adjacent notes.
  "ring-2": [
    { freq: 587.33, start: 0, duration: 0.06, type: "triangle" },
    { freq: 659.25, start: 0.07, duration: 0.06, type: "triangle" },
    { freq: 587.33, start: 0.14, duration: 0.06, type: "triangle" },
    { freq: 659.25, start: 0.21, duration: 0.06, type: "triangle" },
  ],
  // Gentle three-note ascending chime.
  "ring-3": [
    { freq: 523.25, start: 0, duration: 0.12 },
    { freq: 659.25, start: 0.11, duration: 0.12 },
    { freq: 784.0, start: 0.22, duration: 0.16 },
  ],
  // Low pulsing buzz.
  "ring-4": [
    { freq: 349.23, start: 0, duration: 0.08, type: "square" },
    { freq: 349.23, start: 0.11, duration: 0.08, type: "square" },
    { freq: 349.23, start: 0.22, duration: 0.1, type: "square" },
  ],
};

const ALL_NOTES: Record<PreviewSoundValue, ToneNote[]> = {
  ...TONE_NOTES,
  ...RING_NOTES,
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

/** Plays the given tone/ringtone's short synthesized preview. No-ops
 * quietly if Web Audio isn't available or `value` isn't recognized. */
export function playTonePreview(value: string): void {
  const ctx = getAudioContext();
  const notes = ALL_NOTES[value as PreviewSoundValue];
  if (!ctx || !notes) return;

  const now = ctx.currentTime;
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.type ?? "sine";
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
