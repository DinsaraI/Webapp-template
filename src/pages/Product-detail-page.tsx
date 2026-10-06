import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
	const location = useLocation();
	const navigate = useNavigate();
	const id = props.id ?? routeId;
	const [product, setProduct] = useState<Product | null>(null);
	const [selectedImage, setSelectedImage] = useState('');
	const [selectedSize, setSelectedSize] = useState('');
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
				const loadedProduct = await getProduct(id);
				setProduct(loadedProduct);
				setSelectedImage(loadedProduct?.image_url ?? '');
				setSelectedSize('');
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
		if (!product || product.stock < 1 || !selectedSize) return;
		addItem({
			id: product.id,
			name: product.title,
			price: formatPrice(product.price),
			image: product.image_url,
			size: selectedSize,
		});
		setCartMessage(`${product.title} (${selectedSize}) added to your cart.`);
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
							<button
								type="button"
								className="pd-back"
								onClick={() => location.key !== 'default' ? navigate(-1) : navigate('/shop')}
							>
								← Back to Shop
							</button>
							<div className="pd-main-image">
								<img src={selectedImage || product.image_url} alt={product.title} />
							</div>
							<div className="pd-thumbs" aria-label="Product images">
								{[...new Set([product.image_url, ...(product.images ?? [])])].map((image, index) => (
									<button
										type="button"
										className={`pd-thumb${selectedImage === image ? ' selected' : ''}`}
										key={`${image}-${index}`}
										onClick={() => setSelectedImage(image)}
										aria-label={`Show product image ${index + 1}`}
										aria-pressed={selectedImage === image}
									>
										<img src={image} alt="" />
									</button>
								))}
							</div>
						</section>

						<section className="pd-meta">
							<h1 className="pd-title">{product.title}</h1>
							<div className="pd-price">{formatPrice(product.price)}</div>
							<p className={`pd-stock ${product.stock > 0 ? 'available' : 'unavailable'}`}>
								{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
							</p>

							<fieldset className="pd-size-selector" disabled={product.stock < 1}>
								<legend>Select size</legend>
								<div className="pd-size-options">
									{(product.available_sizes ?? []).map((size) => (
										<button
											type="button"
											key={size}
											className={selectedSize === size ? 'selected' : ''}
											onClick={() => { setSelectedSize(size); setCartMessage(''); }}
											aria-pressed={selectedSize === size}
										>
											{size}
										</button>
									))}
								</div>
								{product.available_sizes?.length === 0 && <p>No sizes are currently available.</p>}
							</fieldset>
							<div className="pd-actions">
								<button className="btn btn-primary" onClick={handleAddToCart} disabled={product.stock < 1 || !selectedSize}>
									{product.stock < 1 ? 'Out of stock' : 'Add to cart'}
								</button>
							</div>
							{product.stock > 0 && !selectedSize && <p className="pd-state">Select a size to continue.</p>}
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
