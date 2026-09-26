import { useCallback, useEffect, useState } from 'react';
import { deleteProduct, getProducts } from '../services/productService';
import type { Product } from '../types/product';
import AdminAddProduct from './AdminAddProduct';
import './Global_inventory.css';

const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
	style: 'currency',
	currency: 'LKR',
	maximumFractionDigits: 2,
}).format(Number(price));

const Global_inventory = () => {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState('');

	const loadProducts = useCallback(async () => {
		setLoading(true);
		setErrorMessage('');
		try {
			setProducts(await getProducts());
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Products could not be loaded.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { void loadProducts(); }, [loadProducts]);

	const handleDelete = async (product: Product) => {
		if (!window.confirm(`Delete "${product.title}" and its image?`)) return;
		setDeletingId(product.id);
		setErrorMessage('');
		try {
			await deleteProduct(product);
			setProducts((current) => current.filter((item) => item.id !== product.id));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Product could not be deleted.');
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<section className="admin-inventory">
			<header className="admin-inventory-heading">
				<div>
					<h1>Product inventory</h1>
					<p>Manage products available in the customer storefront.</p>
				</div>
				<span>{products.length} products</span>
			</header>

			<AdminAddProduct onProductAdded={() => { void loadProducts(); }} />

			<section className="admin-product-list" aria-labelledby="admin-products-title">
				<h2 id="admin-products-title">Products</h2>
				{loading && <p role="status">Loading products...</p>}
				{errorMessage && <p className="admin-product-message error" role="alert">{errorMessage}</p>}
				{!loading && !errorMessage && products.length === 0 && <p>No products have been added.</p>}
				{products.map((product) => (
					<article className="admin-product-row" key={product.id}>
						<img src={product.image_url} alt="" />
						<div className="admin-product-row-info">
							<h3>{product.title}</h3>
							<p>{formatPrice(product.price)} · {product.stock} in stock</p>
						</div>
						<button type="button" onClick={() => void handleDelete(product)} disabled={deletingId === product.id}>
							{deletingId === product.id ? 'Deleting...' : 'Delete'}
						</button>
					</article>
				))}
			</section>
		</section>
	);
};

export default Global_inventory;
