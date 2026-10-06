// ## NOTES
// CardSlider displays a horizontal carousel of landing cards.
// - 2 cards visible on desktop, 1 on mobile
// - auto-advances every 3 seconds
// - loops around using next/prev handlers
// - backend can populate `cards` array, currently static for demo

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Card1 from '../images/card 1.jpg';
import Card2 from '../images/card 2.jpg';
import Card3 from '../images/card 3.jpg';
import './card_slider.css';

const CardSlider = () => {
  const cards = [
    { title: 'Customize your designs', img: Card1 },
    { title: 'Shop for your looks', img: Card2},
    { title: 'Meet Your Designer', img: Card3 },
  ];

  const len = cards.length;
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState<number>(2);
  const [cardWidth, setCardWidth] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // compute the max index so we show two cards at once on desktop
  const maxIndex = Math.max(0, len - visibleCount);

  const next = useCallback(() => setIndex((i) => (i + 1) % (maxIndex + 1)), [maxIndex]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + (maxIndex + 1)) % (maxIndex + 1)), [maxIndex]);

  useEffect(() => {
    // set initial sizes and visible count
    const updateSizes = () => {
      const vc = window.innerWidth <= 768 ? 1 : 2;
      setVisibleCount(vc);

      const containerWidth = sliderRef.current?.clientWidth ?? 0;
      const cw = containerWidth / vc;
      setCardWidth(cw);

      // clamp index within new bounds
      setIndex((i) => Math.min(i, Math.max(0, len - vc)));
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, [len]);

  useEffect(() => {
    intervalRef.current = window.setInterval(next, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxIndex, next]);

  const handleNext = () => {
    next();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(next, 3000);
    }
  };

  const handlePrev = () => {
    prev();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(next, 3000);
    }
  };

  return (
    <div className="card-slider" ref={sliderRef}>
      <div
        className="track"
        style={{ transform: `translateX(-${index * cardWidth}px)` }}
      >
        {cards.map((c, i) => (
          <div className="card" key={i}>
            <div className="card-image">
              <img src={c.img} alt={c.title} />
              <div className="card-overlay" />
              <div className="card-body">
                <h3>{c.title}</h3>
                <button className="card-btn">GO</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="prev-btn" onClick={handlePrev} aria-label="Previous">
        <ChevronLeft />
      </button>
      <button className="next-btn" onClick={handleNext} aria-label="Next">
        <ChevronRight />
      </button>
    </div>
  );
};

export default CardSlider;
