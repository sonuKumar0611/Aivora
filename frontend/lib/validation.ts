/** Simple email format check */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthValidationResult {
  valid: boolean;
  emailError?: string;
  passwordError?: string;
}

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address';
  return undefined;
}

export function validatePassword(
  password: string,
  options: { minLength?: number; forSignup?: boolean } = {}
): string | undefined {
  const { minLength = 8, forSignup = false } = options;
  if (!password) return 'Password is required';
  if (forSignup && password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return undefined;
}

export function validateLoginForm(email: string, password: string): AuthValidationResult {
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password, { forSignup: false });
  return {
    valid: !emailError && !passwordError,
    emailError,
    passwordError,
  };
}

export function validateSignupForm(email: string, password: string): AuthValidationResult {
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password, { forSignup: true, minLength: 8 });
  return {
    valid: !emailError && !passwordError,
    emailError,
    passwordError,
  };
}
