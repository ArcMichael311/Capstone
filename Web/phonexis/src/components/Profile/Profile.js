import './Profile.css';
import { useEffect, useState } from 'react';
import { supabase, syncSupabasePasswordToBackend } from '../../lib/supabaseClient';

export default function Profile({ onNavigate, onBack, user, overallProgress = 0, alphabetProgress = 0, vowelsProgress = 0, consonantsProgress = 0, cvcProgress = 0, onLogout }) {
  const [activeTab, setActiveTab] = useState('info');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [musicVolume, setMusicVolume] = useState(50);

  useEffect(() => {
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
  }, []);

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
      <button type="button" className="profile-back" onClick={() => (typeof onBack === 'function' ? onBack() : onNavigate('dashboard'))}>
        ← RETURN
      </button>

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
          </div>
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

          <div className="profile-settings-section profile-audio-section">
            <div className="profile-settings-header">
              <span className="profile-settings-icon" aria-hidden="true">🎵</span>
              <div>
                <h3>Music Volume</h3>
                <p>Adjust the dashboard background music level</p>
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
