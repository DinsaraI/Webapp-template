import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import { searchProducts } from '../../services/product-search';
import type { Product } from '../../types/product';
import './product-search.css';

const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
}).format(Number(price));

export default function ProductSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const suggestions = query.trim() ? searchProducts(products, query).slice(0, 5) : [];

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    setIsOpen(false);
    navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : '/search');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') setIsOpen(false);
  };

  return (
    <div className="product-search-control" ref={searchRef}>
      <form className="product-search-form" role="search" onSubmit={submitSearch}>
        <input
          className="search-input product-search-input"
          type="search"
          value={query}
          placeholder="Search products..."
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={isOpen && query.trim().length > 0}
          aria-controls="product-search-suggestions"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button className="product-search-submit" type="submit" aria-label="Search">
          <Search size={18} strokeWidth={1.8} />
        </button>
      </form>

      {isOpen && query.trim() && (
        <div className="product-search-suggestions" id="product-search-suggestions" role="listbox" aria-label="Search suggestions">
          {suggestions.length > 0 ? suggestions.map((product) => (
            <Link
              className="product-search-suggestion"
              key={product.id}
              to={`/product/${product.id}`}
              role="option"
              aria-selected="false"
              onClick={() => setIsOpen(false)}
            >
              <img src={product.image_url} alt="" loading="lazy" />
              <span className="product-search-suggestion-copy">
                <span className="product-search-suggestion-title">{product.title}</span>
                <span className="product-search-suggestion-price">{formatPrice(product.price)}</span>
              </span>
            </Link>
          )) : (
            <p className="product-search-empty">No matching products yet</p>
          )}
        </div>
      )}
    </div>
  );
}