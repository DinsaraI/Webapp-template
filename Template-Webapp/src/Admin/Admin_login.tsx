import React, { useState } from 'react';
import './Admin_login.css';

interface AdminLoginProps {
	onLoginSuccess: () => void;
}

const Admin_login: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const ADMIN_USERNAME = 'Asini.iAuth';
	const ADMIN_PASSWORD = 'Asinisu#2699';

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		// Simulate a small delay for better UX
		setTimeout(() => {
			if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
				localStorage.setItem('adminAuthenticated', 'true');
				onLoginSuccess();
			} else {
				setError('Invalid username or password');
				setPassword('');
			}
			setLoading(false);
		}, 500);
	};

	return (
		<div className="admin-login-wrapper">
			<div className="admin-login-container">
				<div className="login-card">
					<h1>Admin Portal</h1>
					<p className="subtitle">Secure Access Required</p>

					<form onSubmit={handleLogin} className="login-form">
						<div className="form-group">
							<label htmlFor="username">Username</label>
							<input
								id="username"
								type="text"
								placeholder="Enter username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								disabled={loading}
								autoFocus
							/>
						</div>

						<div className="form-group">
							<label htmlFor="password">Password</label>
							<input
								id="password"
								type="password"
								placeholder="Enter password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={loading}
							/>
						</div>

						{error && <div className="error-message">{error}</div>}

						<button type="submit" className="login-button" disabled={loading}>
							{loading ? 'Authenticating...' : 'Login'}
						</button>
					</form>

					<div className="login-footer">
						<p>Authorized personnel only</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Admin_login;
