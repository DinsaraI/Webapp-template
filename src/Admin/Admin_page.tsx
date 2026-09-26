import React, { useState } from 'react';
import './Admin_page.css';
import Admin_sidenavbar from './Admin_sidenavbar';
import Orders_Manager from './Orders_Manager';
import Vendor_approvals from './Vendor_approvals';
import Global_inventory from './Global_inventory';
import Finances from './Finances';
import Designer_manager from './Designer_manager';
import type { Order, Vendor, Transaction, Designer } from './types';
import { logout } from '../services/authService';

const mockOrders: Order[] = [
	{ id: 'ORD-1001', customer: 'Alice', vendor: 'LuxeDesign', amount: 420, status: 'Paid' },
	{ id: 'ORD-1002', customer: 'Brian', vendor: 'StudioF', amount: 1250, status: 'Confirmed', eta: '2026-06-20' },
	{ id: 'ORD-1003', customer: 'Cindy', vendor: 'ModaPro', amount: 320, status: 'Paid' },
];

const mockVendors: Vendor[] = [
	{ id: 'V-900', brand: 'NewCraft', bio: 'Handmade silk pieces', approved: false },
	{ id: 'V-901', brand: 'HeritageCo', bio: 'Family-run atelier', approved: true },
];

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
	const [view, setView] = useState<'dashboard' | 'orders' | 'vendors' | 'inventory' | 'finances' | 'designers'>('dashboard');

	const [orders, setOrders] = useState<Order[]>(mockOrders);
	const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
	const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
	const [designers, setDesigners] = useState<Designer[]>(mockDesigners);


	// Modal state for confirming order ETA
	const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
	const [etaInput, setEtaInput] = useState('');

	const handleLogout = async () => {
		const { error } = await logout();
		if (error) {
			console.error('Unable to sign out:', error.message);
			return;
		}
		localStorage.removeItem('adminAuthenticated');
		window.location.hash = '';
	};

	const openConfirm = (o: Order) => {
		setConfirmingOrder(o);
		setEtaInput('');
	};

	const handleConfirm = () => {
		if (!confirmingOrder) return;
		setOrders((prev) => prev.map((o) => o.id === confirmingOrder.id ? { ...o, status: 'Confirmed', eta: etaInput } : o));
		console.log(`SMS -> ${confirmingOrder.customer}: Your order ${confirmingOrder.id} ETA ${etaInput}`);
		setConfirmingOrder(null);
	};

	const handleDecline = (orderId: string) => {
		setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'Declined' } : o));
	};

	const approveVendor = (id: string) => {
		setVendors((v) => v.map((x) => x.id === id ? { ...x, approved: true } : x));
	};
	const rejectVendor = (id: string) => {
		setVendors((v) => v.filter((x) => x.id !== id));
	};

	const toggleSuspend = (id: string) => {
		setVendors((v) => v.map((x) => x.id === id ? { ...x, suspended: !x.suspended } : x));
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

	const totalGMV = transactions.reduce((s, t) => s + t.gross, 0);
	const platformCommission = transactions.reduce((s, t) => s + (t.gross * t.commissionPct) / 100, 0);
	const activeCustomers = 1245;
	const activeVendors = vendors.filter((v) => v.approved && !v.suspended).length;

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
								<h3>Total GMV</h3>
								<p>${totalGMV.toLocaleString()}</p>
							</div>
							<div className="card">
								<h3>Platform Commission</h3>
								<p>${platformCommission.toFixed(2)}</p>
							</div>
							<div className="card">
								<h3>Active Customers</h3>
								<p>{activeCustomers}</p>
							</div>
							<div className="card">
								<h3>Active Vendors</h3>
								<p>{activeVendors}</p>
							</div>
						</div>

						<div className="notifications">
							<h4>Live Notifications</h4>
							<ul>
								<li>New Vendor Registration Pending Approval</li>
								<li>Order ORD-1004: Payment requires manual review</li>
							</ul>
						</div>
					</section>
				)}

				{view === 'orders' && (
					<Orders_Manager orders={orders} onOpenConfirm={openConfirm} onDecline={handleDecline} />
				)}

				{view === 'vendors' && (
					<Vendor_approvals vendors={vendors} approveVendor={approveVendor} rejectVendor={rejectVendor} toggleSuspend={toggleSuspend} />
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
					<h3>Confirm {confirmingOrder.id}</h3>
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

