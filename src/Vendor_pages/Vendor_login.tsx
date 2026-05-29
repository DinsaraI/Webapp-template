import { useState } from 'react';
import type { FormEvent } from 'react';
import { login as loginService, register as registerService } from '../services/authService';
import '../pages/login.css';

const Vendor_login = () => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setMode((current) => (current === 'register' ? 'login' : 'register'));
    setUsername('');
    setPassword('');
    setBusinessName('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = mode === 'register'
      ? await registerService({ username, password, businessName })
      : await loginService({ username, password });

    setLoading(false);

    if (result.success) {
      window.location.hash = '#Vendor_hompage';
      return;
    }

    alert(result.message || 'Unable to continue.');
  };

  return (
    <div className="login-page">
      <div className="hero-panel" />
      <div className="form-panel">
        <div className="form-inner">
          <h1>A2W</h1>
          <h2>{mode === 'register' ? 'Join Us and Start Selling' : 'Vendor Login'}</h2>
          <p style={{ marginBottom: '18px', color: 'rgba(26,26,26,0.6)' }}>
            {mode === 'register'
              ? 'Create your vendor account and start listing products today.'
              : 'Sign in with your vendor credentials.'}
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <label>
                Store name
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your shop name"
                  required
                />
              </label>
            )}

            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </label>

            <div className="form-actions">
              <label className="checkbox-label">
                <input type="checkbox" /> Remember Me
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Processing...' : mode === 'register' ? 'Register' : 'Log in'}
            </button>

            {mode === 'login' && (
              <>
                <div className="divider">Or</div>
                <button type="button" className="google-btn" onClick={() => alert('Google login not active yet')}>
                  <img src="/src/assets/images/google.png" alt="Google" />
                  Log in with Google
                </button>
              </>
            )}

            <p style={{ marginTop: '18px', textAlign: 'center', color: 'rgba(26,26,26,0.65)' }}>
              {mode === 'register' ? (
                <>
                  Already a user?{' '}
                  <button type="button" className="secondary-btn" style={{ width: 'auto', padding: '8px 14px' }} onClick={toggleMode}>
                    Login now
                  </button>
                </>
              ) : (
                <>
                  New vendor?{' '}
                  <button type="button" className="secondary-btn" style={{ width: 'auto', padding: '8px 14px' }} onClick={toggleMode}>
                    Join us
                  </button>
                </>
              )}
            </p>

            {mode === 'login' && (
              <p style={{ marginTop: '12px', color: 'rgba(26,26,26,0.6)', fontSize: '0.9rem' }}>
                Temporary login: <strong>AuthD</strong> / <strong>Dinsara</strong>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Vendor_login;
