import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Footer from '../assets/components/footer';
import Navbar from '../assets/components/navbar';
import ProductCard from '../generative-components/product-card';
import { rankProducts, searchProducts } from '../services/product-search';
import { getProducts } from '../services/productService';
import type { Product } from '../types/product';
import './SearchResults.css';

interface SearchResultsProps {
  isSignedIn?: boolean;
  onSignOut?: () => void;
}

const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
}).format(Number(price));

export default function SearchResults({ isSignedIn = false, onSignOut }: SearchResultsProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
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

  const matches = searchProducts(products, query);
  const matchedIds = new Set(matches.map((product) => product.id));
  const rankedRelatedProducts = query
    ? rankProducts(products, query, true)
      .map(({ product }) => product)
      .filter((product) => !matchedIds.has(product.id))
    : [];
  const relatedProducts = query && matches.length < 4
    ? [
      ...rankedRelatedProducts,
      ...products.filter((product) => !matchedIds.has(product.id)
        && !rankedRelatedProducts.some((relatedProduct) => relatedProduct.id === product.id)),
    ].slice(0, 4)
    : rankedRelatedProducts.slice(0, 4);

  const renderProductGrid = (items: Product[]) => (
    <div className="search-results-grid">
      {items.map((product) => (
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
  );

  return (
    <div className="search-results-page">
      <Navbar isSignedIn={isSignedIn} onSignOut={onSignOut} />
      <main className="search-results-main">
        <header className="search-results-heading">
          <p className="search-results-kicker">A2W COLLECTION</p>
          <h1>{query ? `Results for "${query}"` : 'All Products'}</h1>
          {!loading && !errorMessage && (
            <p className="search-results-count">{matches.length} {matches.length === 1 ? 'product' : 'products'}</p>
          )}
        </header>

        {loading && <p className="search-results-state" role="status">Searching products...</p>}
        {errorMessage && <p className="search-results-state error" role="alert">{errorMessage}</p>}

        {!loading && !errorMessage && matches.length > 0 && renderProductGrid(matches)}

        {!loading && !errorMessage && query && matches.length === 0 && (
          <section className="search-no-results">
            <h2>No exact products found</h2>
            <p>We could not find a match for “{query}”. Browse the full collection to discover something else.</p>
            <Link className="search-browse-link" to="/shop">Browse All Products</Link>
          </section>
        )}

        {!loading && !errorMessage && !query && matches.length === 0 && (
          <p className="search-results-state">No products are available yet.</p>
        )}

        {!loading && !errorMessage && relatedProducts.length > 0 && (
          <section className="search-related-section">
            <h2>{rankedRelatedProducts.length > 0 ? 'You May Also Like' : 'Explore More Products'}</h2>
            {renderProductGrid(relatedProducts)}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}