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
import SearchResults from './pages/SearchResults';
import Checkout from './pages/checkout';
import { isAdminUser, logout as logoutService } from './services/authService';
import { getProducts } from './services/productService';
import type { Product } from './types/product';
import { supabase } from './supabaseClient';
import ItemSlider from './assets/components/itemslider';
import Hero2 from './assets/components/hero2';
import HeroCampaigns from './assets/components/hero-campaigns';
import Footer from './assets/components/footer';
import Login from './pages/login';
import Profile from './pages/Profile';
import Admin_page from './Admin/Admin_page';
import Admin_login from './Admin/Admin_login';
import { consumeCheckoutRedirect, setCheckoutRedirect } from './services/checkoutRedirect';

import './App.css';

function LatestDrops() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    getProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'Products could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="latest-drops">
      <h2>Latest Drops</h2>
      {loading && <p role="status">Loading products...</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {!loading && !errorMessage && products.length === 0 && <p>No products are available yet.</p>}
      {!loading && !errorMessage && products.length > 0 && <ItemSlider items={products} />}
    </section>
  );
}

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

function AppShell() {
  const navigate = useNavigate();
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
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
    return <Login key="password-recovery" initialMode="resetPassword" onAuthComplete={() => setPasswordRecovery(false)} />;
  }

  return (
    <Routes>
      <Route path="/" element={(
        <div className="app-container">
          <Navbar isSignedIn={isSignedIn} onSignOut={handleSignOut} />
          <Hero2 />
          <LatestDrops />
          <HeroCampaigns />
          <Footer />
        </div>
      )} />
      <Route path="/shop" element={<StoreFront isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
      <Route path="/search" element={<SearchResults isSignedIn={isSignedIn} onSignOut={handleSignOut} />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={!authReady ? <p role="status">Checking your account...</p> : isSignedIn ? <Profile isSignedIn={isSignedIn} onSignOut={handleSignOut} /> : <Navigate to="/login" replace />} />
      <Route path="/checkout" element={<CheckoutGate authReady={authReady} isSignedIn={isSignedIn} />} />
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