// ## NOTES
// This file is the root of the app.
// - Uses hash route #login for quick access to login screen during frontend dev.
// - tracks auth state from authService (backend can replace implementation)
// - renders Navbar/landing components when not on login.

import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(window.location.hash === '#login');
  const [showShop, setShowShop] = useState(window.location.hash === '#shop');
  const [showContact, setShowContact] = useState(window.location.hash === '#contact');
  const [showProduct, setShowProduct] = useState(false);
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [showCart, setShowCart] = useState(window.location.hash === '#cart' || window.location.hash === '#checkout');
  const [showAdmin, setShowAdmin] = useState(window.location.hash === '#admin');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    // ## NOTES: hash-based debug routing, also keep auth status updated
    // This is temporary for frontend view. Backend routing may replace this.
    const onHashChange = () => {
      const h = window.location.hash || '';
      setShowLogin(h === '#login');
      setShowShop(h === '#shop');
      setShowContact(h === '#contact');
      setShowCart(h === '#cart' || h === '#checkout');
      setShowAdmin(h === '#admin');

      if (h.startsWith('#product/')) {
        setShowProduct(true);
        setProductId(h.replace('#product/', ''));
      } else {
        setShowProduct(false);
        setProductId(undefined);
      }
    };
    window.addEventListener('hashchange', onHashChange);

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
      window.removeEventListener('hashchange', onHashChange);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await logoutService();
    if (error) {
      console.error('Unable to sign out:', error.message);
      return;
    }
    window.location.hash = '';
  };


  if (location.pathname === '/shop') return <StoreFront isSignedIn={isSignedIn} onSignOut={handleSignOut} />;
  if (location.pathname === '/contact') return <ContactUs />;
  if (location.pathname !== '/') {
    return (
      <div className="app-container">
        <Navbar isSignedIn={isSignedIn} onSignOut={handleSignOut} />
        <Hero />
        <CardSlider />
        <Hero2 />
        <Footer />
      </div>
    );
  }

  if (passwordRecovery) {
    return <Login key="password-recovery" initialMode="resetPassword" onAuthComplete={() => setPasswordRecovery(false)} />;
  }
  if (showLogin) return <Login />;
  if (showShop) return <StoreFront isSignedIn={isSignedIn} onSignOut={handleSignOut} />;
  if (showContact) return <ContactUs />;
  if (showCart) return <Checkout />;
  if (showProduct) return <ProductDetailPage id={productId} isSignedIn={isSignedIn} onSignOut={handleSignOut} />;
  if (showAdmin) return adminAuthenticated ? <Admin_page /> : <Admin_login onLoginSuccess={() => setAdminAuthenticated(true)} />;

  return (
    <div className="app-container">
      <Navbar isSignedIn={isSignedIn} onSignOut={handleSignOut} />
      <Hero />
      <CardSlider />
      <Hero2 />

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<AppShell />} />
    </Routes>
  );
}

export default App;