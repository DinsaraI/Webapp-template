import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../assets/components/navbar';
import Footer from '../assets/components/footer';
import { addItem } from '../services/cartService';
import { logout } from '../services/authService';
import { getProduct } from '../services/productService';
import { supabase } from '../supabaseClient';
import type { Product } from '../types/product';
import './Product-detail-page.css';

interface ProductDetailProps {
	id?: string;
	isSignedIn?: boolean;
	onSignOut?: () => void;
}

const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
	style: 'currency',
	currency: 'LKR',
	maximumFractionDigits: 2,
}).format(Number(price));

const ProductDetailPage: React.FC<ProductDetailProps> = (props) => {
	const { id: routeId } = useParams<{ id: string }>();
	const id = props.id ?? routeId;
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [cartMessage, setCartMessage] = useState('');
	const [routeIsSignedIn, setRouteIsSignedIn] = useState(false);

	useEffect(() => {
		if (props.isSignedIn !== undefined) return;
		let active = true;
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setRouteIsSignedIn(Boolean(session?.user));
		});
		void supabase.auth.getSession().then(({ data: { session } }) => {
			if (active) setRouteIsSignedIn(Boolean(session?.user));
		});
		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, [props.isSignedIn]);

	useEffect(() => {
		let active = true;
		const loadProduct = async () => {
			setLoading(true);
			setErrorMessage('');
			if (!id) {
				setProduct(null);
				setLoading(false);
				return;
			}
			try {
				setProduct(await getProduct(id));
			} catch (error) {
				if (active) setErrorMessage(error instanceof Error ? error.message : 'Product could not be loaded.');
			} finally {
				if (active) setLoading(false);
			}
		};
		void Promise.resolve().then(loadProduct);
		return () => { active = false; };
	}, [id]);

	const handleAddToCart = () => {
		if (!product || product.stock < 1) return;
		addItem({
			id: product.id,
			name: product.title,
			price: formatPrice(product.price),
			image: product.image_url,
		});
		setCartMessage('Added to your cart.');
	};

	const handleRouteSignOut = async () => {
		const { error } = await logout();
		if (error) console.error('Unable to sign out:', error.message);
	};
	const signedIn = props.isSignedIn ?? routeIsSignedIn;
	const signOut = props.onSignOut ?? handleRouteSignOut;

	return (
		<div className="product-detail-page">
			<Navbar isSignedIn={signedIn} onSignOut={signOut} />

			<main className="pd-main">
				{loading && <p role="status">Loading product...</p>}
				{errorMessage && <p className="pd-state error" role="alert">{errorMessage}</p>}
				{!loading && !errorMessage && !product && <p className="pd-state">Product not found.</p>}
				{product && (
					<div className="pd-inner">
						<section className="pd-images">
							<div className="pd-main-image">
								<img src={product.image_url} alt={product.title} />
							</div>
						</section>

						<section className="pd-meta">
							<h1 className="pd-title">{product.title}</h1>
							<div className="pd-price">{formatPrice(product.price)}</div>
							<p className={`pd-stock ${product.stock > 0 ? 'available' : 'unavailable'}`}>
								{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
							</p>

							<div className="pd-actions">
								<button className="btn btn-primary" onClick={handleAddToCart} disabled={product.stock < 1}>
									{product.stock > 0 ? 'Add to cart' : 'Out of stock'}
								</button>
							</div>
							{cartMessage && <p className="pd-state available" role="status">{cartMessage}</p>}

							<div className="pd-description">
								<h2>Details</h2>
								<p>{product.description}</p>
							</div>
						</section>
					</div>
				)}
			</main>

			<Footer />
		</div>
	);
};

export default ProductDetailPage;
