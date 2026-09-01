/**
 * Pronunciation checking utility
 * Uses Web Speech API's SpeechRecognition to validate pronunciation
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * Simpler version: Uses SpeechRecognition directly on live microphone input
 * Better for real-time pronunciation checking
 */
export function startPronunciationCheck(targetWord, language = 'en-US') {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognition) {
      reject(new Error('Speech Recognition not supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.language = language;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const recognizedText = event.results[0][0].transcript.toLowerCase();
      const targetLower = targetWord.toLowerCase();
      const accuracy = calculateSimilarity(recognizedText, targetLower);
      const isCorrect = accuracy >= 0.75;

      resolve({
        success: isCorrect,
        accuracy: Math.round(accuracy * 100),
        recognized: recognizedText,
        target: targetLower,
        feedback: generateFeedback(isCorrect, recognizedText, targetLower, accuracy),
      });
    };

    recognition.onerror = (event) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.start();

    // Auto-stop after 5 seconds of silence
    setTimeout(() => {
      recognition.stop();
    }, 5000);
  });
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1 (0 = completely different, 1 = identical)
 */
function calculateSimilarity(str1, str2) {
  // Exact match
  if (str1 === str2) return 1;

  // Handle single character
  if (str1.length === 1 && str2.length === 1) {
    return str1 === str2 ? 1 : 0;
  }

  // Check if one is substring of the other
  if (str1.includes(str2) || str2.includes(str1)) {
    const longer = Math.max(str1.length, str2.length);
    const shorter = Math.min(str1.length, str2.length);
    return shorter / longer;
  }

  // Levenshtein distance algorithm
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

/**
 * Generate user-friendly feedback based on pronunciation result
 */
function generateFeedback(isCorrect, recognized, target, accuracy) {
  if (isCorrect) {
    if (accuracy >= 0.95) {
      return '🎉 Perfect pronunciation!';
    } else if (accuracy >= 0.85) {
      return '👍 Great job! Very close!';
    } else {
      return '✓ Good effort! Close enough!';
    }
  }

  if (accuracy < 0.3) {
    return `Hmm, that doesn't sound like "${target}". Try again!`;
  }

  if (accuracy < 0.6) {
    return `Not quite. You said "${recognized}", but the target is "${target}". Try again!`;
  }

  return `Close! You said "${recognized}". Try to say "${target}" more clearly.`;
}
