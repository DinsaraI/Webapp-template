import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../../generative-components/product-card';
import { getProducts } from '../../services/productService';
import type { Product } from '../../types/product';
import './featured-products.css';

type ProductFilter = 'All' | 'New' | 'Trending' | 'Sale';

const FILTERS: ProductFilter[] = ['All', 'New', 'Trending', 'Sale'];
const NEW_ARRIVAL_DAYS = 30;

function getProductTags(product: Product): string[] {
  const tags = Array.isArray(product.tags) ? product.tags : (product.tags ?? '').split(/[|,]/);
  return [...tags, product.category ?? ''].map((tag) => tag.trim().toLowerCase()).filter(Boolean);
}

function isNewArrival(product: Product): boolean {
  if (getProductTags(product).includes('new')) return true;
  const createdAt = new Date(product.created_at).getTime();
  return Number.isFinite(createdAt)
    && createdAt <= Date.now()
    && Date.now() - createdAt <= NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

function matchesFilter(product: Product, filter: ProductFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'New') return isNewArrival(product);
  return getProductTags(product).includes(filter.toLowerCase());
}

const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
}).format(Number(price));

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<ProductFilter>('All');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    getProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'Products could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(
    () => products.filter((product) => matchesFilter(product, filter)),
    [filter, products],
  );

  return (
    <section className="featured-products" aria-labelledby="featured-products-title">
      <header className="featured-products-heading">
        <div>
          <p className="featured-products-kicker">JUST LANDED</p>
          <h2 id="featured-products-title">New Arrivals</h2>
        </div>
        <div className="featured-product-filters" role="group" aria-label="Filter featured products">
          {FILTERS.map((option) => (
            <button
              type="button"
              key={option}
              className={filter === option ? 'active' : ''}
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </header>
      {loading && <p className="featured-products-state" role="status">Loading products...</p>}
      {errorMessage && <p className="featured-products-state error" role="alert">{errorMessage}</p>}
      {!loading && !errorMessage && visibleProducts.length === 0 && (
        <p className="featured-products-state">No products match this filter yet.</p>
      )}
      {!loading && !errorMessage && visibleProducts.length > 0 && (
        <div className="featured-products-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.title}
              image={product.image_url}
              price={formatPrice(product.price)}
              addedAt={product.created_at}
            />
          ))}
        </div>
      )}
    </section>
  );
}
