import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../assets/components/navbar';
import Footer from '../assets/components/footer';
import { getCustomerOrders } from '../services/orderService';
import type { CustomerOrder } from '../types/order';
import './OrderHistory.css';

interface OrderHistoryProps {
	isSignedIn: boolean;
	onSignOut: () => void;
}

const formatPrice = (amount: number) => new Intl.NumberFormat('en-LK', {
	style: 'currency',
	currency: 'LKR',
	maximumFractionDigits: 2,
}).format(amount);

const formatOrderNumber = (orderNumber: number) => `ORD-${String(orderNumber).padStart(6, '0')}`;

export default function OrderHistory({ isSignedIn, onSignOut }: OrderHistoryProps) {
	const [orders, setOrders] = useState<CustomerOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		let active = true;
		getCustomerOrders()
			.then((customerOrders) => {
				if (active) setOrders(customerOrders);
			})
			.catch((error: unknown) => {
				if (active) setErrorMessage(error instanceof Error ? error.message : 'Your orders could not be loaded.');
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => { active = false; };
	}, []);

	return (
		<div className="order-history-page">
			<Navbar isSignedIn={isSignedIn} onSignOut={onSignOut} />
			<main className="order-history-main">
				<header className="order-history-heading">
					<p>YOUR ACCOUNT</p>
					<h1>Order history</h1>
					<span>Review your past purchases and their latest status.</span>
				</header>

				{loading && <p role="status">Loading your orders...</p>}
				{errorMessage && <p className="order-history-error" role="alert">{errorMessage}</p>}
				{!loading && !errorMessage && orders.length === 0 && (
					<div className="order-history-empty">
						<p>You have not placed an order yet.</p>
						<Link to="/shop">Browse the collection</Link>
					</div>
				)}
				{!loading && !errorMessage && orders.length > 0 && (
					<div className="order-history-list">
						{orders.map((order) => (
							<article className="order-history-card" key={order.id}>
								<header className="order-history-card-heading">
									<div>
										<h2>{formatOrderNumber(order.order_number)}</h2>
										<time dateTime={order.created_at}>
											{new Date(order.created_at).toLocaleDateString('en-LK', {
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											})}
										</time>
									</div>
									<span className={`order-status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
										{order.status}
									</span>
								</header>
								<ul className="order-history-items">
									{order.items.map((item, index) => (
										<li key={`${item.productId}-${item.size ?? 'no-size'}-${index}`}>
											<span>{item.title}{item.size ? ` · Size ${item.size}` : ''} × {item.quantity}</span>
											<span>{formatPrice(item.unitPrice * item.quantity)}</span>
										</li>
									))}
								</ul>
								<footer className="order-history-total">
									<span>Total paid</span>
									<strong>{formatPrice(order.amount)}</strong>
								</footer>
							</article>
						))}
					</div>
				)}
			</main>
			<Footer />
		</div>
	);
}
