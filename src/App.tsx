// ## NOTES
// This file is the root of the app.
// - Uses hash route #login for quick access to login screen during frontend dev.
// - tracks auth state from authService (backend can replace implementation)
// - renders Navbar/landing components when not on login.

import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './assets/components/navbar';
import StoreFront from './pages/StoreFront';
import ContactUs from './pages/contact_us';
import ProductDetailPage from './pages/Product-detail-page';
import Checkout from './pages/checkout';
import { isAdminUser, logout as logoutService } from './services/authService';
import { supabase } from './supabaseClient';
import Hero from './assets/components/hero';
import CardSlider from './assets/components/card_slider';
import Hero2 from './assets/components/hero2';
import Footer from './assets/components/footer';
import Login from './pages/login';
import Admin_page from './Admin/Admin_page';
import Admin_login from './Admin/Admin_login';

import './App.css';

function AppShell() {
  const navigate = useNavigate();
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;
    const syncSession = (session: { user: { id: string } } | null) => {
      currentUserId = session?.user.id ?? null;
      setIsSignedIn(Boolean(session?.user));
      if (!session?.user) {
        setAdminAuthenticated(false);
        return;
      }
      const userId = session.user.id;
      window.setTimeout(() => {
        void isAdminUser(userId)
          .then((isAdmin) => {
            if (active && currentUserId === userId) setAdminAuthenticated(isAdmin);
          })
          .catch(() => {
            if (active && currentUserId === userId) setAdminAuthenticated(false);
          });
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      syncSession(session ? { user: { id: session.user.id } } : null);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session ? { user: { id: session.user.id } } : null);
    });

    return () => {
      active = false;
      currentUserId = null;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await logoutService();
    if (error) {
      console.error('Unable to sign out:', error.message);
      return;
    }
    navigate('/', { replace: true });
  };

  if (passwordRecovery) {
    return <Login key="password-recovery" initialMode="resetPassword" onAuthComplete={() => setPasswordRecovery(false)} />;
  }

  return (
    <Routes>
      <Route path="/" element={(
        <div className="app-container">
          <Navbar isSignedIn={isSignedIn} onSignOut={handleSignOut} />
          <Hero />
          <CardSlider />
          <Hero2 />
          <Footer />
        </div>
      )} />
      <Route path="/shop" element={<StoreFront isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/login" element={<Login />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/product/:id" element={<ProductDetailPage isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
      <Route path="/admin" element={adminAuthenticated ? <Admin_page /> : <Admin_login onLoginSuccess={() => setAdminAuthenticated(true)} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return <AppShell />;
}

export default App;