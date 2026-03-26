import womensImg from '../images/womens.jpg';
import mensImg from '../images/mens.jpg';
import './hero2.css';

const Hero2 = () => {
  return (
    <section className="hero-split">
      <div
        className="split left"
        style={{ backgroundImage: `url(${womensImg})` }}
      >
        <div className="label"><span className="dot" />womens clothing</div>
      </div>

      <div
        className="split right"
        style={{ backgroundImage: `url(${mensImg})` }}
      >
        <div className="label"><span className="dot" />mens clothing</div>
      </div>
    </section>
  );
};

export default Hero2;
