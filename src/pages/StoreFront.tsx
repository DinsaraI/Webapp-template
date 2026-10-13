import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../assets/components/navbar';
import Footer from '../assets/components/footer';
import { getProducts } from '../services/productService';
import { normalizeProductCategory, PRODUCT_CATEGORIES, type Product } from '../types/product';
import './StoreFront.css';

interface StoreFrontProps {
  isSignedIn?: boolean;
  onSignOut?: () => void;
}

const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
}).format(price);

export default function StoreFront({ isSignedIn = false, onSignOut }: StoreFrontProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
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

  const selectedCategory = normalizeProductCategory(searchParams.get('category'));
  const tag = searchParams.get('tag')?.trim().toLocaleLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || normalizeProductCategory(product.category) === selectedCategory;
    const tags = Array.isArray(product.tags) ? product.tags : [product.tags ?? ''];
    const matchesTag = !tag || tags.some((productTag) => productTag.toLocaleLowerCase() === tag);
    return matchesCategory && matchesTag;
  });

  return (
    <div className="storefront-page">
      <Navbar isSignedIn={isSignedIn} onSignOut={onSignOut} />
      <main className="storefront-main">
        <header className="storefront-heading">
          <p className="storefront-kicker">A2W COLLECTION</p>
          <h1>Shop the collection</h1>
          <label className="storefront-category-filter">
            <span>Filter by category</span>
            <select
              value={selectedCategory ?? ''}
              onChange={(event) => {
                const nextParams = new URLSearchParams(searchParams);
                if (event.target.value) nextParams.set('category', event.target.value);
                else nextParams.delete('category');
                setSearchParams(nextParams);
              }}
            >
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </label>
        </header>
        {loading && <p className="storefront-state" role="status">Loading products...</p>}
        {errorMessage && <p className="storefront-state error" role="alert">{errorMessage}</p>}
        {!loading && !errorMessage && visibleProducts.length === 0 && <p className="storefront-state">{products.length === 0 ? 'No products are available yet.' : 'No products match this selection.'}</p>}
        {!loading && !errorMessage && visibleProducts.length > 0 && (
          <div className="storefront-grid">
            {visibleProducts.map((product) => (
              <article className="storefront-product" key={product.id}>
                <Link className="storefront-image-link" to={`/product/${product.id}`} aria-label={`View ${product.title}`}>
                  <img src={product.image_url} alt={product.title} loading="lazy" />
                </Link>
                <div className="storefront-product-info">
                  <div>
                    <h2>{product.title}</h2>
                    <p>{formatPrice(Number(product.price))}</p>
                  </div>
                  <Link className="storefront-detail-link" to={`/product/${product.id}`}>View details</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
