import { useState } from 'react';
import { Plus, Grid, List } from 'lucide-react';
import SideNavbar from './components/side_navbar';
import './Products.css';

interface Product {
  id: string;
  name: string;
  price: number;
  status: 'draft' | 'unreleased' | 'latest' | 'past';
  category: string;
  stock: number;
  createdDate: string;
  image?: string;
}

const Products = () => {
  // Placeholder data - will be replaced with backend calls
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'past' | 'latest' | 'unreleased' | 'drafts'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = products.filter((product) => {
    if (filter === 'all') return true;
    if (filter === 'drafts') return product.status === 'draft';
    return product.status === filter;
  });

  const handleCreateProduct = () => {
    // Navigate to product creation page
    window.location.hash = '#create-product';
  };

  return (
    <div className="vendor-page-container">
      <SideNavbar activeItem="products" />
      <div className="products-page">
        {/* Header */}
        <section className="products-header">
          <div className="header-content">
            <h1>Products</h1>
            <p>Manage and track all your products</p>
          </div>
          <button className="create-product-btn" onClick={handleCreateProduct}>
            <Plus size={20} />
            Create Product
          </button>
        </section>

        {/* Filters and View Mode */}
        <section className="products-controls">
          <div className="filter-section">
            <h3>Filter by Status</h3>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'latest' ? 'active' : ''}`}
                onClick={() => setFilter('latest')}
              >
                Latest
              </button>
              <button
                className={`filter-btn ${filter === 'unreleased' ? 'active' : ''}`}
                onClick={() => setFilter('unreleased')}
              >
                Unreleased
              </button>
              <button
                className={`filter-btn ${filter === 'drafts' ? 'active' : ''}`}
                onClick={() => setFilter('drafts')}
              >
                Drafts
              </button>
              <button
                className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
                onClick={() => setFilter('past')}
              >
                Past
              </button>
            </div>
          </div>

          <div className="view-mode">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={18} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </section>

        {/* Products Container */}
        <section className="products-container">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-content">
                <div className="empty-icon">
                  <Plus size={48} />
                </div>
                <h2>No Products Yet</h2>
                <p>
                  {filter === 'all'
                    ? "You haven't created any products yet. Start by creating your first product."
                    : `No ${filter} products found.`}
                </p>
                <button className="create-product-btn-primary" onClick={handleCreateProduct}>
                  Create Your Product
                </button>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="product-card">
                      <div className="product-image">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className="placeholder-image">No Image</div>
                        )}
                        <span className={`status-badge ${product.status}`}>{product.status}</span>
                      </div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="category">{product.category}</p>
                        <div className="product-meta">
                          <span className="price">${product.price.toFixed(2)}</span>
                          <span className="stock">Stock: {product.stock}</span>
                        </div>
                        <p className="created-date">{new Date(product.createdDate).toLocaleDateString()}</p>
                        <div className="product-actions">
                          <button className="action-btn edit">Edit</button>
                          <button className="action-btn delete">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="products-list">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>${product.price.toFixed(2)}</td>
                          <td>{product.stock}</td>
                          <td>
                            <span className={`status-badge ${product.status}`}>{product.status}</span>
                          </td>
                          <td>{new Date(product.createdDate).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="action-btn edit">Edit</button>
                              <button className="action-btn delete">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Products;
