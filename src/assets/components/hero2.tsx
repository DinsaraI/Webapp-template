// ## NOTES
// Homepage hero cards for the women's and men's collections.

import womensImg from '../images/womens.jpg';
import mensImg from '../images/mens.jpg';
import { Link } from 'react-router-dom';
import './hero2.css';

const Hero2 = () => {
  return (
    <section className="hero-split">
      <Link className="split" to="/shop?category=women" aria-label="Shop Womens">
        <img className="split-image" src={womensImg} alt="" />
        <span className="split-content">
          <span className="split-title">Shop Womens</span>
          <span className="split-cta">Shop Now</span>
        </span>
      </Link>

      <Link className="split" to="/shop?category=men" aria-label="Shop Mens">
        <img className="split-image" src={mensImg} alt="" />
        <span className="split-content">
          <span className="split-title">Shop Mens</span>
          <span className="split-cta">Shop Now</span>
        </span>
      </Link>
    </section>
  );
};

export default Hero2;
