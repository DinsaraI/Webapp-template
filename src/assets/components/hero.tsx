import './hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>Stop blending in. Start being the reference.</h1>
        <p>
         Designer-grade silhouettes for the everyday icon. High-end looks, real-world accessibility.
        </p>
        <div className="hero-cta">
          <button className="btn-primary">View the Collection.</button>
          <button className="btn-ghost">Style your look</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
