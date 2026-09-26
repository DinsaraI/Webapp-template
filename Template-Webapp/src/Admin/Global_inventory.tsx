import React from 'react';
import type { Product } from './types';

interface Props {
	products: Product[];
	search: string;
	setSearch: (v: string) => void;
	takeDown: (id: string) => void;
}

const Global_inventory: React.FC<Props> = ({ products, search, setSearch, takeDown }) => {
	const filtered = products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.vendor.toLowerCase().includes(search.toLowerCase()));
	return (
		<section>
			<h1>Global Inventory & Content Moderation</h1>
			<div className="inventory-controls">
				<input placeholder="Search products or vendor" value={search} onChange={(e) => setSearch(e.target.value)} />
			</div>

			<div className="product-grid">
				{filtered.map((p) => (
					<div key={p.id} className={`product-card ${p.removed ? 'removed' : ''}`}>
						<h4>{p.title}</h4>
						<p>{p.vendor}</p>
						<p>${p.price}</p>
						{!p.removed && <button onClick={() => takeDown(p.id)}>Take Down</button>}
						{p.removed && <span className="takedown">Removed</span>}
					</div>
				))}
			</div>
		</section>
	);
};

export default Global_inventory;
