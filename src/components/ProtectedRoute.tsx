import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export type AdminAccess = 'loading' | 'admin' | 'customer' | 'error';

interface ProtectedRouteProps {
	authReady: boolean;
	isSignedIn: boolean;
	adminAccess: AdminAccess;
	children: ReactNode;
}

export default function ProtectedRoute({
	authReady,
	isSignedIn,
	adminAccess,
	children,
}: ProtectedRouteProps) {
	if (!authReady) return <p role="status">Checking your account...</p>;
	if (!isSignedIn) return <Navigate to="/login" replace />;
	if (adminAccess === 'loading') return <p role="status">Verifying admin access...</p>;
	if (adminAccess === 'error') return <p role="alert">Admin access could not be verified. Please try again later.</p>;
	if (adminAccess !== 'admin') return <Navigate to="/" replace />;
	return children;
}
