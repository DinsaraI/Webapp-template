// ## NOTES
// This file is the root of the app.
// - Uses hash route #login for quick access to login screen during frontend dev.
// - tracks auth state from authService (backend can replace implementation)
// - renders Navbar/landing components when not on login.

import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import type { AdminAccess } from './components/ProtectedRoute';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './assets/components/navbar';
import { isAdminUser, logout as logoutService } from './services/authService';
import { supabase } from './supabaseClient';
import Hero2 from './assets/components/hero2';
import Hero from './assets/components/hero';
import HeroCampaigns from './assets/components/hero-campaigns';
import Footer from './assets/components/footer';
import AnnouncementBar from './assets/components/announcement-bar';
import FeaturedProducts from './assets/components/featured-products';
import TrustBadges from './assets/components/trust-badges';
import { consumeCheckoutRedirect, setCheckoutRedirect } from './services/checkoutRedirect';
import { SiteSettingsProvider } from './context/siteSettingsProvider';
import { useSiteSettings } from './context/useSiteSettings';

import './App.css';

const StoreFront = lazy(() => import('./pages/StoreFront'));
const ContactUs = lazy(() => import('./pages/contact_us'));
const ProductDetailPage = lazy(() => import('./pages/Product-detail-page'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Checkout = lazy(() => import('./pages/checkout'));
const Login = lazy(() => import('./pages/login'));
const Profile = lazy(() => import('./pages/Profile'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const AdminPage = lazy(() => import('./Admin/Admin_page'));

function CheckoutGate({ authReady, isSignedIn }: { authReady: boolean; isSignedIn: boolean }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authReady || isSignedIn) return;
    setCheckoutRedirect();
    navigate('/login', { replace: true });
  }, [authReady, isSignedIn, navigate]);

  if (!authReady || !isSignedIn) return <p role="status">Checking your account...</p>;
  return <Checkout />;
}

function HomePage({ isSignedIn, onSignOut }: { isSignedIn: boolean; onSignOut: () => Promise<void> }) {
  const { settings } = useSiteSettings();
  const [announcementVisible, setAnnouncementVisible] = useState(
    () => localStorage.getItem('a2w_announcement_dismissed_v1') !== 'true',
  );
  const showAnnouncement = announcementVisible && settings.announcement_enabled;

  return (
    <div className={`app-container home-page${showAnnouncement ? ' announcement-visible' : ''}`}>
      {showAnnouncement && <AnnouncementBar text={settings.announcement_text} onDismiss={() => setAnnouncementVisible(false)} />}
      <Navbar isSignedIn={isSignedIn} onSignOut={onSignOut} announcementVisible={showAnnouncement} />
      <Hero settings={settings} />
      <Hero2 />
      <TrustBadges />
      <FeaturedProducts />
      <HeroCampaigns />
      <Footer />
    </div>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const [adminAccess, setAdminAccess] = useState<AdminAccess>('loading');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;
    const syncSession = (session: { user: { id: string } } | null) => {
      currentUserId = session?.user.id ?? null;
      setIsSignedIn(Boolean(session?.user));
      setAuthReady(true);
      if (!session?.user) {
        setAdminAccess('customer');
        return;
      }
      const userId = session.user.id;
      setAdminAccess('loading');
      window.setTimeout(() => {
        void isAdminUser(userId)
          .then((isAdmin) => {
            if (active && currentUserId === userId) setAdminAccess(isAdmin ? 'admin' : 'customer');
          })
          .catch((error: unknown) => {
            console.error('Unable to verify administrator role:', error);
            if (active && currentUserId === userId) setAdminAccess('error');
          });
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      syncSession(session ? { user: { id: session.user.id } } : null);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session ? { user: { id: session.user.id } } : null);
    }).catch(() => {
      setAuthReady(true);
    });

    return () => {
      active = false;
      currentUserId = null;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('post_auth_redirect') === '/checkout') {
      setCheckoutRedirect();
    }
    if (!authReady || !isSignedIn) return;

    const destination = consumeCheckoutRedirect();
    if (!destination) return;

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('post_auth_redirect');
    window.history.replaceState(window.history.state, '', currentUrl);
    navigate(destination, { replace: true });
  }, [authReady, isSignedIn, navigate]);

  const handleSignOut = async () => {
    const { error } = await logoutService();
    if (error) {
      console.error('Unable to sign out:', error.message);
      return;
    }
    navigate('/', { replace: true });
  };

  if (passwordRecovery) {
    return (
      <Suspense fallback={<p className="route-loading" role="status">Loading page...</p>}>
        <Login key="password-recovery" initialMode="resetPassword" onAuthComplete={() => setPasswordRecovery(false)} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<p className="route-loading" role="status">Loading page...</p>}>
      <Routes>
        <Route path="/" element={<HomePage isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
        <Route path="/shop" element={<StoreFront isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
        <Route path="/search" element={<SearchResults isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
        <Route path="/contact" element={<ContactUs isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
        <Route path="/policies/:policyId" element={<PolicyPage isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={!authReady ? <p role="status">Checking your account...</p> : isSignedIn ? <Profile isSignedIn={isSignedIn} onSignOut={handleSignOut} /> : <Navigate to="/login" replace />} />
        <Route path="/orders" element={!authReady ? <p role="status">Checking your account...</p> : isSignedIn ? <OrderHistory isSignedIn={isSignedIn} onSignOut={handleSignOut} /> : <Navigate to="/login" replace />} />
        <Route path="/checkout" element={<CheckoutGate authReady={authReady} isSignedIn={isSignedIn} />} />
        <Route path="/product/:id" element={<ProductDetailPage isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
        <Route path="/admin" element={
          <ProtectedRoute authReady={authReady} isSignedIn={isSignedIn} adminAccess={adminAccess}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return <AppShell />;
}

function AppWithSettings() {
  return (
    <SiteSettingsProvider>
      <App />
    </SiteSettingsProvider>
  );
}

export default AppWithSettings;