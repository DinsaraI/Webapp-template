// ## NOTES
// This file is the root of the app.
// - Uses hash route #login for quick access to login screen during frontend dev.
// - tracks auth state from authService (backend can replace implementation)
// - renders Navbar/landing components when not on login.

import { useEffect, useState } from 'react';
import Navbar from './assets/components/navbar';
import Shop from './pages/shop';
import ProductDetailPage from './pages/Product-detail-page';
import Checkout from './pages/checkout';
import { fetchAuthState, logout as logoutService } from './services/authService';
import Hero from './assets/components/hero';
import CardSlider from './assets/components/card_slider';
import Hero2 from './assets/components/hero2';
import Footer from './assets/components/footer';
import Login from './pages/login';
import Vendor_login from './Vendor_pages/Vendor_login';
import Vendor_homepage from './Vendor_pages/Vendor_homepage';
import Orders from './Vendor_pages/Orders';
import Products from './Vendor_pages/Products';
import Vendor_profile from './Vendor_pages/Vendor_profile';

import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(window.location.hash === '#login');
  const [showShop, setShowShop] = useState(window.location.hash === '#shop');
  const [showVendorHome, setShowVendorHome] = useState(window.location.hash === '#Vendor_hompage');
  const [showVendorLogin, setShowVendorLogin] = useState(window.location.hash === '#vendor-login' || window.location.hash === '#join');
  const [showOrders, setShowOrders] = useState(window.location.hash === '#orders');
  const [showProducts, setShowProducts] = useState(window.location.hash === '#products');
  const [showVendorProfile, setShowVendorProfile] = useState(window.location.hash === '#vendor-profile');
  const [showProduct, setShowProduct] = useState(false);
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [showCart, setShowCart] = useState(window.location.hash === '#cart' || window.location.hash === '#checkout');
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // ## NOTES: hash-based debug routing, also keep auth status updated
    // This is temporary for frontend view. Backend routing may replace this.
    const onHashChange = () => {
      const h = window.location.hash || '';
      setShowLogin(h === '#login');
      setShowShop(h === '#shop');
      setShowVendorHome(h === '#Vendor_hompage');
      setShowVendorLogin(h === '#vendor-login' || h === '#join');
      setShowOrders(h === '#orders');
      setShowProducts(h === '#products');
      setShowVendorProfile(h === '#vendor-profile');
      setShowCart(h === '#cart' || h === '#checkout');

      if (h.startsWith('#product/')) {
        setShowProduct(true);
        setProductId(h.replace('#product/', ''));
      } else {
        setShowProduct(false);
        setProductId(undefined);
      }
    };
    window.addEventListener('hashchange', onHashChange);

    // ## NOTES: authService should be replaced by real API in backend integration
    fetchAuthState().then((res) => setIsSignedIn(res.isSignedIn));

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSignOut = async () => {
    await logoutService();
    setIsSignedIn(false);
    window.location.hash = '';
  };


  if (showLogin) return <Login />;
  if (showShop) return <Shop />;
  if (showVendorLogin) return <Vendor_login />;
  if (showVendorHome) return <Vendor_homepage />;
  if (showOrders) return <Orders />;
  if (showProducts) return <Products />;
  if (showVendorProfile) return <Vendor_profile />;
  if (showCart) return <Checkout />;
  if (showProduct) return <ProductDetailPage id={productId} />;

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

export default App;