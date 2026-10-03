// ## NOTES
// ItemSlider shows a products carousel with refresh and navigation.
// - receives items from App as props (backend friendly)
// - loops sliding by 2 items at a time
// - includes placeholder click handler for item actions
//
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './itemslider.css';
import ProductCard from '../../generative-components/product-card';
import type { Product } from '../../types/product';

interface ItemSliderProps {
  items: Product[];
}

const ItemSlider: React.FC<ItemSliderProps> = ({ items }) => {
  const len = items.length;
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState<number>(4);
  const [cardWidth, setCardWidth] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // compute the max index
  const maxIndex = Math.max(0, len - visibleCount);

  const next = () => setIndex((current) => current >= maxIndex ? 0 : Math.min(current + 2, maxIndex));
  const prev = () => setIndex((current) => current <= 0 ? maxIndex : Math.max(current - 2, 0));

  useEffect(() => {
    // set initial sizes and visible count
    const updateSizes = () => {
      const vc = window.innerWidth <= 768 ? 2 : 4;
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
    if (maxIndex === 0) return;
    intervalRef.current = window.setInterval(next, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxIndex]);

  const handleNext = () => {
    next();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(next, 4000);
    }
  };

  const handlePrev = () => {
    prev();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(next, 4000);
    }
  };

  return (
    <div className="item-slider" ref={sliderRef}>
      <div
        className="track"
        style={{ transform: `translateX(-${index * cardWidth}px)` }}
      >
        {items.map((item) => (
          <div className="item-card" key={item.id} style={{ width: cardWidth }}>
            <ProductCard
              id={item.id}
              name={item.title}
              image={item.image_url}
              price={new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(item.price))}
              addedAt={item.created_at}
            />
          </div>
        ))}
      </div>

      {maxIndex > 0 && (
        <>
          <button className="prev-btn" onClick={handlePrev} aria-label="Previous products">
            <ChevronLeft />
          </button>
          <button className="next-btn" onClick={handleNext} aria-label="Next products">
            <ChevronRight />
          </button>
        </>
      )}
    </div>
  );
};

export default ItemSlider;
