// Chrome has a known bug where onend never fires for utterances longer than ~15s.
// We work around this with a watchdog timer that checks if speech is still active.

let watchdogTimer: ReturnType<typeof setInterval> | null = null;

export function speak(
  text: string,
  options?: {
    rate?: number;
    onEnd?: () => void;
    onStart?: () => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    // No TTS available — fire onEnd immediately so lesson advances
    options?.onEnd?.();
    return null;
  }

  // Clean up any previous speech
  cancelSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to pick a natural-sounding English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Google") || v.name.includes("Natural"))
  );
  if (preferred) utterance.voice = preferred;

  let endFired = false;
  const fireEnd = () => {
    if (endFired) return;
    endFired = true;
    clearWatchdog();
    options?.onEnd?.();
  };

  utterance.onend = fireEnd;
  utterance.onerror = (e) => {
    // "interrupted" is expected when we cancel manually — don't fire onEnd
    if (e.error === "interrupted" || e.error === "canceled") return;
    fireEnd();
  };
  if (options?.onStart) utterance.onstart = options.onStart;

  window.speechSynthesis.speak(utterance);

  // Chrome bug workaround: check every 500ms if speech is still going.
  // If synth reports not speaking and not paused, onend was swallowed — fire it.
  watchdogTimer = setInterval(() => {
    const synth = window.speechSynthesis;
    if (!synth.speaking && !synth.pending && !synth.paused) {
      fireEnd();
    }
  }, 500);

  // Hard timeout: estimate duration from word count. At rate 1, ~150 words/min.
  const wordCount = text.split(/\s+/).length;
  const estimatedMs = (wordCount / 150) * 60 * 1000 * (1 / (options?.rate ?? 1));
  const maxMs = Math.max(estimatedMs + 3000, 8000); // at least 8s, plus 3s buffer
  setTimeout(() => {
    if (!endFired) {
      fireEnd();
    }
  }, maxMs);

  return utterance;
}

function clearWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

export function cancelSpeech() {
  clearWatchdog();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function pauseSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}
