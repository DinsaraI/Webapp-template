import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin_page.css';
import Admin_sidenavbar from './Admin_sidenavbar';
import Orders_Manager from './Orders_Manager';
import Global_inventory from './Global_inventory';
import Finances from './Finances';
import type { Order, OrderStatus } from './types';
import { logout } from '../services/authService';
import { getProducts } from '../services/productService';
import { getOrders, updateOrderStatus } from '../services/orderService';
import { supabase } from '../supabaseClient';
import type { Product } from '../types/product';

interface AdminNotification {
	id: number;
	message: string;
	createdAt: Date;
}

const Admin_page: React.FC = () => {
	const navigate = useNavigate();
	const [view, setView] = useState<'dashboard' | 'orders' | 'inventory' | 'finances'>('dashboard');

	const [orders, setOrders] = useState<Order[]>([]);
	const [ordersLoading, setOrdersLoading] = useState(true);
	const [ordersError, setOrdersError] = useState('');
	const [transferredOrderIds, setTransferredOrderIds] = useState<Set<string>>(() => new Set());
	const [products, setProducts] = useState<Product[]>([]);
	const [notifications, setNotifications] = useState<AdminNotification[]>([]);

	// Modal state for confirming order ETA
	const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
	const [etaInput, setEtaInput] = useState('');

	useEffect(() => {
		let mounted = true;
		const loadOrders = async () => {
			try {
				const currentOrders = await getOrders();
				if (mounted) {
					setOrders(currentOrders);
					setOrdersError('');
				}
			} catch (error) {
				if (mounted) setOrdersError(error instanceof Error ? error.message : 'Orders could not be loaded.');
			} finally {
				if (mounted) setOrdersLoading(false);
			}
		};
		const channel = supabase
			.channel('admin-live-updates')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
				const product = (payload.eventType === 'DELETE' ? payload.old : payload.new) as { title?: string };
				const action = payload.eventType === 'INSERT' ? 'added' : payload.eventType === 'DELETE' ? 'removed' : 'updated';
				setNotifications((current) => [{
					id: Date.now(),
					message: `Product ${product.title ?? ''} ${action}`.trim(),
					createdAt: new Date(),
				}, ...current].slice(0, 10));
				void getProducts().then((currentProducts) => {
					if (mounted) setProducts(currentProducts);
				}).catch((error: unknown) => console.error('Unable to refresh product metrics:', error));
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
				const order = (payload.eventType === 'DELETE' ? payload.old : payload.new) as { order_number?: number };
				const orderLabel = order.order_number ? `ORD-${String(order.order_number).padStart(6, '0')}` : 'An order';
				const action = payload.eventType === 'INSERT' ? 'received' : payload.eventType === 'DELETE' ? 'removed' : 'updated';
				setNotifications((current) => [{
					id: Date.now(),
					message: `${orderLabel} ${action}`,
					createdAt: new Date(),
				}, ...current].slice(0, 10));
				void loadOrders();
			})
			.subscribe();

		void loadOrders();
		void getProducts().then((currentProducts) => {
			if (mounted) setProducts(currentProducts);
		}).catch((error: unknown) => console.error('Unable to load product metrics:', error));

		return () => {
			mounted = false;
			void supabase.removeChannel(channel);
		};
	}, []);

	const handleLogout = async () => {
		const { error } = await logout();
		if (error) {
			console.error('Unable to sign out:', error.message);
			return;
		}
		localStorage.removeItem('adminAuthenticated');
		navigate('/', { replace: true });
	};

	const openConfirm = (o: Order) => {
		setConfirmingOrder(o);
		setEtaInput('');
	};

	const handleConfirm = () => {
		if (!confirmingOrder) return;
		void updateOrderStatus(confirmingOrder.id, 'Processing', etaInput || undefined)
			.then(() => getOrders())
			.then((currentOrders) => {
				setOrders(currentOrders);
				setOrdersError('');
				setConfirmingOrder(null);
				console.log(`SMS -> ${confirmingOrder.customer_name}: Your order ORD-${String(confirmingOrder.order_number).padStart(6, '0')} ETA ${etaInput}`);
			})
			.catch((error: unknown) => setOrdersError(error instanceof Error ? error.message : 'Order could not be updated.'));
	};

	const handleDecline = async (orderId: string) => {
		try {
			await updateOrderStatus(orderId, 'Failed');
			setOrders(await getOrders());
			setOrdersError('');
		} catch (error) {
			setOrdersError(error instanceof Error ? error.message : 'Order could not be updated.');
		}
	};

	const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
		try {
			await updateOrderStatus(orderId, status);
			setOrders(await getOrders());
			setOrdersError('');
		} catch (error) {
			setOrdersError(error instanceof Error ? error.message : 'Order could not be updated.');
		}
	};

	const markTransferred = (id: string) => {
		setTransferredOrderIds((current) => {
			const updated = new Set(current);
			if (updated.has(id)) updated.delete(id);
			else updated.add(id);
			return updated;
		});
	};

	const activeOrders = orders.length;
	const activeProducts = products.filter((product) => product.stock > 0).length;
	const totalRevenue = orders.reduce((total, order) => total + order.amount, 0);
	const formattedRevenue = `$${totalRevenue.toLocaleString()}`;

	return (
		<div className="admin-page-root">
			<Admin_sidenavbar active={view} onChange={(v) => setView(v)} />

			<main className="admin-main">
				{view === 'dashboard' && (
					<section className="dash">
						<header>
							<div>
								<h1>Operations Dashboard</h1>
								<p>Real-time platform metrics and critical notifications.</p>
							</div>
							<button onClick={handleLogout} className="logout-btn">Logout</button>
						</header>

						<div className="metrics">
							<div className="card">
								<h3>Active Orders</h3>
								<p>{activeOrders}</p>
							</div>
							<div className="card">
								<h3>Items for Sale</h3>
								<p>{activeProducts}</p>
							</div>
							<div className="card">
								<h3>Total Revenue</h3>
								<p>{formattedRevenue}</p>
							</div>
						</div>

						<div className="notifications" aria-live="polite">
							<h4>Live Notifications</h4>
							{notifications.length === 0 ? (
								<p className="notifications-empty">No new activity.</p>
							) : (
								<ul>
									{notifications.map((notification) => (
										<li key={notification.id}>
											<span>{notification.message}</span>
											<time>{notification.createdAt.toLocaleTimeString()}</time>
										</li>
									))}
								</ul>
							)}
						</div>
					</section>
				)}

				{view === 'orders' && (
					<Orders_Manager orders={orders} loading={ordersLoading} error={ordersError} onOpenConfirm={openConfirm} onDecline={handleDecline} onUpdateStatus={handleStatusUpdate} />
				)}

				{view === 'inventory' && (
					<Global_inventory />
				)}

				{view === 'finances' && (
					<Finances orders={orders} transferredOrderIds={transferredOrderIds} markTransferred={markTransferred} />
				)}
		</main>

		{confirmingOrder && (
			<div className="modal-backdrop">
				<div className="modal">
					<h3>Confirm ORD-{String(confirmingOrder.order_number).padStart(6, '0')}</h3>
					<label>Estimated Time of Arrival</label>
					<input type="date" value={etaInput} onChange={(e) => setEtaInput(e.target.value)} />
					<div className="modal-actions">
						<button onClick={() => setConfirmingOrder(null)}>Cancel</button>
						<button onClick={handleConfirm} className="primary">Confirm & Notify</button>
					</div>
				</div>
			</div>
		)}
		</div>
	);
};

export default Admin_page;
