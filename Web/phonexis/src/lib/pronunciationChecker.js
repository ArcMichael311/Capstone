const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition;
};

const getVoiceSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('phonexis_voice_settings') || '{}');
  } catch (storageError) {
    return {};
  }
};

// Kid-friendly default: children with reading difficulties should be rewarded for close attempts.
const DEFAULT_THRESHOLD = 60;
const PERFECT_SCORE = 0.9;
const ALMOST_SCORE = 0.4;

// How the speech engine commonly writes each letter name when a child says it.
const LETTER_NAMES = {
  a: ['a', 'ay', 'eh', 'hey', 'ei', 'ae'],
  b: ['b', 'be', 'bee', 'bea', 'bi'],
  c: ['c', 'see', 'sea', 'cee', 'si'],
  d: ['d', 'dee', 'di', 'de'],
  e: ['e', 'ee', 'ea'],
  f: ['f', 'ef', 'eff'],
  g: ['g', 'gee', 'ji', 'jee'],
  h: ['h', 'aitch', 'haitch', 'ach'],
  i: ['i', 'eye', 'aye', 'ai'],
  j: ['j', 'jay', 'jae'],
  k: ['k', 'kay', 'cay', 'okay'],
  l: ['l', 'el', 'ell', 'elle'],
  m: ['m', 'em', 'emm'],
  n: ['n', 'en', 'enn'],
  o: ['o', 'oh', 'owe', 'ow'],
  p: ['p', 'pee', 'pea', 'pe'],
  q: ['q', 'queue', 'cue', 'kew', 'kyu'],
  r: ['r', 'are', 'ar', 'arr'],
  s: ['s', 'es', 'ess'],
  t: ['t', 'tea', 'tee', 'ti'],
  u: ['u', 'you', 'yu', 'yoo', 'ew'],
  v: ['v', 'vee', 'vi'],
  w: ['w', 'double u', 'double you', 'doubleyou', 'dub'],
  x: ['x', 'ex', 'ecks', 'eggs'],
  y: ['y', 'why', 'wye', 'wie'],
  z: ['z', 'zee', 'zed', 'ze'],
};

const FILLER_WORDS = new Set(['um', 'umm', 'uh', 'uhh', 'hmm', 'er', 'erm', 'the', 'a', 'an', 'say', 'its', 'is', 'it']);

