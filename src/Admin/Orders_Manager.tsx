import React from 'react';
import type { Order } from './types';

interface Props {
	orders: Order[];
	loading: boolean;
	error: string;
	onOpenConfirm: (o: Order) => void;
	onDecline: (orderId: string) => void;
}

const Orders_Manager: React.FC<Props> = ({ orders, loading, error, onOpenConfirm, onDecline }) => {
	return (
		<section>
			<h1>Order Manager</h1>
			{loading && <p role="status">Loading orders...</p>}
			{error && <p role="alert">{error}</p>}
			{!loading && !error && orders.length === 0 && <p>No active orders</p>}
			{!loading && !error && orders.length > 0 && (
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
						{orders.map((order) => (
							<tr key={order.id}>
								<td>ORD-{String(order.order_number).padStart(6, '0')}</td>
								<td>
									<strong>{order.customer_name}</strong>
									<div>{order.customer_email}</div>
									<div>{order.customer_phone}</div>
								</td>
								<td>{order.items.map((item) => `${item.title} × ${item.quantity}`).join(', ')}</td>
								<td>{order.status}{order.eta ? ` · ETA: ${order.eta}` : ''}</td>
								<td>
									{(order.status === 'Pending' || order.status === 'Paid') && <button onClick={() => onOpenConfirm(order)}>Confirm</button>}
									<button onClick={() => onDecline(order.id)}>Decline/Refund</button>
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
