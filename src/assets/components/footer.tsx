import { Link } from 'react-router-dom';
import FacebookIcon from '../images/facebook.png';
import InstagramIcon from '../images/instagram.png';
import MasterCardIcon from '../images/card.png';
import VisaIcon from '../images/visa.png';
import './footer.css';

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <section className="footer-brand" aria-labelledby="footer-brand-name">
          <Link className="footer-logo" to="/" id="footer-brand-name">A2W</Link>
          <p className="footer-tagline">Considered style. Made for every day.</p>
          <div className="footer-social" aria-label="Follow A2W">
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">
              <img src={FacebookIcon} alt="" className="footer-icon" />
            </a>
            <a href="https://www.instagram.com/a2w_official/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <img src={InstagramIcon} alt="" className="footer-icon" />
            </a>
          </div>
        </section>

        <nav className="footer-column" aria-label="Shop">
          <h2>Shop</h2>
          <Link to="/shop?category=women">Women</Link>
          <Link to="/shop?category=men">Men</Link>
          <Link to="/shop?tag=New">New Arrivals</Link>
          <Link to="/shop?tag=Sale">Sale</Link>
        </nav>

        <nav className="footer-column" aria-label="Support and legal">
          <h2>Support &amp; Legal</h2>
          <Link to="/contact">Contact Us</Link>
          <Link to="/policies/shipping">Shipping &amp; Delivery</Link>
          <Link to="/policies/returns">Returns &amp; Exchanges</Link>
          <Link to="/policies/privacy">Privacy Policy</Link>
          <Link to="/policies/terms">Terms of Service</Link>
        </nav>

        <section className="footer-payments-section" aria-labelledby="footer-payments-title">
          <h2 id="footer-payments-title">Payment methods</h2>
          <div className="footer-payments">
            <span className="footer-payment-method">Cash on Delivery</span>
            <span className="footer-payment-method">Bank Transfer</span>
            <img src={VisaIcon} alt="Visa" className="footer-icon" />
            <img src={MasterCardIcon} alt="Mastercard" className="footer-icon" />
          </div>
          <p>Available payment options are shown at checkout.</p>
        </section>
      </div>

      <div className="footer-bottom">
        <span>© {currentYear} A2W. All rights reserved.</span>
        <nav className="footer-legal-links" aria-label="Legal">
          <Link to="/policies/privacy">Privacy</Link>
          <Link to="/policies/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
