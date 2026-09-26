import React from 'react';
import type { Order } from './types';

interface Props {
	orders: Order[];
	onOpenConfirm: (o: Order) => void;
	onDecline: (orderId: string) => void;
}

const Orders_Manager: React.FC<Props> = ({ orders, onOpenConfirm, onDecline }) => {
	return (
		<section>
			<h1>Master Orders Manager</h1>
			<table className="orders-table">
				<thead>
					<tr>
						<th>Order ID</th>
						<th>Customer</th>
						<th>Vendor</th>
						<th>Amount</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{orders.map((o) => (
						<tr key={o.id} className={o.status === 'Declined' ? 'declined' : ''}>
							<td>{o.id}</td>
							<td>{o.customer}</td>
							<td>{o.vendor}</td>
							<td>${o.amount}</td>
							<td>{o.status}{o.eta ? ` • ETA: ${o.eta}` : ''}</td>
							<td>
								{o.status === 'Paid' && <button onClick={() => onOpenConfirm(o)}>Confirm</button>}
								{o.status !== 'Declined' && <button onClick={() => onDecline(o.id)}>Decline/Refund</button>}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
};

export default Orders_Manager;
