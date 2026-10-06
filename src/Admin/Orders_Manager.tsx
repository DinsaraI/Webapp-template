import React, { useState } from 'react';
import type { Order, OrderStatus } from './types';

interface Props {
	orders: Order[];
	loading: boolean;
	error: string;
	notificationErrors: Record<string, string>;
	onOpenConfirm: (order: Order) => void;
	onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
	onUpdateTracking: (orderId: string, trackingNumber: string) => Promise<void>;
	onRetryNotifications: (orderId: string) => void;
}

const statuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const formatPrice = (amount: number) => new Intl.NumberFormat('en-LK', {
	style: 'currency',
	currency: 'LKR',
	maximumFractionDigits: 2,
}).format(amount);

const Orders_Manager: React.FC<Props> = ({
	orders,
	loading,
	error,
	notificationErrors,
	onOpenConfirm,
	onUpdateStatus,
	onUpdateTracking,
	onRetryNotifications,
}) => {
	const [search, setSearch] = useState('');
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
	const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
	const [savingTrackingId, setSavingTrackingId] = useState<string | null>(null);
	const [actionMessage, setActionMessage] = useState('');
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

	const changeStatus = async (orderId: string, status: OrderStatus) => {
		setSavingStatusId(orderId);
		setActionMessage('');
		try {
			await onUpdateStatus(orderId, status);
			setActionMessage(`Order status updated to ${status}.`);
		} catch (error) {
			setActionMessage(error instanceof Error ? error.message : 'Order status could not be updated.');
		} finally {
			setSavingStatusId(null);
		}
	};

	const saveTrackingNumber = async (order: Order) => {
		setSavingTrackingId(order.id);
		setActionMessage('');
		try {
			await onUpdateTracking(order.id, trackingInputs[order.id] ?? order.tracking_number ?? '');
			setActionMessage('Courier tracking number saved.');
		} catch (error) {
			setActionMessage(error instanceof Error ? error.message : 'Tracking number could not be saved.');
		} finally {
			setSavingTrackingId(null);
		}
	};

	const orderSubtotal = selectedOrder?.items.reduce(
		(total, item) => total + Number(item.unitPrice) * item.quantity,
		0,
	) ?? 0;
	const shippingFee = selectedOrder ? Math.max(0, Number(selectedOrder.amount) - orderSubtotal) : 0;

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
			{actionMessage && <p role="status">{actionMessage}</p>}
			{Object.entries(notificationErrors).length > 0 && (
				<div role="alert">
					<h2>Customer notifications need attention</h2>
					<ul>
						{Object.entries(notificationErrors).map(([orderId, notificationError]) => {
							const order = orders.find((item) => item.id === orderId);
							const label = order ? `ORD-${String(order.order_number).padStart(6, '0')}` : 'Order';
							return (
								<li key={orderId}>
									{label}: {notificationError}
									<button type="button" onClick={() => onRetryNotifications(orderId)}>Retry customer notifications</button>
								</li>
							);
						})}
					</ul>
				</div>
			)}
			{!loading && orders.length === 0 && !error && <p>No active orders</p>}
			{!loading && orders.length > 0 && filteredOrders.length === 0 && <p>No orders match your search.</p>}
			{!loading && filteredOrders.length > 0 && (
				<div className="admin-table-scroll">
					<table className="orders-table">
						<thead>
							<tr>
								<th>Order ID</th>
								<th>Customer & Contact</th>
								<th>Item(s)</th>
								<th>Status</th>
								<th>Courier Tracking</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredOrders.map((order) => (
								<tr
									key={order.id}
									className="order-row-clickable"
									tabIndex={0}
									onClick={() => setSelectedOrder(order)}
									onKeyDown={(event) => {
										if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
											event.preventDefault();
											setSelectedOrder(order);
										}
									}}
								>
									<td><button type="button" className="order-detail-link" onClick={(event) => { event.stopPropagation(); setSelectedOrder(order); }}>ORD-{String(order.order_number).padStart(6, '0')}</button></td>
									<td>
										<strong>{order.customer_name}</strong>
										<div>{order.customer_email}</div>
										<div>{order.customer_phone}</div>
									</td>
									<td>{order.items.map((item) => `${item.title} × ${item.quantity}`).join(', ')}</td>
									<td>
										<select
											aria-label={`Update status for order ${order.order_number}`}
											value={statuses.includes(order.status) ? order.status : ''}
											disabled={savingStatusId === order.id}
											onClick={(event) => event.stopPropagation()}
											onChange={(event) => {
												const status = statuses.find((candidate) => candidate === event.target.value);
												if (status) void changeStatus(order.id, status);
											}}
										>
											{!statuses.includes(order.status) && <option value="">{order.status}</option>}
											{statuses.map((status) => <option key={status} value={status}>{status}</option>)}
										</select>
										{savingStatusId === order.id && <span className="admin-inline-loading" role="status"> Saving...</span>}
									</td>
									<td>
										<div className="tracking-controls" onClick={(event) => event.stopPropagation()}>
											<input
												type="text"
												aria-label={`Tracking number for order ${order.order_number}`}
												placeholder="Tracking number"
												value={trackingInputs[order.id] ?? order.tracking_number ?? ''}
												onChange={(event) => setTrackingInputs((current) => ({ ...current, [order.id]: event.target.value }))}
											/>
											<button type="button" disabled={savingTrackingId === order.id} onClick={() => void saveTrackingNumber(order)}>
												{savingTrackingId === order.id ? 'Saving...' : 'Save'}
											</button>
										</div>
									</td>
									<td onClick={(event) => event.stopPropagation()}>
										{(order.status === 'Pending' || order.status === 'Paid') && <button type="button" onClick={() => onOpenConfirm(order)}>Confirm / Process</button>}
										{order.status !== 'Shipped' && order.status !== 'Delivered' && order.status !== 'Declined' && order.status !== 'Failed' && order.status !== 'Cancelled' && <button type="button" disabled={savingStatusId === order.id} onClick={() => void changeStatus(order.id, 'Cancelled')}>Cancel Order</button>}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{selectedOrder && (
				<div className="modal-backdrop order-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrder(null); }}>
					<section className="modal order-detail-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
						<header className="order-detail-heading">
							<div>
								<h2 id="order-detail-title">Order ORD-{String(selectedOrder.order_number).padStart(6, '0')}</h2>
								<p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
							</div>
							<button type="button" aria-label="Close order details" onClick={() => setSelectedOrder(null)}>×</button>
						</header>
						<section className="order-detail-customer">
							<h3>Customer & delivery</h3>
							<p><strong>{selectedOrder.shipping_address?.recipient_name || selectedOrder.customer_name}</strong></p>
							<p>{selectedOrder.customer_phone} · {selectedOrder.customer_email}</p>
							{selectedOrder.shipping_address && (
								<address>
									{selectedOrder.shipping_address.street_address}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.postal_code}, {selectedOrder.shipping_address.country}
								</address>
							)}
						</section>
						<section className="order-detail-items">
							<h3>Items</h3>
							{selectedOrder.items.map((item, index) => (
								<div className="order-detail-item" key={`${item.productId}-${item.size ?? ''}-${index}`}>
									{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="order-detail-image-placeholder" aria-hidden="true" />}
									<div><strong>{item.title}</strong><span>{item.quantity} × {formatPrice(Number(item.unitPrice))}{item.size ? ` · Size ${item.size}` : ''}</span></div>
									<strong>{formatPrice(Number(item.unitPrice) * item.quantity)}</strong>
								</div>
							))}
						</section>
						<dl className="order-detail-totals">
							<div><dt>Subtotal</dt><dd>{formatPrice(orderSubtotal)}</dd></div>
							<div><dt>Shipping fee</dt><dd>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</dd></div>
							<div className="order-detail-grand-total"><dt>Grand total</dt><dd>{formatPrice(Number(selectedOrder.amount))}</dd></div>
						</dl>
					</section>
				</div>
			)}
		</section>
	);
};

export default Orders_Manager;
