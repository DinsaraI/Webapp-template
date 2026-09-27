// ## NOTES
// Navbar holds top UI navigation and profile action.
// - `isSignedIn` controls whether menu shows sign-in or sign-out
// - `onSignOut` is called by backend integration
// - `#login` hash link option in profile deals with frontend-only auth demo.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Menu, ShoppingCart } from 'lucide-react';
import './navbar.css';
import Cart from '../../generative-components/cart';
import { openCart, getCart } from '../../services/cartService';

interface NavbarProps {
  isSignedIn?: boolean;
  onSignOut?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSignedIn = false, onSignOut }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [cartCount, setCartCount] = useState<number>(getCart().length);
  const [cartShake, setCartShake] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const lastY = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);
  const ticking = useRef(false);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (profileRef.current.contains(e.target as Node)) return;
      setProfileOpen(false);
    };
    document.addEventListener('click', onDocClick);
    const onCartUpdated = () => setCartCount(getCart().length);
    const onCartAdded = () => {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 600);
    };
    window.addEventListener('a2w:cart-updated', onCartUpdated as EventListener);
    window.addEventListener('a2w:cart-added', onCartAdded as EventListener);
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('a2w:cart-updated', onCartUpdated as EventListener);
      window.removeEventListener('a2w:cart-added', onCartAdded as EventListener);
    };
  }, []);

  // hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // if scrolling down and passed a small threshold, hide
        if (y > lastY.current && y > 40) {
          setVisible(false);
        } else {
          setVisible(true);
        }
        lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${visible ? 'visible' : 'hidden'}`}>
      {/* Left: Logo */}
      <div
        className="logo"
        role="button"
        tabIndex={0}
        onClick={() => { setMobileOpen(false); navigate('/'); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { setMobileOpen(false); navigate('/'); }
        }}
      >
        A2W
      </div>

      {/* Center: Functional Search Bar (hidden on small screens) */}
      <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Right: Links + Profile + Mobile Menu Button */}
      <div className="nav-right">
        <ul className="nav-links">
          <li><Link to="/shop">SHOP NOW</Link></li>
          <li><Link to="/contact">CONTACT US</Link></li>
          <li><Link to="/">MENU</Link></li>
        </ul>

        <div className="profile-icon" ref={profileRef}>
          <button
            className="profile-btn"
            aria-label="Profile"
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen((v) => !v);
            }}
          >
            <User size={20} strokeWidth={1.5} />
          </button>

          <div className={`profile-menu ${profileOpen ? 'open' : ''}`}>
            <ul>
              <li><button className="menu-item">Switch Account</button></li>
              <li>
                <button
                  className="menu-item"
                  onClick={() => {
                    if (isSignedIn) {
                      onSignOut?.();
                    } else {
                      navigate('/login');
                    }
                  }}
                >
                  {isSignedIn ? 'Sign Out' : 'Sign In'}
                </button>
              </li>
              <li><button className="menu-item">Help</button></li>
            </ul>
          </div>
        </div>

        <button
          className={`nav-cart ${cartShake ? 'shake' : ''}`}
          aria-label="Open cart"
          onClick={(e) => {
            e.preventDefault();
            openCart();
          }}
        >
          <ShoppingCart size={18} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>

        {/* Mobile-only button: toggles panel with search + links */}
        <button
          className="mobile-menu-btn"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Mobile panel: appears below the navbar when mobileOpen is true */}
      <div id="mobile-navigation" className={`mobile-panel ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-panel-inner">
          <input
            type="text"
            className="search-input mobile-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ul className="mobile-links">
            <li><Link to="/shop" onClick={() => setMobileOpen(false)}>SHOP NOW</Link></li>
            <li><Link to="/contact" onClick={() => setMobileOpen(false)}>CONTACT US</Link></li>
            <li><Link to="/" onClick={() => setMobileOpen(false)}>MENU</Link></li>
            <li><button className="mobile-cart" onClick={() => { setMobileOpen(false); openCart(); }}>Open cart</button></li>
          </ul>
        </div>
      </div>
      </nav>
      <Cart />
    </>
  );
};

export default Navbar;