export function startPronunciationSession(targetWord, language = 'en-US', options = {}) {
  const SpeechRecognition = getSpeechRecognition();
  const target = normalizeText(targetWord);
  const settings = getVoiceSettings();
  const threshold = options.threshold ?? (Number(settings.threshold) || DEFAULT_THRESHOLD);

  if (!SpeechRecognition) {
    return {
      promise: Promise.reject(new Error('Speech checking is not supported in this browser. Please use Google Chrome or Microsoft Edge.')),
      stop: () => {},
      abort: () => {},
    };
  }

  let settled = false;
  let latestTranscripts = [];
  let timeoutId;
  let resolveResult;
  let rejectResult;
  const promise = new Promise((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const finish = (result, error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutId);
    if (error) rejectResult(error);
    else resolveResult(result);
  };

  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;

  recognition.onresult = (event) => {
    const latestResult = event.results[event.results.length - 1];
    latestTranscripts = Array.from(latestResult, (alternative) => alternative.transcript);
    options.onInterim?.(latestTranscripts[0] || '');
    if (latestResult.isFinal) finish(evaluatePronunciation(latestTranscripts, target, threshold));
  };
  recognition.onerror = (event) => {
    if (event.error === 'aborted') return;
    if (event.error === 'no-speech') {
      finish(evaluatePronunciation(latestTranscripts, target, threshold));
      return;
    }
    finish(null, new Error(getRecognitionErrorMessage(event.error)));
  };
  recognition.onend = () => {
    // Use whatever was heard so far (e.g. the child pressed "Done" before the final result arrived).
    finish(evaluatePronunciation(latestTranscripts, target, threshold));
  };

  try {
    recognition.start();
  } catch (error) {
    finish(null, error);
  }

  timeoutId = setTimeout(() => {
    try {
      recognition.stop();
    } catch (error) {
      finish(null, error);
    }
  }, options.timeout ?? 8000);

  return {
    promise,
    stop: () => {
      try {
        recognition.stop();
      } catch (error) {
        finish(null, error);
      }
    },
    abort: () => {
      settled = true;
      clearTimeout(timeoutId);
      try {
        recognition.abort();
      } catch (error) {
        // already stopped
      }
    },
  };
}

export function startPronunciationCheck(targetWord, language = 'en-US', options = {}) {
  return startPronunciationSession(targetWord, language, options).promise;
}

export function evaluatePronunciation(transcripts, targetWord, threshold = DEFAULT_THRESHOLD) {
  const target = normalizeText(targetWord);
  const alternatives = (transcripts || []).map(normalizeText).filter(Boolean);

  if (!alternatives.length) {
    return {
      success: false,
      accuracy: 0,
      level: 'silent',
      recognized: '',
      heard: '',
      target,
      letterDiff: [],
      tip: '',
      feedback: 'I could not hear you. Hold the microphone close and say it a little louder. 🙂',
    };
  }

  const isLetterTarget = /^[a-z]$/.test(target);
  const evaluation = isLetterTarget
    ? evaluateLetter(alternatives, target)
    : evaluateWord(alternatives, target);

  const score = evaluation.score;
  const success = score >= threshold / 100;
  const level = score >= PERFECT_SCORE ? 'perfect' : success ? 'great' : score >= ALMOST_SCORE ? 'almost' : 'retry';

  return {
    success,
    accuracy: Math.round(score * 100),
    level,
    recognized: alternatives[0],
    heard: evaluation.heard,
    target,
    letterDiff: evaluation.letterDiff || [],
    tip: level === 'perfect' ? '' : evaluation.tip || '',
    feedback: evaluation.feedback?.(level) || buildFeedback(level, evaluation.heard, target, isLetterTarget),
  };
}

function evaluateLetter(alternatives, target) {
  const names = LETTER_NAMES[target];
  const displayTarget = target.toUpperCase();

  // Listen only for the letter name: "A", "A for apple" and "hey" all count as the letter A.
  const matchIndex = alternatives.findIndex((text) => names.includes(text) || text.split(' ').some((token) => names.includes(token)) || names.some((name) => name.includes(' ') && text.includes(name)));
  if (matchIndex !== -1) {
    return { score: matchIndex === 0 ? 1 : 0.9, heard: displayTarget };
  }

  const firstHeard = alternatives[0];
  const otherLetter = findSpokenLetter(firstHeard);
  if (otherLetter) {
    const heard = otherLetter.toUpperCase();
    return {
      score: 0.25,
      heard,
      tip: `Listen to the letter "${displayTarget}" again, then say only the letter.`,
      feedback: () => `I heard the letter "${heard}". Your letter is "${displayTarget}". Let's try again! 💪`,
    };
  }

  const objectWord = firstHeard.split(' ').find((token) => token.length > 2 && token.startsWith(target));
  if (objectWord) {
    return {
      score: 0.5,
      heard: firstHeard,
      tip: `Say only the letter name: "${displayTarget}".`,
      feedback: () => `"${capitalize(objectWord)}" starts with ${displayTarget}! Now say just the letter "${displayTarget}". 🌟`,
    };
  }

  return {
    score: Math.min(0.35, calculateSimilarity(firstHeard, target)),
    heard: firstHeard,
    tip: `Press "Hear It First", then say only the letter "${displayTarget}".`,
  };
}

function evaluateWord(alternatives, target) {
  const targetTokens = target.split(' ');
  const targetKey = phoneticKey(target);
  let best = { score: 0, heard: alternatives[0], candidate: alternatives[0] };

  alternatives.forEach((text, index) => {
    const tokens = text.split(' ').filter((token) => !FILLER_WORDS.has(token) || targetTokens.includes(token));
    const candidates = new Set([text, tokens.join(' ')]);
    for (let start = 0; start < tokens.length; start += 1) {
      candidates.add(tokens.slice(start, start + targetTokens.length).join(' '));
    }

    candidates.forEach((candidate) => {
      if (!candidate) return;
      let score = calculateSimilarity(candidate, target);
      if (phoneticKey(candidate) === targetKey) score = Math.max(score, 0.9);
      if (index > 0) score *= 0.92;
      if (score > best.score) best = { score, heard: text, candidate };
    });
  });

  const letterDiff = diffTargetLetters(target, best.candidate);
  return { score: best.score, heard: best.heard, letterDiff, tip: buildSoundTip(letterDiff) };
}

function findSpokenLetter(text) {
  const tokens = text.split(' ');
  return Object.keys(LETTER_NAMES).find((letter) => LETTER_NAMES[letter].includes(text) || (tokens.length <= 2 && tokens.some((token) => LETTER_NAMES[letter].includes(token))));
}

function buildFeedback(level, heard, target, isLetterTarget) {
  const shownTarget = isLetterTarget ? target.toUpperCase() : target;
  switch (level) {
    case 'perfect':
      return `Perfect! You said "${shownTarget}" just right! 🌟`;
    case 'great':
      return `Great job! That sounded like "${shownTarget}"! ⭐`;
    case 'almost':
      return `So close! I heard "${heard}". Let's try "${shownTarget}" one more time. 💪`;
    default:
      return `Good try! I heard "${heard}". Listen again and say "${shownTarget}". 🙂`;
  }
}

function buildSoundTip(letterDiff) {
  const letters = letterDiff.filter((item) => item.char !== ' ');
  const missedIndex = letters.findIndex((item) => !item.ok);
  if (missedIndex === -1) return '';
  const missed = letters[missedIndex].char;
  if (missedIndex === 0) return `Listen to the first sound: "${missed}".`;
  if (missedIndex === letters.length - 1) return `Listen to the last sound: "${missed}".`;
  return `Listen to the middle sound: "${missed}".`;
}

// Marks which letters of the target were heard correctly (aligned with edit distance).
function diffTargetLetters(target, heard) {
  const rows = target.length;
  const columns = heard.length;
  const matrix = Array.from({ length: rows + 1 }, (_, row) => Array.from({ length: columns + 1 }, (__, column) => (row === 0 ? column : column === 0 ? row : 0)));
  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      matrix[row][column] = target[row - 1] === heard[column - 1]
        ? matrix[row - 1][column - 1]
        : 1 + Math.min(matrix[row - 1][column - 1], matrix[row - 1][column], matrix[row][column - 1]);
    }
  }

  const status = new Array(rows).fill(false);
  let row = rows;
  let column = columns;
  while (row > 0 && column > 0) {
    if (target[row - 1] === heard[column - 1] && matrix[row][column] === matrix[row - 1][column - 1]) {
      status[row - 1] = true;
      row -= 1;
      column -= 1;
    } else if (matrix[row][column] === matrix[row - 1][column - 1] + 1) {
      row -= 1;
      column -= 1;
    } else if (matrix[row][column] === matrix[row - 1][column] + 1) {
      row -= 1;
    } else {
      column -= 1;
    }
  }

  return target.split('').map((char, index) => ({ char, ok: char === ' ' || status[index] }));
}

