import { useState } from 'react';
import './DoubleVowelLesson.css';
import { doubleVowelExamples } from './doubleVowelData';

function speakWord(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
  return true;
}

export default function DoubleVowelLesson({ onFeedback }) {
  const [selectedLetters, setSelectedLetters] = useState(doubleVowelExamples[0].letters);

  const selected =
    doubleVowelExamples.find((item) => item.letters === selectedLetters) ?? doubleVowelExamples[0];

  const handleListen = () => {
    const phrase = `${selected.letters} says ${selected.soundLabel}. ${selected.word}.`;
    const spoke = speakWord(phrase);
    const message = spoke
      ? `Listen: ${selected.word} has ${selected.letters}!`
      : `Say "${selected.word}" — look for ${selected.letters}!`;

    if (typeof onFeedback === 'function') {
      onFeedback(message);
    }
  };

  return (
    <section className="double-vowel-panel" aria-labelledby="double-vowel-title">
      <div className="double-vowel-sparkles" aria-hidden="true">
        <span>✨</span>
        <span>🌈</span>
        <span>✨</span>
      </div>

      <p className="double-vowel-badge">Bonus fun</p>

      <h4 id="double-vowel-title" className="double-vowel-title">
        Double Vowel Buddies
      </h4>
      <p className="double-vowel-subtitle">
        Two vowels side by side make a special sound — tap a pair and listen!
      </p>

      <div className="double-vowel-picker" role="group" aria-label="Double vowel pairs">
        {doubleVowelExamples.map((item) => (
          <button
            key={item.letters}
            type="button"
            className={item.letters === selectedLetters ? 'double-vowel-chip active' : 'double-vowel-chip'}
            onClick={() => setSelectedLetters(item.letters)}
            aria-pressed={item.letters === selectedLetters}
          >
            {item.letters}
          </button>
        ))}
      </div>

      <div className="double-vowel-showcase">
        <span className="double-vowel-pair" aria-label={`Letters ${selected.letters}`}>
          {selected.letters.split('').map((char, index) => (
            <span key={`${selected.letters}-${index}`} className="double-vowel-letter">
              {char}
            </span>
          ))}
        </span>

        <p className="double-vowel-sound-tag">Sound: {selected.soundLabel}</p>

        <span className="double-vowel-icon" aria-hidden="true">
          {selected.icon}
        </span>

        <p className="double-vowel-word">
          {selected.parts.map((part, index) =>
            part === selected.letters ? (
              <span key={`${selected.letters}-part-${index}`} className="dv-highlight">
                {part}
              </span>
            ) : (
              <span key={`${selected.letters}-part-${index}`}>{part}</span>
            )
          )}
        </p>

        <p className="double-vowel-tip">{selected.tip}</p>
      </div>

      <button type="button" className="double-vowel-listen" onClick={handleListen}>
        🔊 Hear the word
      </button>
    </section>
  );
}
