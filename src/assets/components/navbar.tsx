// ## NOTES
// Navbar holds top UI navigation and profile action.
// - `isSignedIn` controls whether menu shows sign-in or sign-out
// - `onSignOut` is called by backend integration
// - `#login` hash link option in profile deals with frontend-only auth demo.

import { useEffect, useRef, useState } from 'react';
import { User, Menu } from 'lucide-react';
import './navbar.css';

interface NavbarProps {
  isSignedIn?: boolean;
  onSignOut?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSignedIn = false, onSignOut }) => {
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (profileRef.current.contains(e.target as Node)) return;
      setProfileOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <div className="logo">A2W</div>

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
          <li><a href="#cart">CART</a></li>
          <li><a href="#contact">CONTACT US</a></li>
          <li><a href="#menu">MENU</a></li>
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
                      window.location.hash = '#login';
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

        {/* Mobile-only button: toggles panel with search + links */}
        <button
          className="mobile-menu-btn"
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Mobile panel: appears below the navbar when mobileOpen is true */}
      <div className={`mobile-panel ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-panel-inner">
          <input
            type="text"
            className="search-input mobile-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ul className="mobile-links">
            <li><a href="#cart">CART</a></li>
            <li><a href="#contact">CONTACT US</a></li>
            <li><a href="#menu">MENU</a></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;