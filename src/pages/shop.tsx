import React, { useEffect, useRef } from 'react';
import Navbar from '../assets/components/navbar';
import Footer from '../assets/components/footer';
import './shop.css';
import CardImg1 from '../assets/images/shop_card1.jpg';
import CardImg2 from '../assets/images/shop_card2.jpg';
import CardImg3 from '../assets/images/shop_card3.jpg';
import CardImg4 from '../assets/images/shop_card4.jpg';
import CardImg5 from '../assets/images/shop_card5.jpg';
import ProductCard from '../generative-components/product-card';

const cardsData = [
  { id: 1, img: CardImg1, title: 'THE LAB', text: 'check out upcoming designs and vote', href: '#lab' },
  { id: 2, img: CardImg2, title: 'THE DROP', text: "latest designs. 7 day exclusives", href: '#drop' },
  { id: 3, img: CardImg3, title: 'DESIGNERS', text: 'meet the designers and make custom requests.', href: '#designers' },
  { id: 5, img: CardImg5, title: 'CUSTOM MADE', text: 'made to measurements, check out your measurements', href: '#custom' },
];

const Card: React.FC<{
  img: string;
  title: string;
  text: string;
  href: string;
  onSelectType?: (t: string) => void;
}> = ({ img, title, text, href, onSelectType }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className="menu-card"
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={() => (window.location.hash = href)}
      onKeyDown={(e) => e.key === 'Enter' && (window.location.hash = href)}
    >
      <div className="card-media" style={{ backgroundImage: `url(${img})` }} />
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-text">{text}</p>
        {onSelectType && (
          <select
            className="card-select"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSelectType(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Select type
            </option>
            <option value="hoodies">Hoodies</option>
            <option value="dresses">Dresses</option>
            <option value="tees">Tee's</option>
          </select>
        )}
      </div>
    </div>
  );
};

const CardsMenu: React.FC = () => {
  const onSelectType = (type: string) => {
    window.location.hash = `#type/${type}`;
  };

  return (
    <section className="cards-menu">
      <div className="cards-inner">
        {cardsData.map((c) => (
          <Card
            key={c.id}
            img={c.img}
            title={c.title}
            text={c.text}
            href={c.href}
            onSelectType={c.id === 4 ? onSelectType : undefined}
          />
        ))}
      </div>
    </section>
  );
};

// Using `ProductCard` for drops so backend-driven product data can be displayed.

const Shop: React.FC = () => {
  const products = [
    { id: 'prod-1', title: 'Designer A' },
    { id: 'prod-2', title: 'Designer B' },
    { id: 'prod-3', title: 'Designer C' },
    { id: 'prod-4', title: 'Designer D' },
    { id: 'prod-5', title: 'Designer E' },
    { id: 'prod-6', title: 'Designer F' },
  ].map((p, i) => ({
    ...p,
    image: [CardImg1, CardImg2, CardImg3, CardImg4, CardImg5][i % 5],
    // demo: products added 1..6 days ago
    addedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
  }));

  const now = Date.now();
  const olderThreshold = now - 5 * 24 * 60 * 60 * 1000; // 5 days
  const recentDrops = products.filter((p) => p.addedAt.getTime() < now && p.addedAt.getTime() > olderThreshold);
  const olderDrops = products.filter((p) => p.addedAt.getTime() <= olderThreshold);

  return (
    <div className="shop-page">
      <Navbar />

      <header className="shop-hero">
        <div className="hero-inner">
          <h1 className="hero-title">Shop</h1>
          <p className="hero-sub">Curated drops, designer collections, and custom made pieces.</p>
        </div>
      </header>

      <CardsMenu />

      <main className="shop-main">
        <h2 className="section-title">ACTIVE DROPS</h2>
        <div className="drops-grid">
          {olderDrops.map((p) => (
            <ProductCard key={p.id} id={p.id} name={p.title} price={`2000:lkr cymbol:`} image={p.image} addedAt={p.addedAt} />
          ))}
        </div>

        <h2 className="section-title">THE DROP</h2>
        <div className="drops-grid">
          {products.map((p) => (
            <ProductCard key={p.id} id={p.id} name={p.title} price={`2000:lkr cymbol:`} image={p.image} addedAt={p.addedAt} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
