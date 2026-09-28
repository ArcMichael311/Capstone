import { useState, useEffect, useCallback, useRef } from 'react';
import { useMicrophoneLevel } from '../../lib/useMicrophoneLevel';
import { startPronunciationSession } from '../../lib/pronunciationChecker';
import './VoicePractice.css';

const VOICE_DETECTED_LEVEL = 12;

const RESULT_DISPLAY = {
  perfect: { title: 'Perfect!', icon: '🌟', stars: 3 },
  great: { title: 'Great job!', icon: '🎉', stars: 2 },
  almost: { title: 'So close!', icon: '💪', stars: 1 },
  retry: { title: 'Good try!', icon: '🙂', stars: 0 },
  silent: { title: "I didn't hear you", icon: '👂', stars: 0 },
};

/**
 * Reusable voice practice component for pronunciation checking
 * @param {Object} props
 * @param {string} props.targetWord - Word/letter to practice pronouncing
 * @param {string} props.language - Language code (default: 'en-US')
 * @param {function} props.onResult - Callback when pronunciation check completes
 * @param {boolean} props.showTranscript - Show recognized text in results (default: true)
 * @param {boolean} props.autoPlayGuide - Auto-play guide on load (default: false)
 */
export default function VoicePractice({
  targetWord,
  language = 'en-US',
  onResult,
  showTranscript = true,
  autoPlayGuide = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [liveText, setLiveText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const pronunciationSessionRef = useRef(null);
  const { level: micLevel, error: micError, start: startMicLevel, stop: stopMicLevel } = useMicrophoneLevel();
  const isLetterTarget = /^[a-z]$/i.test(String(targetWord).trim());

  useEffect(() => () => {
    pronunciationSessionRef.current?.abort();
  }, []);

  // Start fresh when the child moves to another letter or word.
  useEffect(() => {
    pronunciationSessionRef.current?.abort();
    pronunciationSessionRef.current = null;
    stopMicLevel();
    setIsListening(false);
    setIsChecking(false);
    setResult(null);
    setFeedback('');
    setLiveText('');
  }, [targetWord, stopMicLevel]);

  useEffect(() => {
    if (isListening && micLevel >= VOICE_DETECTED_LEVEL) setVoiceDetected(true);
  }, [isListening, micLevel]);

  const playPronunciationGuide = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback('Speech guide is not available in your browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(targetWord);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.lang = language;

      utterance.onend = () => {
        setIsSpeaking(false);
        setFeedback('Now it\'s your turn! Press "Start Talking" and say it.');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setFeedback('Could not play pronunciation guide.');
      };

      window.speechSynthesis.speak(utterance);
      setFeedback('Listen carefully...');
    } catch {
      setIsSpeaking(false);
      setFeedback('Error playing pronunciation guide.');
    }
  }, [language, targetWord]);

  // Auto-play guide on component mount if enabled
  useEffect(() => {
    if (autoPlayGuide) {
      playPronunciationGuide();
    }
  }, [autoPlayGuide, playPronunciationGuide]);

  // Update recording time display
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isListening]);

  const handleStartRecording = () => {
    setRecordingTime(0);
    setResult(null);
    setLiveText('');
    setVoiceDetected(false);
    setFeedback(isLetterTarget ? `Say only the letter "${targetWord.toUpperCase()}".` : `Say "${targetWord}".`);

    let savedSettings = {};
    try {
      savedSettings = JSON.parse(localStorage.getItem('phonexis_voice_settings') || '{}');
    } catch (storageError) {
      // use the component defaults when settings are unavailable
    }
    const voiceMode = savedSettings.mode || 'isolation';
    const microphoneSensitivity = Number(savedSettings.sensitivity) || 60;

    const session = startPronunciationSession(targetWord, language, { onInterim: setLiveText });
    pronunciationSessionRef.current = session;
    setIsListening(true);
    startMicLevel({
      sensitivity: microphoneSensitivity,
      constraints: {
        noiseSuppression: voiceMode === 'isolation',
        echoCancellation: voiceMode !== 'studio',
        autoGainControl: true,
      },
    });

    session.promise
      .then((checkResult) => {
        if (pronunciationSessionRef.current !== session) return;
        setResult(checkResult);
        setFeedback(checkResult.tip ? `${checkResult.feedback} ${checkResult.tip}` : checkResult.feedback);
        if (typeof onResult === 'function') onResult(checkResult);
      })
      .catch((err) => {
        if (pronunciationSessionRef.current !== session) return;
        const errorMsg = err.message || 'Could not check pronunciation. Please try again.';
        setFeedback(errorMsg);
        setResult({ success: false, level: 'retry', accuracy: 0, recognized: '', heard: '', target: targetWord.toLowerCase(), letterDiff: [], error: errorMsg });
      })
      .finally(() => {
        if (pronunciationSessionRef.current !== session) return;
        pronunciationSessionRef.current = null;
        stopMicLevel();
        setIsListening(false);
        setIsChecking(false);
      });
  };

  const handleStopRecording = () => {
    setIsChecking(true);
    setFeedback('Checking...');
    pronunciationSessionRef.current?.stop();
  };

  const handleReset = () => {
    setResult(null);
    setFeedback('');
    setLiveText('');
    setRecordingTime(0);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 100);
    return `${seconds}.${milliseconds}s`;
  };

  const getListeningHint = () => {
    if (micLevel >= VOICE_DETECTED_LEVEL) return 'I can hear you! Keep going 🎉';
    if (!voiceDetected && recordingTime > 1500) return "I can't hear you yet. Speak a little louder 🙂";
    return 'Listening...';
  };

  const display = result ? RESULT_DISPLAY[result.level] || RESULT_DISPLAY.retry : null;
  const heardText = result?.heard || result?.recognized;
  const silentButVoiceDetected = result?.level === 'silent' && voiceDetected;

  return (
    <div className="voice-practice-container">
      <div className="voice-practice-header">
        <h3>Practice Pronunciation</h3>
        <p className="voice-practice-target">
          {isLetterTarget ? 'Say the letter:' : 'Say:'} <strong>{isLetterTarget ? targetWord.toUpperCase() : targetWord}</strong>
        </p>
      </div>

      {micError && (
        <div className="voice-practice-error" role="alert">
          ⚠️ {micError}
        </div>
      )}

      <div className="voice-practice-controls">
        {/* Pronunciation Guide Button - Always Visible */}
        <button
          type="button"
          className="voice-btn voice-btn-guide"
          onClick={playPronunciationGuide}
          disabled={isListening || isSpeaking}
          aria-label="Hear pronunciation guide"
          title="Listen to how to pronounce this correctly"
        >
          🔊 Hear It First
        </button>

        {!result && (
          <button
            type="button"
            className={isListening ? 'voice-btn voice-btn-stop' : 'voice-btn voice-btn-start'}
            onClick={isListening ? handleStopRecording : handleStartRecording}
            disabled={isSpeaking || isChecking}
            aria-label={isListening ? 'Done talking, check my voice' : 'Start talking'}
          >
            {isListening ? '✋ Done Talking' : '🎤 Start Talking'}
          </button>
        )}

        {isListening && (
          <div className="voice-live" aria-live="polite">
            <div className="voice-timer">
              <span className="voice-timer-dot">●</span>
              {getListeningHint()} <span className="voice-timer-time">{formatTime(recordingTime)}</span>
            </div>
            <div
              className="voice-meter"
              role="meter"
              aria-label="Microphone volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={micLevel}
            >
              <div
                className={micLevel >= VOICE_DETECTED_LEVEL ? 'voice-meter-fill voice-meter-fill-active' : 'voice-meter-fill'}
                style={{ width: `${Math.max(3, micLevel)}%` }}
              />
            </div>
            <p className="voice-live-text">
              {liveText ? <>I'm hearing: <strong>{liveText}</strong></> : 'Waiting for your voice...'}
            </p>
          </div>
        )}

        {isChecking && (
          <div className="voice-checking">
            <div className="voice-spinner"></div>
            <span>Checking...</span>
          </div>
        )}

        {result && display && (
          <>
            <div className={`voice-result voice-result-${result.success ? 'success' : result.level === 'almost' ? 'almost' : 'fail'}`}>
              <div className="voice-result-icon">{display.icon}</div>
              <div className="voice-result-content">
                <p className="voice-result-title">{display.title}</p>
                <p className="voice-result-stars" aria-label={`${display.stars} out of 3 stars`}>
                  {[1, 2, 3].map((star) => (
                    <span key={star} className={star <= display.stars ? 'voice-star voice-star-on' : 'voice-star'}>★</span>
                  ))}
                  <span className="voice-result-accuracy">{result.accuracy}%</span>
                </p>
                {showTranscript && heardText && (
                  <p className="voice-result-transcript">
                    I heard: <strong>{heardText}</strong>
                  </p>
                )}
                {result.level !== 'perfect' && result.letterDiff?.length > 0 && heardText && (
                  <div className="voice-letter-diff" aria-label="Sounds to practice">
                    {result.letterDiff.map((item, index) => (
                      <span
                        key={`${item.char}-${index}`}
                        className={item.char === ' ' ? 'voice-letter-space' : item.ok ? 'voice-letter voice-letter-ok' : 'voice-letter voice-letter-miss'}
                      >
                        {item.char}
                      </span>
                    ))}
                  </div>
                )}
                {result.tip && <p className="voice-result-tip">💡 {result.tip}</p>}
                {silentButVoiceDetected && (
                  <p className="voice-result-tip">💡 I heard a sound but couldn't make out the word. Try saying it slowly and clearly.</p>
                )}
              </div>
            </div>

            <div className="voice-result-actions">
              <button
                type="button"
                className="voice-btn voice-btn-guide"
                onClick={playPronunciationGuide}
                disabled={isSpeaking}
                aria-label="Hear pronunciation guide again"
              >
                🔊 Hear It Again
              </button>
              <button
                type="button"
                className="voice-btn voice-btn-retry"
                onClick={handleReset}
                aria-label="Try again"
              >
                🔄 Try Again
              </button>
            </div>
          </>
        )}
      </div>

      {feedback && (
        <div className="voice-feedback" role="status" aria-live="polite">
          {feedback}
        </div>
      )}
    </div>
  );
}
