// ## NOTES
// Login page for frontend dev temporary authentication.
// - Uses authService.login, redirects to main app on success
// - Google button placeholder, backend can add OAuth flow
// - #login hash routing controlled by App.tsx

import { useState } from 'react';
import { login as loginService } from '../services/authService';
import './login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await loginService({ username, password });

    if (result.success) {
      console.log('Login success:', result.user);
      window.location.hash = '';
      window.location.reload();
    } else {
      alert(result.message || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    console.log('google login click');
  };

  return (
    <div className="login-page">
      <div className="hero-panel" />
      <div className="form-panel">
        <div className="form-inner">
          <h1>A2W</h1>
          <h2>Log in</h2>

          <form onSubmit={handleSubmit} className="login-form">
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

            <button type="submit" className="primary-btn">Log in</button>

            <div className="divider">Or</div>

            <button type="button" onClick={handleGoogleLogin} className="google-btn">
              <img src="/src/assets/images/google.png" alt="Google" />
              Log in with Google
            </button>

            <button type="button" className="secondary-btn">Sign up</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
