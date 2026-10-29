/**
 * Japanese speech via the Web Speech API.
 *
 * Many systems (Firefox on Windows/Linux, Windows without the Japanese language pack) have no
 * Japanese voice; speaking kana with an English voice is silent or garbled. In that case nothing
 * is spoken and a `kh:speech-unavailable` event is dispatched so the app can explain why.
 */
export const SPEECH_UNAVAILABLE_EVENT = 'kh:speech-unavailable';
export type SpeechUnavailableReason = 'unsupported' | 'no-voice';

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/** Voices load asynchronously in Chrome; wait for them once (up to 1.5 s). */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      const synth = window.speechSynthesis;
      const ready = synth.getVoices();
      if (ready.length > 0) {
        resolve(ready);
        return;
      }
      const done = () => {
        synth.removeEventListener('voiceschanged', done);
        resolve(synth.getVoices());
      };
      synth.addEventListener('voiceschanged', done);
      window.setTimeout(done, 1500);
    });
    // An empty list may just mean the browser was slow; ask again next time
    voicesPromise.then((voices) => {
      if (voices.length === 0) voicesPromise = null;
    });
  }
  return voicesPromise;
}

function pickJapaneseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const ja = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
  return ja.find((v) => v.localService) ?? ja[0];
}

function reportUnavailable(reason: SpeechUnavailableReason) {
  window.dispatchEvent(new CustomEvent<SpeechUnavailableReason>(SPEECH_UNAVAILABLE_EVENT, { detail: reason }));
}

export async function speakJapanese(text: string, rate: number = 0.9): Promise<void> {
  if (!('speechSynthesis' in window)) {
    reportUnavailable('unsupported');
    return;
  }

  // Strip okurigana dots and affix dashes: "まな.ぶ" → "まなぶ", "-び" → "び"
  const cleanText = text.replace(/[.\-–]/g, '').trim();
  if (!cleanText) return;

  const voice = pickJapaneseVoice(await loadVoices());
  if (!voice) {
    reportUnavailable('no-voice');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = voice.lang;
  utterance.voice = voice;
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}
