// ## NOTES
// Hero is the top landing section with image background and CTA buttons.
// - This is static for now; backend can replace text and button URLs.

import './hero.css';
import { useNavigate } from 'react-router-dom';
import defaultHeroImage from '../images/hero.jpg';
import type { SiteSettings } from '../../types/siteSettings';

const Hero = ({ settings }: { settings: SiteSettings }) => {
	const navigate = useNavigate();
	const heroImage = settings.hero_banner_image_url.trim() || defaultHeroImage;
  return (
    <section className="hero" style={{ backgroundImage: `url("${heroImage}")` }}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>{settings.hero_title}</h1>
        <p>{settings.hero_subtitle}</p>
        <div className="hero-cta">
          <button className="btn-primary" onClick={() => navigate('/shop')}>View the Collection.</button>
          <button className="btn-ghost">Style your look</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
