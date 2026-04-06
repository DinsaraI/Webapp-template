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

interface Item {
  id?: string;
  title: string;
  img: string;
}

interface ItemSliderProps {
  items: Item[];
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

  const next = () => setIndex((i) => (i + 2) % (maxIndex + 2));
  const prev = () => setIndex((i) => (i - 2 + (maxIndex + 2)) % (maxIndex + 2));

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
        {items.map((item, i) => (
          <div className="item-card" key={i} style={{ width: cardWidth }}>
            <ProductCard id={item.id} name={item.title} image={item.img} price={`2000:lkr`} />
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

export default ItemSlider;
