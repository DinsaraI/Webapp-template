import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  login as loginService,
  register as registerService,
  requestPasswordReset,
  signInWithGoogle,
  updatePassword,
} from '../services/authService';
import { hasCheckoutRedirect } from '../services/checkoutRedirect';
import Footer from '../assets/components/footer';
import googleIcon from '../assets/images/google.png';
import './login.css';

type LoginMode = 'login' | 'signup' | 'forgotPassword' | 'resetPassword';

interface LoginProps {
  initialMode?: LoginMode;
  onAuthComplete?: () => void;
}

const Login = ({ initialMode = 'login', onAuthComplete }: LoginProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [returnToCheckout] = useState(hasCheckoutRedirect);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'forgotPassword') {
        const { error } = await requestPasswordReset(email.trim());
        if (error) throw error;
        setMessage({ type: 'success', text: 'If an account exists for that email, a password reset link is on its way.' });
        return;
      }

      if (mode === 'resetPassword') {
        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: 'The passwords do not match.' });
          return;
        }
        const { error } = await updatePassword(password);
        if (error) throw error;
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setMessage({ type: 'success', text: 'Your password has been updated.' });
        return;
      }

      if (mode === 'signup') {
        const { data, error } = await registerService(email.trim(), password, fullName.trim());
        if (error) throw error;
        if (data.session) {
          if (!returnToCheckout) navigate('/', { replace: true });
        } else {
          setMessage({ type: 'success', text: 'Account created. Check your email to confirm your address, then sign in.' });
          setMode('login');
        }
        return;
      }

      const { error } = await loginService(email.trim(), password);
      if (error) throw error;
      onAuthComplete?.();
      if (!returnToCheckout) navigate('/', { replace: true });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Authentication failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage(null);
    setSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Google sign-in could not be started.' });
      setSubmitting(false);
    }
  };

  const changeMode = (nextMode: LoginMode) => {
    setMessage(null);
    setMode(nextMode);
  };

  const title = mode === 'signup' ? 'Create account' : mode === 'forgotPassword' ? 'Reset password' : mode === 'resetPassword' ? 'Choose a new password' : 'Log in';

  return (
    <div className="login-page">
      <div className="hero-panel" />
      <div className="form-panel">
        <div className="form-inner">
          <h1>A2W</h1>
          <h2>{title}</h2>

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'signup' && (
              <label>
                Full name
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
              </label>
            )}

            {mode !== 'resetPassword' && (
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </label>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'resetPassword') && (
              <label>
                {mode === 'resetPassword' ? 'New password' : 'Password'}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
              </label>
            )}

            {mode === 'resetPassword' && (
              <label>
                Confirm new password
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
              </label>
            )}

            {mode === 'login' && (
              <div className="form-actions">
                <button type="button" className="forgot-link" onClick={() => changeMode('forgotPassword')}>Forgot password?</button>
              </div>
            )}

            {message && <p className={`auth-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'forgotPassword' ? 'Send reset link' : mode === 'resetPassword' ? 'Update password' : 'Log in'}
            </button>

            {(mode === 'login' || mode === 'signup') && (
              <>
                <div className="divider">Or</div>
                <button type="button" onClick={handleGoogleLogin} className="google-btn" disabled={submitting}>
                  <img src={googleIcon} alt="" />
                  Continue with Google
                </button>
              </>
            )}

            {mode === 'login' && <button type="button" className="secondary-btn" onClick={() => changeMode('signup')}>Create an account</button>}
            {mode === 'signup' && <button type="button" className="secondary-btn" onClick={() => changeMode('login')}>Already have an account? Log in</button>}
            {(mode === 'forgotPassword' || mode === 'resetPassword') && <button type="button" className="secondary-btn" onClick={() => changeMode('login')}>Back to log in</button>}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
