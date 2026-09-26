import React, { useState } from 'react';
import { isAdminUser } from '../services/authService';
import { supabase } from '../supabaseClient';
import './Admin_login.css';

interface AdminLoginProps {
	onLoginSuccess: () => void;
}

const Admin_login: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
			if (loginError) throw loginError;
			if (!data.user || !(await isAdminUser(data.user.id))) {
				await supabase.auth.signOut();
				throw new Error('This account does not have admin access.');
			}
			onLoginSuccess();
		} catch (loginError) {
			setError(loginError instanceof Error ? loginError.message : 'Admin sign-in failed.');
			setLoading(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="admin-login-wrapper">
			<div className="admin-login-container">
				<div className="login-card">
					<h1>Admin Portal</h1>
					<p className="subtitle">Secure Access Required</p>

					<form onSubmit={handleLogin} className="login-form">
						<div className="form-group">
							<label htmlFor="email">Email</label>
							<input
								id="email"
								type="email"
								placeholder="Enter admin email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={loading}
								autoComplete="username"
								required
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
								autoComplete="current-password"
								required
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
