import { useEffect, useState } from 'react';
import './sale_items.css';

interface SaleItem {
  id: string;
  name: string;
  image: string;
}

const Sale_items = () => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchSaleItems = async () => {
      try {
        const response = await fetch('/api/vendor/sale-items');
        const data = await response.json();

        const fetchedItems: SaleItem[] = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.saleItems)
          ? data.saleItems
          : [];

        setItems(fetchedItems);
      } catch (error) {
        console.error('Error loading sale items:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSaleItems();
  }, []);

  if (isLoading) {
    return <div className="sale-items">Loading seller items...</div>;
  }

  return (
    <div className="sale-items">
      {items.length > 0 ? (
        <div className="sale-items-grid">
          {items.map((item) => (
            <div className="sale-item-card" key={item.id}>
              <img src={item.image} alt={item.name} className="sale-item-image" />
              <div className="sale-item-name">{item.name}</div>
            </div>
          ))}
        </div>
      ) : (
        <button className="start-selling-btn" type="button">
          Start selling now
        </button>
      )}
      {hasError && <div className="sale-items-error">Unable to load items.</div>}
    </div>
  );
};

export default Sale_items;
