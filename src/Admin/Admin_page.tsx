import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin_page.css';
import Admin_sidenavbar from './Admin_sidenavbar';
import Orders_Manager from './Orders_Manager';
import Global_inventory from './Global_inventory';
import Finances from './Finances';
import Designer_manager from './Designer_manager';
import type { Order, Transaction, Designer } from './types';
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

const mockTransactions: Transaction[] = [
	{ id: 'T-1', orderId: 'ORD-1002', gross: 1250, commissionPct: 12 },
	{ id: 'T-2', orderId: 'ORD-1001', gross: 420, commissionPct: 12 },
];

const mockDesigners: Designer[] = [
	{ id: 'D-1', brand: 'LuxeDesign', owner: 'Sophie Martin', email: 'sophie@luxedesign.com', joinDate: '2025-03-15', status: 'active', warnings: 0, rating: 4.8 },
	{ id: 'D-2', brand: 'StudioF', owner: 'Francesca Rossi', email: 'francesca@studiof.com', joinDate: '2025-01-20', status: 'active', warnings: 1, rating: 4.5 },
	{ id: 'D-3', brand: 'ModaPro', owner: 'Elena Garcia', email: 'elena@modapro.com', joinDate: '2024-11-10', status: 'active', warnings: 2, rating: 4.2 },
	{ id: 'D-4', brand: 'ArtisanCraft', owner: 'Marco Bianchi', email: 'marco@artisancraft.com', joinDate: '2024-08-05', status: 'suspended', warnings: 3, rating: 3.9 },
	{ id: 'D-5', brand: 'VintageHouse', owner: 'Lucia Ferrari', email: 'lucia@vintagehouse.com', joinDate: '2024-05-12', status: 'banned', warnings: 5, rating: 2.1 },
];

const Admin_page: React.FC = () => {
	const navigate = useNavigate();
	const [view, setView] = useState<'dashboard' | 'orders' | 'inventory' | 'finances' | 'designers'>('dashboard');

	const [orders, setOrders] = useState<Order[]>([]);
	const [ordersLoading, setOrdersLoading] = useState(true);
	const [ordersError, setOrdersError] = useState('');
	const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
	const [designers, setDesigners] = useState<Designer[]>(mockDesigners);
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
		void updateOrderStatus(confirmingOrder.id, 'Confirmed', etaInput || undefined)
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
			await updateOrderStatus(orderId, 'Declined');
			setOrders(await getOrders());
			setOrdersError('');
		} catch (error) {
			setOrdersError(error instanceof Error ? error.message : 'Order could not be updated.');
		}
	};

	const markTransferred = (id: string) => {
		setTransactions((t) => t.map((x) => x.id === id ? { ...x, transferred: !x.transferred } : x));
	};

	const suspendDesigner = (id: string) => {
		setDesigners((d) => d.map((x) => x.id === id ? { ...x, status: 'suspended' } : x));
	};

	const banDesigner = (id: string) => {
		setDesigners((d) => d.map((x) => x.id === id ? { ...x, status: 'banned' } : x));
	};

	const warnDesigner = (id: string, message: string) => {
		setDesigners((d) => d.map((x) => x.id === id ? { ...x, warnings: x.warnings + 1 } : x));
		console.log(`Warning sent to ${id}: ${message}`);
	};

	const restoreDesigner = (id: string) => {
		setDesigners((d) => d.map((x) => x.id === id ? { ...x, status: 'active' } : x));
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
					<Orders_Manager orders={orders} loading={ordersLoading} error={ordersError} onOpenConfirm={openConfirm} onDecline={handleDecline} />
				)}

				{view === 'inventory' && (
					<Global_inventory />
				)}

				{view === 'finances' && (
					<Finances transactions={transactions} markTransferred={markTransferred} />
				)}

			{view === 'designers' && (
				<Designer_manager designers={designers} onSuspend={suspendDesigner} onBan={banDesigner} onWarn={warnDesigner} onRestore={restoreDesigner} />
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

