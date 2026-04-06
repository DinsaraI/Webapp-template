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
import ItemSlider from './assets/components/itemslider';
import Hero2 from './assets/components/hero2';
import Footer from './assets/components/footer';
import Login from './pages/login';
import Item1 from './assets/images/item 1.jpg';
import Item2 from './assets/images/item 2.jpg';
import Item3 from './assets/images/item 3.jpg';
import Item4 from './assets/images/item 4.jpg';
import Item5 from './assets/images/item 5.jpg';
import Item6 from './assets/images/item 6.jpg';
import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(window.location.hash === '#login');
  const [showShop, setShowShop] = useState(window.location.hash === '#shop');
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

  const items = [
    { id: 'home-1', title: 'Item 1', img: Item1 },
    { id: 'home-2', title: 'Item 2', img: Item2 },
    { id: 'home-3', title: 'Item 3', img: Item3 },
    { id: 'home-4', title: 'Item 4', img: Item4 },
    { id: 'home-5', title: 'Item 5', img: Item5 },
    { id: 'home-6', title: 'Item 6', img: Item6 },
  ];

  if (showLogin) return <Login />;
  if (showShop) return <Shop />;
  if (showCart) return <Checkout />;
  if (showProduct) return <ProductDetailPage id={productId} />;

  return (
    <div className="app-container">
      <Navbar isSignedIn={isSignedIn} onSignOut={handleSignOut} />
      <Hero />
      <CardSlider />
      <Hero2 />
      <ItemSlider items={items} />
      <Footer />
    </div>
  );
}

export default App;