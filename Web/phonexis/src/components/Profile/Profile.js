import './Profile.css';
import { useEffect, useRef, useState } from 'react';
import { supabase, syncSupabasePasswordToBackend } from '../../lib/supabaseClient';

export default function Profile({ onNavigate, onBack, user, overallProgress = 0, alphabetProgress = 0, vowelsProgress = 0, consonantsProgress = 0, cvcProgress = 0, onLogout, theme = 'light', onThemeChange, initialTab = 'info' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [musicVolume, setMusicVolume] = useState(50);
  const [voiceMode, setVoiceMode] = useState('isolation');
  const [microphoneSensitivity, setMicrophoneSensitivity] = useState(60);
  const [voiceOutputVolume, setVoiceOutputVolume] = useState(100);
  const [microphoneState, setMicrophoneState] = useState('idle');
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [microphoneError, setMicrophoneError] = useState('');
  const microphoneStreamRef = useRef(null);
  const microphoneContextRef = useRef(null);
  const microphoneSourceRef = useRef(null);
  const microphoneAnalyserRef = useRef(null);
  const microphoneOutputGainRef = useRef(null);
  const microphoneFrameRef = useRef(null);

  useEffect(() => {
    try {
      const savedVoiceSettings = JSON.parse(localStorage.getItem('phonexis_voice_settings') || '{}');
      if (['isolation', 'studio', 'custom'].includes(savedVoiceSettings.mode)) setVoiceMode(savedVoiceSettings.mode);
      if (Number.isFinite(savedVoiceSettings.sensitivity)) setMicrophoneSensitivity(savedVoiceSettings.sensitivity);
      if (Number.isFinite(savedVoiceSettings.outputVolume)) setVoiceOutputVolume(savedVoiceSettings.outputVolume);
    } catch (storageError) {
      // ignore storage errors
    }
  }, []);

  const updateVoiceSettings = (nextSettings) => {
    const settings = {
      mode: nextSettings.mode ?? voiceMode,
      sensitivity: nextSettings.sensitivity ?? microphoneSensitivity,
      outputVolume: nextSettings.outputVolume ?? voiceOutputVolume,
    };
    setVoiceMode(settings.mode);
    setMicrophoneSensitivity(settings.sensitivity);
    setVoiceOutputVolume(settings.outputVolume);
    if (microphoneOutputGainRef.current) {
      const modeGain = settings.mode === 'isolation' ? 1.55 : 1.2;
      const sensitivityGain = Math.max(0.65, Math.min(2, settings.sensitivity / 60));
      const outputVolumeGain = Math.max(0.35, Math.min(2.5, settings.outputVolume / 100));
      microphoneOutputGainRef.current.gain.setTargetAtTime(
        Math.min(3, modeGain * sensitivityGain * outputVolumeGain),
        microphoneContextRef.current?.currentTime || 0,
        0.03
      );
    }
    try {
      localStorage.setItem('phonexis_voice_settings', JSON.stringify(settings));
    } catch (storageError) {
      // ignore storage errors
    }
  };

  useEffect(() => () => {
    if (microphoneFrameRef.current) {
      cancelAnimationFrame(microphoneFrameRef.current);
    }
    microphoneSourceRef.current?.disconnect();
    microphoneAnalyserRef.current?.disconnect();
    microphoneOutputGainRef.current?.disconnect();
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneContextRef.current?.close();
  }, []);

  const stopMicrophoneTest = () => {
    if (microphoneFrameRef.current) {
      cancelAnimationFrame(microphoneFrameRef.current);
      microphoneFrameRef.current = null;
    }
    microphoneSourceRef.current?.disconnect();
    microphoneAnalyserRef.current?.disconnect();
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneContextRef.current?.close();
    microphoneSourceRef.current = null;
    microphoneAnalyserRef.current = null;
    microphoneOutputGainRef.current = null;
    microphoneStreamRef.current = null;
    microphoneContextRef.current = null;
    setMicrophoneLevel(0);
    setMicrophoneState('idle');
  };

  const startMicrophoneTest = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneState('error');
      setMicrophoneError('Microphone access is not supported by this browser.');
      return;
    }

    setMicrophoneState('requesting');
    setMicrophoneError('');

    try {
      const savedVoiceSettings = JSON.parse(localStorage.getItem('phonexis_voice_settings') || '{}');
      const activeVoiceMode = savedVoiceSettings.mode || voiceMode;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: activeVoiceMode === 'isolation' ? { ideal: true } : false,
          echoCancellation: activeVoiceMode !== 'studio',
          autoGainControl: activeVoiceMode !== 'isolation' && microphoneSensitivity >= 60,
          channelCount: 1,
        },
      });
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextConstructor) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('Live microphone testing is not supported by this browser.');
      }

      const audioContext = new AudioContextConstructor();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      const compressor = audioContext.createDynamicsCompressor();
      const outputGain = audioContext.createGain();
      const voiceFilter = audioContext.createBiquadFilter();
      const speechFilter = audioContext.createBiquadFilter();

      if (activeVoiceMode === 'isolation') {
        voiceFilter.type = 'highpass';
        voiceFilter.frequency.value = 140;
        voiceFilter.Q.value = 0.7;
        speechFilter.type = 'lowpass';
        speechFilter.frequency.value = 7200;
        speechFilter.Q.value = 0.7;
        compressor.threshold.value = -36;
        compressor.knee.value = 30;
        compressor.ratio.value = 3;
        compressor.attack.value = 0.02;
        compressor.release.value = 0.35;
      } else {
        voiceFilter.type = 'highpass';
        voiceFilter.frequency.value = 70;
        voiceFilter.Q.value = 0.7;
        speechFilter.type = 'lowpass';
        speechFilter.frequency.value = 10000;
        speechFilter.Q.value = 0.7;
        compressor.threshold.value = -24;
        compressor.knee.value = 18;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.25;
      }

      const modeGain = activeVoiceMode === 'isolation' ? 1.55 : 1.2;
      const sensitivityGain = Math.max(0.65, Math.min(2, microphoneSensitivity / 60));
      const outputVolumeGain = Math.max(0.35, Math.min(2.5, voiceOutputVolume / 100));
      outputGain.gain.value = Math.min(3, modeGain * sensitivityGain * outputVolumeGain);
      analyser.fftSize = 512;
      source.connect(voiceFilter);
      voiceFilter.connect(speechFilter);
      speechFilter.connect(compressor);
      compressor.connect(outputGain);
      outputGain.connect(analyser);
      analyser.connect(audioContext.destination);
      await audioContext.resume();
      microphoneStreamRef.current = stream;
      microphoneContextRef.current = audioContext;
      microphoneSourceRef.current = source;
      microphoneAnalyserRef.current = analyser;
      microphoneOutputGainRef.current = outputGain;
      setMicrophoneState('active');

      const samples = new Uint8Array(analyser.fftSize);
      const updateMicrophoneLevel = () => {
        analyser.getByteTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, sample) => {
          const normalizedSample = (sample - 128) / 128;
          return sum + normalizedSample ** 2;
        }, 0) / samples.length);
        const sensitivityMultiplier = microphoneSensitivity / 60;
        setMicrophoneLevel(Math.min(100, Math.round(rms * 240 * sensitivityMultiplier)));
        microphoneFrameRef.current = requestAnimationFrame(updateMicrophoneLevel);
      };

      updateMicrophoneLevel();
    } catch (microphoneAccessError) {
      setMicrophoneState('error');
      setMicrophoneError(
        microphoneAccessError.name === 'NotAllowedError'
          ? 'Microphone permission was not granted.'
          : microphoneAccessError.message || 'Unable to access the microphone.'
      );
    }
  };

  useEffect(() => {
    const syncVolume = (event) => {
      const nextVolume = Number(event?.detail);
      if (!Number.isNaN(nextVolume)) {
        setMusicVolume(Math.round(Math.min(Math.max(nextVolume, 0), 1) * 100));
      }
    };

    try {
      const storedVolume = localStorage.getItem('phonexis_music_volume');
      if (storedVolume !== null) {
        const parsedVolume = Number(storedVolume);
        if (!Number.isNaN(parsedVolume)) {
          setMusicVolume(Math.round(Math.min(Math.max(parsedVolume, 0), 1) * 100));
        }
      }
    } catch (storageError) {
      // ignore storage errors
    }

    window.addEventListener('phonexis:music-volume-change', syncVolume);
    return () => window.removeEventListener('phonexis:music-volume-change', syncVolume);
  }, [])

  const handleMusicVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    setMusicVolume(nextVolume);

    try {
      const normalizedVolume = nextVolume / 100;
      localStorage.setItem('phonexis_music_volume', String(normalizedVolume));

      window.dispatchEvent(
        new CustomEvent('phonexis:music-volume-change', {
          detail: normalizedVolume,
        })
      );
    } catch (storageError) {
      // ignore storage errors
    }
  };

  const displayName = [user?.firstname || user?.user_metadata?.firstname, user?.lastname || user?.user_metadata?.lastname]
    .filter(Boolean)
    .join(' ')
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Learner';
  const email = user?.email || '';
  const role = user?.role || user?.user_metadata?.role || 'student';
  const isStudent = role === 'student';

  const handleSendProgressToGmail = () => {
    if (!email) {
      setError('No email address is available for this account');
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);

    const subject = `Phonexis Learning Progress for ${displayName}`;
    const body = [
      'Student Name:',
      displayName,
      '',
      'Learning Progress:',
      `- Alphabet Recognition: ${alphabetProgress}%`,
      `- Vowels & Consonants: ${Math.round((vowelsProgress + consonantsProgress) / 2)}%`,
      `- CVC Words: ${cvcProgress}%`,
      `- Overall Progress: ${overallProgress}%`,
      '',
      'Best regards,',
      'Phonexis',
    ].join('\n');

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');
    setSuccess('Opened Gmail with your progress summary');
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email,
        currentPassword,
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password');
        setLoading(false);
        return;
      }

      void syncSupabasePasswordToBackend(email, currentPassword, newPassword);

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="profile-shell">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-header-avatar" aria-hidden="true">
            <span>👤</span>
          </div>
          <div>
            <h2>{displayName}</h2>
            <p>{role.charAt(0).toUpperCase() + role.slice(1)} Profile</p>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          type="button" 
          className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          PROFILE INFO
        </button>
        <button 
          type="button" 
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          SETTINGS
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="profile-info-tab">
          <div className="profile-info-field">
            <div className="profile-info-icon" aria-hidden="true">👤</div>
            <div>
              <p className="profile-info-label">Full Name</p>
              <p className="profile-info-value">{displayName}</p>
            </div>
          </div>

          <div className="profile-info-field">
            <div className="profile-info-icon" aria-hidden="true">📧</div>
            <div>
              <p className="profile-info-label">Email Address</p>
              <p className="profile-info-value">{email}</p>
            </div>
          </div>

          <div className="profile-info-field">
            <div className="profile-info-icon" aria-hidden="true">🛡️</div>
            <div>
              <p className="profile-info-label">Role</p>
              <p className="profile-info-value">{role.charAt(0).toUpperCase() + role.slice(1)}</p>
            </div>
          </div>

          {isStudent && (
            <div className="profile-learning-progress">
              <h3>Learning Progress</h3>
              <div className="profile-progress-item">
                <span>Alphabet Recognition</span>
                <span className="profile-progress-percentage">{alphabetProgress}%</span>
              </div>
              <div className="profile-progress-item">
                <span>Vowels & Consonants</span>
                <span className="profile-progress-percentage">{Math.round((vowelsProgress + consonantsProgress) / 2)}%</span>
              </div>
              <div className="profile-progress-item">
                <span>CVC Words</span>
                <span className="profile-progress-percentage">{cvcProgress}%</span>
              </div>
              <div className="profile-progress-item">
                <span>Overall Progress</span>
                <span className="profile-progress-percentage">{overallProgress}%</span>
              </div>
              <button type="button" className="profile-send-progress-btn" onClick={handleSendProgressToGmail} disabled={!email}>
                Send to Gmail
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="profile-settings-tab">
          <div className="profile-settings-section">
            <div className="profile-settings-header">
              <span className="profile-settings-icon" aria-hidden="true">⚙️</span>
              <div>
                <h3>Change Password</h3>
                <p>Update your password to keep your account secure</p>
              </div>
            </div>

            <form className="profile-password-form" onSubmit={handleChangePassword}>
              <label className="profile-form-field">
                <span className="profile-form-label">Current Password *</span>
                <div className="profile-form-box">
                  <span className="profile-form-icon" aria-hidden="true">🔒</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="profile-form-field">
                <span className="profile-form-label">New Password *</span>
                <span className="profile-form-hint">Must be at least 8 characters</span>
                <div className="profile-form-box">
                  <span className="profile-form-icon" aria-hidden="true">🔒</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="profile-form-field">
                <span className="profile-form-label">Confirm New Password *</span>
                <div className="profile-form-box">
                  <span className="profile-form-icon" aria-hidden="true">🔒</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              {error && <p className="profile-form-error">{error}</p>}
              {success && <p className="profile-form-success">✓ {success}</p>}

              <button type="submit" className="profile-update-btn" disabled={loading}>
                {loading ? 'UPDATING...' : '✓ UPDATE PASSWORD'}
              </button>
            </form>
          </div>

          {isStudent && (
          <div className="profile-settings-section profile-audio-section">
            <div className="profile-settings-header">
              <span className="profile-settings-icon" aria-hidden="true">🎵</span>
              <div>
                <h3>Music Volume</h3>
                <p>Adjust the background music level</p>
              </div>
            </div>

            <label className="profile-form-field">
              <span className="profile-form-label">Volume</span>
              <div className="profile-volume-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={handleMusicVolumeChange}
                  className="profile-volume-slider"
                  aria-label="Music volume"
                />
                <strong className="profile-volume-value">{musicVolume}%</strong>
              </div>
            </label>

            <div className="profile-microphone-tester">
              {microphoneState === 'active' ? (
                <button type="button" className="profile-microphone-btn secondary" onClick={stopMicrophoneTest}>
                  Stop Testing
                </button>
              ) : (
                <button type="button" className="profile-microphone-btn" onClick={startMicrophoneTest} disabled={microphoneState === 'requesting'}>
                  {microphoneState === 'requesting' ? 'Requesting...' : 'Enable Microphone'}
                </button>
              )}
              <div className="profile-microphone-meter-wrap">
                <div className="profile-microphone-meter" role="progressbar" aria-label="Microphone loudness" aria-valuemin="0" aria-valuemax="100" aria-valuenow={microphoneLevel}>
                  {Array.from({ length: 40 }, (_, index) => (
                    <span key={index} className={index < Math.ceil((microphoneLevel / 100) * 40) ? 'active' : ''} />
                  ))}
                </div>
                <strong className="profile-microphone-value">{microphoneLevel}%</strong>
                <span className={`profile-microphone-status profile-microphone-status-${microphoneState}`} role="status">
                  {microphoneState === 'active' && 'Playing back your voice'}
                  {microphoneState === 'requesting' && 'Waiting for microphone permission...'}
                  {microphoneState === 'idle' && 'Microphone is off'}
                  {microphoneState === 'error' && microphoneError}
                </span>
              </div>
            </div>

            <div className="profile-voice-settings">
              <div className="profile-voice-settings-title">
                <span className="profile-settings-icon" aria-hidden="true">🎙️</span>
                <div>
                  <h4>Voice Settings</h4>
                  <p>Choose how your voice is captured during pronunciation practice.</p>
                </div>
              </div>

              <div className="profile-voice-modes" role="radiogroup" aria-label="Voice mode">
                {[
                  { value: 'isolation', label: 'Voice Isolation', description: 'Reduce background noise for clearer speech.' },
                  { value: 'studio', label: 'Studio', description: 'Use clean microphone audio with natural processing.' },
                  { value: 'custom', label: 'Custom', description: 'Adjust microphone sensitivity and output volume.' },
                ].map((mode) => (
                  <label className={`profile-voice-mode ${voiceMode === mode.value ? 'active' : ''}`} key={mode.value}>
                    <input
                      type="radio"
                      name="voice-mode"
                      value={mode.value}
                      checked={voiceMode === mode.value}
                      onChange={() => updateVoiceSettings({ mode: mode.value })}
                    />
                    <span className="profile-voice-radio" aria-hidden="true" />
                    <span>
                      <strong>{mode.label}</strong>
                      <small>{mode.description}</small>
                    </span>
                  </label>
                ))}
              </div>

              <div className="profile-voice-options">
                <label className="profile-form-field">
                  <span className="profile-form-label">Mic Sensitivity <strong>{microphoneSensitivity}%</strong></span>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    step="5"
                    value={microphoneSensitivity}
                    onChange={(event) => updateVoiceSettings({ sensitivity: Number(event.target.value) })}
                    aria-label="Microphone sensitivity"
                  />
                </label>
                <label className="profile-form-field">
                  <span className="profile-form-label">Mic Volume <strong>{voiceOutputVolume}%</strong></span>
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="5"
                    value={voiceOutputVolume}
                    onChange={(event) => updateVoiceSettings({ outputVolume: Number(event.target.value) })}
                    aria-label="Microphone volume"
                  />
                </label>
              </div>
            </div>
          </div>
          )}

          <div className="profile-settings-section profile-background-section">
            <div className="profile-settings-header">
              <span className="profile-settings-icon" aria-hidden="true">🖼️</span>
              <div>
                <h3>Theme Studio</h3>
                <p>Pick the atmosphere that matches your learning mood</p>
              </div>
            </div>

            <div className="profile-theme-options" role="group" aria-label="Theme selection">
              <button
                type="button"
                className={`profile-theme-card profile-theme-card-light ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange?.('light')}
                aria-pressed={theme === 'light'}
              >
                <span className="profile-theme-card-header">
                  <span className="profile-theme-title-wrap">
                    <span className="profile-theme-dot" aria-hidden="true" />
                    <strong>Sunrise Canvas</strong>
                  </span>
                  {theme === 'light' && <span className="profile-theme-badge">Active</span>}
                </span>
                <span className="profile-theme-preview" aria-hidden="true">
                  <span className="profile-theme-preview-top" />
                  <span className="profile-theme-preview-body">
                    <span className="profile-theme-preview-pill" />
                    <span className="profile-theme-preview-line" />
                    <span className="profile-theme-preview-line short" />
                  </span>
                </span>
                <span className="profile-theme-description">Bright, playful, and energetic.</span>
              </button>
              <button
                type="button"
                className={`profile-theme-card profile-theme-card-dark ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange?.('dark')}
                aria-pressed={theme === 'dark'}
              >
                <span className="profile-theme-card-header">
                  <span className="profile-theme-title-wrap">
                    <span className="profile-theme-dot" aria-hidden="true" />
                    <strong>Midnight Focus</strong>
                  </span>
                  {theme === 'dark' && <span className="profile-theme-badge">Active</span>}
                </span>
                <span className="profile-theme-preview" aria-hidden="true">
                  <span className="profile-theme-preview-top" />
                  <span className="profile-theme-preview-body">
                    <span className="profile-theme-preview-pill" />
                    <span className="profile-theme-preview-line" />
                    <span className="profile-theme-preview-line short" />
                  </span>
                </span>
                <span className="profile-theme-description">Calm, high-contrast, and immersive.</span>
              </button>
            </div>
          </div>

          <div className="profile-sign-out-section">
            <p>Need help with your account?</p>
            <button type="button" className="profile-sign-out-btn" onClick={onLogout}>
              SIGN OUT
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
