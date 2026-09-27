import React from 'react';
import { useNavigate } from 'react-router-dom';
import './product-card.css';

type ProductCardProps = {
	name?: string;
	price?: string;
	image?: string; // url
	addedAt?: string | number | Date; // date when the product went live
	onClick?: () => void;
	id?: string;
};
import { addItem } from '../services/cartService';

const daysSince = (d?: string | number | Date) => {
	if (!d) return 0;
	const dt = new Date(d);
	if (isNaN(dt.getTime())) return 0;
	const diff = Date.now() - dt.getTime();
	return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const ProductCard: React.FC<ProductCardProps> = ({
	name = 'custom T-shirt',
	price = '2000:lkr cymbol:',
	image,
	addedAt,
	onClick,
	id,
}) => {
	const navigate = useNavigate();
	const days = daysSince(addedAt);
	const handleClick = () => {
		if (onClick) return onClick();
		if (id) navigate(`/product/${id}`);
	};

	return (
		<div
			className="product-card"
			role={onClick || id ? 'button' : undefined}
			tabIndex={onClick || id ? 0 : -1}
			onClick={handleClick}
			onKeyDown={(e) => e.key === 'Enter' && handleClick()}
		>
			<div
				className="pc-media"
				style={image ? { backgroundImage: `url(${image})` } : undefined}
				aria-hidden={!!image}
			>
				{!image && <div className="pc-placeholder">CT</div>}
			</div>

			<div className="pc-body">
				<div className="pc-title">{name}</div>

				<div className="pc-meta">
					<div className="pc-price">{price}</div>
					<div className="pc-days">{days} day{days !== 1 ? 's' : ''}</div>
				</div>
				<div className="pc-actions">
					<button
						className="pc-add"
						onClick={(e) => {
							e.stopPropagation();
							if (!id) return;
							addItem({ id, name, price, image });
						}}
					>
						Add to cart
					</button>
				</div>
			</div>
		</div>
	);
};

export default ProductCard;
