import React from 'react';
import type { Order } from './types';

interface Props {
	orders: Order[];
	transferredOrderIds: Set<string>;
	markTransferred: (id: string) => void;
}

	const saleStatuses = new Set(['Paid', 'Confirmed', 'Processing', 'Shipping', 'Shipped', 'Delivered']);

const Finances: React.FC<Props> = ({ orders, transferredOrderIds, markTransferred }) => {
	const sales = orders.filter((order) => saleStatuses.has(order.status));

	return (
		<section>
			<h1>Financial Ledger & Payout Settlement</h1>
			<div className="admin-table-scroll">
			<table className="ledger">
				<thead>
					<tr>
						<th>Txn ID</th>
						<th>Order</th>
						<th>Gross</th>
						<th>Commission</th>
						<th>Net Payout</th>
						<th>Transferred</th>
					</tr>
				</thead>
				<tbody>
					{sales.map((order) => {
						const commission = order.amount * 0.12;
						return (
						<tr key={order.id}>
							<td>TXN-{order.order_number}</td>
							<td>ORD-{String(order.order_number).padStart(6, '0')}</td>
							<td>${Number(order.amount).toFixed(2)}</td>
							<td>${commission.toFixed(2)} (12%)</td>
							<td>${(order.amount - commission).toFixed(2)}</td>
							<td><input type="checkbox" checked={transferredOrderIds.has(order.id)} onChange={() => markTransferred(order.id)} aria-label={`Mark order ${order.order_number} transferred`} /></td>
						</tr>
						);
					})}
					{sales.length === 0 && <tr><td colSpan={6}>No paid sales yet.</td></tr>}
				</tbody>
			</table>
			</div>
		</section>
	);
};

export default Finances;
