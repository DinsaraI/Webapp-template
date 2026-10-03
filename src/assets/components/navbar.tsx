// ## NOTES
// Navbar holds top UI navigation and profile action.
// - `isSignedIn` controls whether menu shows sign-in or sign-out
// - `onSignOut` is called by backend integration
// - `#login` hash link option in profile deals with frontend-only auth demo.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Menu, ShoppingCart, Bell } from 'lucide-react';
import './navbar.css';
import Cart from '../../generative-components/cart';
import { openCart, getCart } from '../../services/cartService';
import { getNotifications, markNotificationsRead } from '../../services/notificationService';
import type { CustomerNotification } from '../../services/notificationService';
import { supabase } from '../../supabaseClient';
import ProductSearch from './product-search';

interface NavbarProps {
  isSignedIn?: boolean;
  onSignOut?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSignedIn = false, onSignOut }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [cartCount, setCartCount] = useState<number>(getCart().length);
  const [cartShake, setCartShake] = useState(false);
  const [notificationUserId, setNotificationUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const notificationUserRef = useRef<string | null>(null);
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

  useEffect(() => {
    let active = true;
    const syncUser = (userId: string | null) => {
      if (active) {
        if (notificationUserRef.current !== userId) {
          notificationUserRef.current = userId;
          setNotifications([]);
          setNotificationOpen(false);
        }
        setNotificationUserId(userId);
        if (!userId) {
          setNotificationError('');
        }
      }
    };
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setNotificationError('Notifications could not be loaded.');
        console.error('Unable to identify notification recipient:', error.message);
        return;
      }
      syncUser(data.user?.id ?? null);
    }).catch((error: unknown) => {
      if (active) {
        setNotificationError('Notifications could not be loaded.');
        console.error('Unable to identify notification recipient:', error);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!notificationUserId) return;

    let active = true;
    const loadNotifications = async () => {
      try {
        const currentNotifications = await getNotifications();
        if (active) {
          setNotifications(currentNotifications);
          setNotificationError('');
        }
      } catch (error) {
        if (active) setNotificationError('Notifications could not be loaded.');
        console.error('Unable to load notifications:', error);
      }
    };

    void loadNotifications();
    const channel = supabase
      .channel(`customer-notifications-${notificationUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${notificationUserId}`,
      }, () => {
        void loadNotifications();
      })
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          void loadNotifications();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setNotificationError('Live notifications could not be loaded.');
          console.error('Unable to subscribe to notifications:', error);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [notificationUserId]);

  useEffect(() => {
    const nextExpiry = notifications
      .map((notification) => notification.expires_at)
      .filter((expiresAt): expiresAt is string => Boolean(expiresAt))
      .map((expiresAt) => new Date(expiresAt).getTime())
      .filter((expiresAt) => expiresAt > Date.now())
      .sort((left, right) => left - right)[0];

    if (!nextExpiry) return;
    const timeout = window.setTimeout(() => {
      void getNotifications().then(setNotifications).catch((error: unknown) => {
        setNotificationError('Notifications could not be refreshed.');
        console.error('Unable to refresh notifications:', error);
      });
    }, Math.max(0, nextExpiry - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [notifications]);

  const toggleNotifications = async () => {
    const opening = !notificationOpen;
    setNotificationOpen(opening);
    if (!opening) return;

    const unreadIds = notifications
      .filter((notification) => !notification.read_at)
      .map((notification) => notification.id);
    if (unreadIds.length === 0) return;

    try {
      await markNotificationsRead(unreadIds);
      setNotifications(await getNotifications());
      setNotificationError('');
    } catch (error) {
      setNotificationError('Notifications could not be marked as read.');
      console.error('Unable to mark notifications as read:', error);
    }
  };

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
        <ProductSearch />
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
              {isSignedIn && <li><Link className="menu-item" to="/profile" onClick={() => setProfileOpen(false)}>Profile</Link></li>}
              <li>
                <button
                  className="menu-item"
                  onClick={() => {
                    setProfileOpen(false);
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

        {notificationUserId && (
          <div className="notification-menu">
            <button
              className="nav-notifications"
              aria-label={`Notifications, ${notifications.filter((notification) => !notification.read_at).length} unread`}
              aria-expanded={notificationOpen}
              aria-controls="customer-notifications"
              onClick={() => { void toggleNotifications(); }}
            >
              <Bell size={19} strokeWidth={1.6} />
              {notifications.some((notification) => !notification.read_at) && (
                <span className="notification-badge">
                  {notifications.filter((notification) => !notification.read_at).length}
                </span>
              )}
            </button>
            <div id="customer-notifications" className={`notification-panel ${notificationOpen ? 'open' : ''}`}>
              <h2>Notifications</h2>
              {notificationError && <p className="notification-error" role="alert">{notificationError}</p>}
              {!notificationError && notifications.length === 0 && <p className="notification-empty">You have no notifications.</p>}
              {notifications.length > 0 && (
                <ul>
                  {notifications.map((notification) => (
                    <li key={notification.id} className={notification.read_at ? 'read' : 'unread'}>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

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