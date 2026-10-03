const FEMALE_VOICE_NAMES = [
  'female',
  'zira',
  'aria',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'fiona',
  'tessa',
  'jenny',
  'susan',
  'hazel',
  'jane',
  'emma',
  'ava',
  'allison',
  'cortana',
  'microsoft jenny',
  'microsoft sonia',
  'microsoft libby',
  'google uk english female',
  'google us english',
];

export const getFemaleVoice = (language) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const languagePrefix = String(language || 'en-US').toLowerCase().split('-')[0];
  const matchingLanguageVoices = voices.filter((voice) => (
    String(voice.lang || '').toLowerCase().startsWith(languagePrefix)
  ));
  const candidates = matchingLanguageVoices.length ? matchingLanguageVoices : voices;

  return candidates.find((voice) => {
    const voiceName = String(voice.name || '').toLowerCase();
    return FEMALE_VOICE_NAMES.some((name) => voiceName.includes(name));
  }) ?? null;
};

export const configureFemaleVoice = (utterance, language) => {
  const voice = getFemaleVoice(language);
  if (voice) {
    utterance.voice = voice;
  }
  return utterance;
};

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
  configureFemaleVoice(utterance, options.lang);

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