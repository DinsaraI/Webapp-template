import React from 'react';
import type { Transaction } from './types';

interface Props {
	transactions: Transaction[];
	markTransferred: (id: string) => void;
}

const Finances: React.FC<Props> = ({ transactions, markTransferred }) => {
	return (
		<section>
			<h1>Financial Ledger & Payout Settlement</h1>
			<table className="ledger">
				<thead>
					<tr>
						<th>Txn ID</th>
						<th>Order</th>
						<th>Gross</th>
						<th>Commission</th>
						<th>Net to Vendor</th>
						<th>Transferred</th>
					</tr>
				</thead>
				<tbody>
					{transactions.map((t) => (
						<tr key={t.id}>
							<td>{t.id}</td>
							<td>{t.orderId}</td>
							<td>${t.gross}</td>
							<td>${((t.gross * t.commissionPct) / 100).toFixed(2)} ({t.commissionPct}%)</td>
							<td>${(t.gross - (t.gross * t.commissionPct) / 100).toFixed(2)}</td>
							<td><input type="checkbox" checked={!!t.transferred} onChange={() => markTransferred(t.id)} /></td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
};

export default Finances;
