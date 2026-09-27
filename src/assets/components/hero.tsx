// ## NOTES
// Hero is the top landing section with image background and CTA buttons.
// - This is static for now; backend can replace text and button URLs.

import './hero.css';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
	const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>Stop blending in. Start being the reference.</h1>
        <p>
         Designer-grade silhouettes for the everyday icon. High-end looks, real-world accessibility.
        </p>
        <div className="hero-cta">
          <button className="btn-primary" onClick={() => navigate('/shop')}>View the Collection.</button>
          <button className="btn-ghost">Style your look</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
