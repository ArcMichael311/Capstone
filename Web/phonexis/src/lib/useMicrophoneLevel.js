import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook that opens the microphone and reports a live 0-100 loudness level,
 * so children can see that the app hears them while they speak.
 * @returns {Object} Level state and start/stop methods
 */
export function useMicrophoneLevel() {
  const [level, setLevel] = useState(0);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const contextRef = useRef(null);
  const frameRef = useRef(null);
  const sessionIdRef = useRef(0);

  const stop = useCallback(() => {
    sessionIdRef.current += 1;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    contextRef.current?.close().catch(() => {});
    contextRef.current = null;
    setLevel(0);
  }, []);

  const start = useCallback(async ({ sensitivity = 60, constraints = true } = {}) => {
    stop();
    setError(null);
    const sessionId = sessionIdRef.current;
    const AudioContextConstructor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!navigator.mediaDevices?.getUserMedia || !AudioContextConstructor) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      if (sessionId !== sessionIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      const audioContext = new AudioContextConstructor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      await audioContext.resume();
      streamRef.current = stream;
      contextRef.current = audioContext;

      const samples = new Uint8Array(analyser.fftSize);
      const boost = Math.max(0.5, Math.min(2.5, sensitivity / 60));
      let lastUpdate = 0;
      const update = (time) => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const sample = (samples[index] - 128) / 128;
          sum += sample * sample;
        }
        if (time - lastUpdate > 60) {
          lastUpdate = time;
          setLevel(Math.min(100, Math.round(Math.sqrt(sum / samples.length) * 320 * boost)));
        }
        frameRef.current = requestAnimationFrame(update);
      };
      frameRef.current = requestAnimationFrame(update);
      return true;
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please enable it in your browser settings.'
          : `Microphone error: ${err.message}`
      );
      return false;
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { level, error, start, stop };
}
