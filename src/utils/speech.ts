/**
 * Japanese Speech Synthesis Utility
 */
export function speakJapanese(text: string, rate: number = 0.9): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip leading punctuation or dots e.g. "まな.ぶ" -> "まなぶ", "-び" -> "び"
  const cleanText = text.replace(/[\.\-\–]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = rate;

  // Try to find a high quality Japanese voice if available
  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find(v => v.lang.startsWith('ja') || v.lang === 'ja_JP');
  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  window.speechSynthesis.speak(utterance);
}
