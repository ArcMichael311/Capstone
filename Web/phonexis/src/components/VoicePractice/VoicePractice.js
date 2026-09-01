import { useState, useEffect } from 'react';
import { useVoiceRecorder } from '../../lib/useVoiceRecorder';
import { startPronunciationCheck } from '../../lib/pronunciationChecker';
import './VoicePractice.css';

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
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isRecording, startRecording, stopRecording, resetRecording, error: recorderError } =
    useVoiceRecorder();

  // Auto-play guide on component mount if enabled
  useEffect(() => {
    if (autoPlayGuide) {
      playPronunciationGuide();
    }
  }, [autoPlayGuide, targetWord]);

  // Update recording time display
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  const playPronunciationGuide = () => {
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
        setFeedback('Now it\'s your turn! Click "Start Recording" to practice.');
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        setFeedback('Could not play pronunciation guide.');
      };

      window.speechSynthesis.speak(utterance);
      setFeedback('Listen to the correct pronunciation...');
    } catch (err) {
      setIsSpeaking(false);
      setFeedback('Error playing pronunciation guide.');
    }
  };

  const handleStartRecording = async () => {
    setRecordingTime(0);
    setResult(null);
    setFeedback('Recording... Speak now!');
    await startRecording();
  };

  const handleStopRecording = async () => {
    stopRecording();

    // Small delay to ensure audio is fully captured
    setTimeout(() => {
      checkPronunciation();
    }, 100);
  };

  const checkPronunciation = async () => {
    setIsChecking(true);
    setFeedback('Checking pronunciation...');

    try {
      const checkResult = await startPronunciationCheck(targetWord, language);
      setResult(checkResult);
      setFeedback(checkResult.feedback);

      if (typeof onResult === 'function') {
        onResult(checkResult);
      }
    } catch (err) {
      const errorMsg = err.message || 'Could not check pronunciation. Please try again.';
      setFeedback(errorMsg);
      setResult({ success: false, error: errorMsg });
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    resetRecording();
    setResult(null);
    setFeedback('');
    setRecordingTime(0);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 100);
    return `${seconds}.${milliseconds}s`;
  };

  return (
    <div className="voice-practice-container">
      <div className="voice-practice-header">
        <h3>Practice Pronunciation</h3>
        <p className="voice-practice-target">Say: <strong>{targetWord}</strong></p>
      </div>

      {recorderError && (
        <div className="voice-practice-error" role="alert">
          ⚠️ {recorderError}
        </div>
      )}

      <div className="voice-practice-controls">
        {/* Pronunciation Guide Button - Always Visible */}
        <button
          type="button"
          className="voice-btn voice-btn-guide"
          onClick={playPronunciationGuide}
          disabled={isRecording || isChecking || isSpeaking}
          aria-label="Hear pronunciation guide"
          title="Listen to how to pronounce this correctly"
        >
          🔊 Hear It First
        </button>

        {!isRecording && !result && (
          <button
            type="button"
            className="voice-btn voice-btn-start"
            onClick={handleStartRecording}
            disabled={isChecking || isSpeaking}
            aria-label="Start recording"
          >
            🎤 Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <div className="voice-timer" aria-live="polite">
              <span className="voice-timer-dot">●</span>
              Recording: {formatTime(recordingTime)}
            </div>
            <button
              type="button"
              className="voice-btn voice-btn-stop"
              onClick={handleStopRecording}
              disabled={isChecking}
              aria-label="Stop recording"
            >
              ⏹ Stop & Check
            </button>
          </>
        )}

        {isChecking && (
          <div className="voice-checking">
            <div className="voice-spinner"></div>
            <span>Analyzing your voice...</span>
          </div>
        )}

        {result && (
          <>
            <div className={`voice-result ${result.success ? 'voice-result-success' : 'voice-result-fail'}`}>
              <div className="voice-result-icon">
                {result.success ? '✅' : '❌'}
              </div>
              <div className="voice-result-content">
                <p className="voice-result-title">
                  {result.success ? 'Correct!' : 'Try Again'}
                </p>
                <p className="voice-result-accuracy">
                  Accuracy: <strong>{result.accuracy}%</strong>
                </p>
                {showTranscript && result.recognized && (
                  <p className="voice-result-transcript">
                    You said: <em>{result.recognized}</em>
                  </p>
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
