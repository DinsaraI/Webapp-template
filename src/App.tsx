// ## NOTES
// This file is the root of the app.
// - Uses hash route #login for quick access to login screen during frontend dev.
// - tracks auth state from authService (backend can replace implementation)
// - renders Navbar/landing components when not on login.

import { useEffect, useState } from 'react';
import Navbar from './assets/components/navbar';
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
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // ## NOTES: hash-based debug routing, also keep auth status updated
    // This is temporary for frontend view. Backend routing may replace this.
    const onHashChange = () => setShowLogin(window.location.hash === '#login');
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
    { title: 'Item 1', img: Item1 },
    { title: 'Item 2', img: Item2 },
    { title: 'Item 3', img: Item3 },
    { title: 'Item 4', img: Item4 },
    { title: 'Item 5', img: Item5 },
    { title: 'Item 6', img: Item6 },
  ];

  if (showLogin) {
    return <Login />;
  }

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