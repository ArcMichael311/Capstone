import './Login.css';
import { useState } from 'react';
import { supabase, syncSupabaseUserToBackend } from '../../lib/supabaseClient';

export default function Login({ onNavigate, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message || 'Login failed');
        return;
      }

      if (data?.user) {
        const backendResult = await syncSupabaseUserToBackend(data.user, password, {
          firstname: data.user.user_metadata?.firstname || data.user.user_metadata?.firstName || '',
          lastname: data.user.user_metadata?.lastname || data.user.user_metadata?.lastName || '',
          role: data.user.user_metadata?.role || 'student',
        });

        const backendUser = backendResult?.data?.user;
        onSuccess(
          backendUser
            ? {
                ...backendUser,
                firstname: backendUser.firstName || backendUser.firstname || data.user.user_metadata?.firstname || data.user.user_metadata?.firstName || '',
                lastname: backendUser.lastName || backendUser.lastname || data.user.user_metadata?.lastname || data.user.user_metadata?.lastName || '',
                user_metadata: {
                  ...(backendUser.user_metadata || {}),
                  firstname: backendUser.firstName || backendUser.firstname || data.user.user_metadata?.firstname || data.user.user_metadata?.firstName || '',
                  lastname: backendUser.lastName || backendUser.lastname || data.user.user_metadata?.lastname || data.user.user_metadata?.lastName || '',
                  role: backendUser.role || data.user.user_metadata?.role || 'student',
                  email: backendUser.email || data.user.email,
                },
              }
            : {
                email: data.user.email,
                firstname: data.user.user_metadata?.firstname || data.user.user_metadata?.firstName || '',
                lastname: data.user.user_metadata?.lastname || data.user.user_metadata?.lastName || '',
                role: data.user.user_metadata?.role || 'student',
                user_metadata: data.user.user_metadata,
              }
        );
      }
    } catch (err) {
      setError(err.message || 'Login error');
    }
  };

  return (
    <section className="login-card" aria-label="Login form">
      <div className="login-badge" aria-hidden="true">
        <span>📖</span>
      </div>

      <div className="login-copy">
        <h2>Phonics Learning</h2>
        <p>Welcome back! Let's continue learning</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field">
          <span className="login-field-label">Email *</span>
          <span className="login-field-box">
            <span className="login-field-icon" aria-hidden="true">✉️</span>
            <input type="email" name="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </span>
        </label>

        <label className="login-field">
          <span className="login-field-label">Password *</span>
          <span className="login-field-box">
            <span className="login-field-icon" aria-hidden="true">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>

        <button type="button" className="login-forgot-password" onClick={() => onNavigate('forgotpassword')}>
          Forgot password?
        </button>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="login-submit">
          SIGN IN
        </button>

        <button type="button" className="login-link" onClick={() => onNavigate('register')}>
          Don't have an account? <span>Register here</span>
        </button>
      </form>
    </section>
  );
}