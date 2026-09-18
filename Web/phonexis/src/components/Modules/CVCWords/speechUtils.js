export const speakText = (text, options = {}) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const cleanText = String(text ?? '').trim();
  if (!cleanText) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options.rate ?? 0.9;

  if (options.pitch !== undefined) {
    utterance.pitch = options.pitch;
  }

  if (options.volume !== undefined) {
    utterance.volume = options.volume;
  }

  if (options.onend) {
    utterance.onend = options.onend;
  }

  if (options.onerror) {
    utterance.onerror = options.onerror;
  }

  window.speechSynthesis.speak(utterance);
  return true;
};
