import React, { useState } from 'react';
import type { Order, OrderStatus } from './types';

interface Props {
	orders: Order[];
	loading: boolean;
	error: string;
	onOpenConfirm: (o: Order) => void;
	onDecline: (orderId: string) => void;
	onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const Orders_Manager: React.FC<Props> = ({ orders, loading, error, onOpenConfirm, onDecline, onUpdateStatus }) => {
	const [search, setSearch] = useState('');
	const normalizedSearch = search.trim().toLocaleLowerCase();
	const filteredOrders = orders.filter((order) => {
		if (!normalizedSearch) return true;
		const orderNumber = String(order.order_number);
		const formattedOrderNumber = `ord-${orderNumber.padStart(6, '0')}`;
		const searchableValues = [
			orderNumber,
			formattedOrderNumber,
			order.customer_name,
			order.customer_email,
			order.customer_phone,
			order.status,
			...order.items.map((item) => item.title),
		];
		return searchableValues.some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
	});

	return (
		<section>
			<h1>Order Manager</h1>
			<label className="orders-search">
				<span>Search orders</span>
				<input
					type="search"
					placeholder="Order number, customer, email, phone, status, or item"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</label>
			{loading && <p role="status">Loading orders...</p>}
			{error && <p role="alert">{error}</p>}
			{!loading && !error && orders.length === 0 && <p>No active orders</p>}
			{!loading && !error && orders.length > 0 && filteredOrders.length === 0 && <p>No orders match your search.</p>}
			{!loading && !error && filteredOrders.length > 0 && (
				<div className="admin-table-scroll">
				<table className="orders-table">
					<thead>
						<tr>
							<th>Order ID</th>
							<th>Customer & Contact</th>
							<th>Item(s)</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{filteredOrders.map((order) => (
							<tr key={order.id}>
								<td>ORD-{String(order.order_number).padStart(6, '0')}</td>
								<td>
									<strong>{order.customer_name}</strong>
									<div>{order.customer_email}</div>
									<div>{order.customer_phone}</div>
									{order.shipping_address?.street_address && (
										<div>{order.shipping_address.street_address}, {order.shipping_address.city}, {order.shipping_address.postal_code}, {order.shipping_address.country}</div>
									)}
								</td>
								<td>{order.items.map((item) => `${item.title} × ${item.quantity}`).join(', ')}</td>
								<td>{order.status}{order.eta ? ` · ETA: ${order.eta}` : ''}</td>
								<td>
									{(order.status === 'Pending' || order.status === 'Paid') && <button onClick={() => onOpenConfirm(order)}>Confirm / Process</button>}
									{(order.status === 'Processing' || order.status === 'Confirmed') && <button onClick={() => onUpdateStatus(order.id, 'Shipping')}>Mark Shipping</button>}
									{order.status === 'Shipping' && <button onClick={() => onUpdateStatus(order.id, 'Shipped')}>Mark Shipped</button>}
									{order.status !== 'Shipped' && order.status !== 'Declined' && order.status !== 'Failed' && <button onClick={() => onDecline(order.id)}>Mark Failed</button>}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				</div>
			)}
		</section>
	);
};

export default Orders_Manager;
