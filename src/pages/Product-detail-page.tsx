import React, { useEffect, useState } from 'react';
import Navbar from '../assets/components/navbar';
import Footer from '../assets/components/footer';
import './Product-detail-page.css';
import ProductCard from '../generative-components/product-card';

type ProductDetailProps = {
	id?: string;
	name?: string;
	price?: string;
	images?: string[];
	description?: string;
	addedAt?: string | number | Date;
};

// This page expects backend-driven props. For now we provide mock defaults.
const mockProducts: Record<string, Partial<ProductDetailProps>> = {
	'prod-1': {
		name: 'Custom T-shirt',
		price: '2000:lkr cymbol:',
		images: [],
		description: 'A comfortable, custom-made T-shirt. Premium cotton.',
		addedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
	},
	'prod-2': {
		name: 'Handmade Hoodie',
		price: '4500:lkr cymbol:',
		images: [],
		description: 'Warm, stylish hoodie with custom embroidery.',
		addedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
	},
};

const ProductDetailPage: React.FC<ProductDetailProps> = (props) => {
	const { id } = props;
	const [product, setProduct] = useState<ProductDetailProps>({
		...props,
	});

	useEffect(() => {
		// If an `id` is provided and no other data was passed, attempt a small mock lookup.
		if (id && (!props.name || props.name === 'Custom T-shirt') && !props.images?.length) {
			const p = mockProducts[id];
			if (p) setProduct((s) => ({ ...s, ...p }));
		}
	}, [id]);

	const mainImage = product.images?.[0];

	return (
		<div className="product-detail-page">
			<Navbar />

			<main className="pd-main">
				<div className="pd-inner">
					<section className="pd-images">
						<div className="pd-main-image" style={mainImage ? { backgroundImage: `url(${mainImage})` } : undefined}>
							{!mainImage && <div className="pd-placeholder">No image</div>}
						</div>
						<div className="pd-thumbs">
							{product.images && product.images.length > 0 ? (
								product.images.map((src, i) => (
									<div key={i} className="pd-thumb" style={{ backgroundImage: `url(${src})` }} />
								))
							) : (
								<div className="pd-thumb empty">—</div>
							)}
						</div>
					</section>

					<section className="pd-meta">
						<h1 className="pd-title">{product.name}</h1>
						<div className="pd-price">{product.price}</div>

						<div className="pd-actions">
							<button className="btn btn-primary">Add to cart</button>
							<button className="btn btn-ghost">Buy now</button>
						</div>

						<div className="pd-description">
							<h3>Details</h3>
							<p>{product.description}</p>
						</div>

						<div className="pd-related">
							<h4>Related</h4>
							<div className="pd-related-grid">
								<ProductCard name={product.name} price={product.price} addedAt={product.addedAt} image={product.images?.[0]} />
								<ProductCard name={(product.name || '') + ' — Variant'} price={product.price} addedAt={new Date(Date.now() - 2 * 24 * 3600 * 1000)} />
							</div>
						</div>
					</section>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default ProductDetailPage;
