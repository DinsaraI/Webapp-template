// ## NOTES
// Footer contains social links, payment logos, and quick links.
// - It uses image icons from assets.
// - A2W branding is statically defined.
// - Should be easy for backend to populate links from config.

import FacebookIcon from '../images/facebook.png';
import InstagramIcon from '../images/instagram.png';
import MasterCardIcon from '../images/card.png';
import VisaIcon from '../images/visa.png';
import './footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-social">
          <img src={FacebookIcon} alt="Facebook" className="footer-icon" />
          <img src={InstagramIcon} alt="Instagram" className="footer-icon" />
        </div>
        <div className="footer-payments">
          <img src={MasterCardIcon} alt="Mastercard" className="footer-icon" />
          <img src={VisaIcon} alt="Visa" className="footer-icon" />
        </div>
      </div>

      <div className="footer-main">
        <div className="brand-block">
          <h2>A2W</h2>
          <p className="rating">★★★★★ 1.8m</p>
          <button className="download-btn">DOWNLOAD THE APP</button>
        </div>

        <div className="column">
          <h3>HELP & INFORMATION</h3>
          <a href="#">Help</a>
          <a href="#">Track order</a>
          <a href="#">Delivery & returns</a>
          <a href="#">Sitemap</a>
        </div>

        <div className="column">
          <h3>ABOUT A2W</h3>
          <a href="#">About us</a>
          <a href="#">Careers at A2W</a>
          <a href="#">Corporate responsibility</a>
          <a href="#">Investors' site</a>
        </div>

        <div className="column">
          <h3>MORE FROM A2W</h3>
          <a href="#">Mobile and A2W apps</a>
          <a href="#">Gift vouchers</a>
          <a href="#">Black Friday</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 A2W</span>
        <div className="footer-links">
          <a href="#">Privacy & Cookies</a>
          <a href="#">Ts&Cs</a>
          <a href="#">Accessibility</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
