import './itemslider.css';
import ProductCard from '../generative-components/product-card';

interface Item {
  id?: string;
  title: string;
  img: string;
}

interface ItemSliderProps {
  items: Item[];
}

const ItemSlider: React.FC<ItemSliderProps> = ({ items }) => {
  const featuredItems = items.slice(0, 6);

  return (
    <div className="item-slider">
      <div className="item-slider-grid">
        {featuredItems.map((item) => (
          <div className="item-card" key={item.id ?? item.title}>
            <ProductCard id={item.id} name={item.title} image={item.img} price="2000:lkr" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemSlider;
