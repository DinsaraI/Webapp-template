import React from 'react';
import './Admin_sidenavbar.css';

interface Props {
	active: 'dashboard' | 'orders' | 'vendors' | 'inventory' | 'finances' | 'designers';
	onChange: (v: Props['active']) => void;
}

const Admin_sidenavbar: React.FC<Props> = ({ active, onChange }) => {
	return (
		<aside className="admin-side">
			<h2>Admin Panel</h2>
			<nav>
				<button className={active === 'dashboard' ? 'active' : ''} onClick={() => onChange('dashboard')}>Operations</button>
				<button className={active === 'orders' ? 'active' : ''} onClick={() => onChange('orders')}>Orders Manager</button>
				<button className={active === 'vendors' ? 'active' : ''} onClick={() => onChange('vendors')}>Vendor Approvals</button>			<button className={active === 'designers' ? 'active' : ''} onClick={() => onChange('designers')}>Designers & Brands</button>				<button className={active === 'inventory' ? 'active' : ''} onClick={() => onChange('inventory')}>Global Inventory</button>
				<button className={active === 'finances' ? 'active' : ''} onClick={() => onChange('finances')}>Finances</button>
			</nav>
		</aside>
	);
};

export default Admin_sidenavbar;