// Rough "sounds alike" key so spellings like "kat"/"cat" or "fone"/"phone" still match.
function phoneticKey(value) {
  return value
    .replace(/\s+/g, '')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/wh/g, 'w')
    .replace(/^kn/, 'n')
    .replace(/^wr/, 'r')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/[cq]/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/z/g, 's')
    .replace(/(.)\1+/g, '$1')
    .replace(/([^aeiou])e$/, '$1');
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getRecognitionErrorMessage(errorCode) {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'The microphone is blocked. Please allow microphone access for this site and try again.';
    case 'audio-capture':
      return 'No microphone was found. Please plug in or turn on a microphone.';
    case 'network':
      return 'Voice checking needs an internet connection. Please check your connection and try again.';
    default:
      return `Something went wrong while listening (${errorCode}). Please try again.`;
  }
}

function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;
  if (str1.includes(str2) || str2.includes(str1)) {
    return Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
  }

  const matrix = Array.from({ length: str2.length + 1 }, (_, index) => [index]);
  for (let index = 0; index <= str1.length; index += 1) matrix[0][index] = index;
  for (let row = 1; row <= str2.length; row += 1) {
    for (let column = 1; column <= str1.length; column += 1) {
      matrix[row][column] = str2[row - 1] === str1[column - 1]
        ? matrix[row - 1][column - 1]
        : Math.min(matrix[row - 1][column - 1] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column] + 1);
    }
  }
  return 1 - matrix[str2.length][str1.length] / Math.max(str1.length, str2.length);
}
