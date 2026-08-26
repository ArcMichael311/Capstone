import './Register.css';
import { useState } from 'react';
import { supabase, syncSupabaseUserToBackend } from '../../lib/supabaseClient';

export default function Register({ onNavigate, onSuccess }) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstname,
            lastname,
            role: 'student',
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message || 'Signup failed');
        return;
      }

      // Registration succeeded; send the user back to login so they can verify the account by signing in.
      if (data?.user) {
        void syncSupabaseUserToBackend(data.user, password, {
          firstname,
          lastname,
          role: 'student',
        });
      } else {
        void syncSupabaseUserToBackend(
          {
            email,
            user_metadata: {
              firstname,
              lastname,
              role: 'student',
            },
          },
          password,
        );
      }

      onNavigate('login');
    } catch (err) {
      setError(err.message || 'Registration error');
    }
  };

  return (
    <section className="register-card" aria-label="Registration form">
      <div className="register-badge" aria-hidden="true">
        <span>📖</span>
      </div>

      <div className="register-copy">
        <h2>Phonics Learning</h2>
        <p>Create your learner account</p>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <label className="register-field">
          <span className="register-field-label">Firstname *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">👤</span>
            <input type="text" name="firstname" aria-label="Firstname" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Lastname *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">👤</span>
            <input type="text" name="lastname" aria-label="Lastname" value={lastname} onChange={(e) => setLastname(e.target.value)} />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Email *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">✉️</span>
            <input type="email" name="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Password *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="register-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Confirm Password *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">🔒</span>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              aria-label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="register-password-toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="register-submit">
          SIGN UP
        </button>

        <button type="button" className="register-link" onClick={() => onNavigate('login')}>
          Already have an account? <span>Sign in</span>
        </button>
      </form>
    </section>
  );
}