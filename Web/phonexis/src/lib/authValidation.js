// Shared by Login and Register so both forms apply the same rules as the backend.
export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email) {
  if (!email.trim()) {
    return 'Email is required';
  }
  return null;
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}
