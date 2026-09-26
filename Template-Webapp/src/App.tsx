import './App.css'
import ProductCard from './generative-components/product-card'

const featuredProducts = [
  {
    id: 'classic-tee',
    name: 'Classic Tee',
    price: 'LKR 2,500',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    addedAt: '2026-09-01',
  },
  {
    id: 'denim-jacket',
    name: 'Denim Jacket',
    price: 'LKR 5,990',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    addedAt: '2026-09-04',
  },
  {
    id: 'travel-bag',
    name: 'Travel Bag',
    price: 'LKR 7,450',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    addedAt: '2026-09-07',
  },
  {
    id: 'linen-shirt',
    name: 'Linen Shirt',
    price: 'LKR 4,200',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    addedAt: '2026-09-10',
  },
  {
    id: 'canvas-sneakers',
    name: 'Canvas Sneakers',
    price: 'LKR 6,800',
    image: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80',
    addedAt: '2026-09-12',
  },
  {
    id: 'crossbody',
    name: 'Crossbody',
    price: 'LKR 3,950',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
    addedAt: '2026-09-15',
  },
]

function App() {
  return (
    <main className="homepage-shell">
      <section className="featured-products">
        <div className="featured-heading">
          <p className="featured-kicker">New arrivals</p>
          <h1>Featured picks</h1>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <div className="product-grid-item" key={product.id}>
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                addedAt={product.addedAt}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
