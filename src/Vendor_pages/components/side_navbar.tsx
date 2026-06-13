import { useState } from 'react';
import { Home, ShoppingBag, Package, User, Settings, Menu, X } from 'lucide-react';
import './side_navbar.css';

interface SideNavbarProps {
  activeItem?: string;
}

const SideNavbar: React.FC<SideNavbarProps> = ({ activeItem = 'home' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, hash: '#Vendor_hompage' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, hash: '#orders' },
    { id: 'products', label: 'Products', icon: Package, hash: '#products' },
    { id: 'profile', label: 'My Profile', icon: User, hash: '#vendor-profile' },
    { id: 'settings', label: 'Settings', icon: Settings, hash: '#vendor-settings' },
     { id: 'returnhome', label: 'Return to Home', icon: Home, hash: '#App' },
  ];

  const handleNavigation = (hash: string) => {
    window.location.hash = hash;
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <nav className={`side-navbar ${isOpen ? 'open' : ''}`}>
        <div className="navbar-brand">Vendor Panel</div>
        
        <ul className="nav-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  className={`nav-link ${activeItem === item.id ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.hash)}
                >
                  <IconComponent size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default SideNavbar;
