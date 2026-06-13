import React from 'react';
import type { Vendor } from './types';

interface Props {
	vendors: Vendor[];
	approveVendor: (id: string) => void;
	rejectVendor: (id: string) => void;
	toggleSuspend: (id: string) => void;
}

const Vendor_approvals: React.FC<Props> = ({ vendors, approveVendor, rejectVendor, toggleSuspend }) => {
	return (
		<section>
			<h1>Vendor Curation & Approvals</h1>
			<div className="vendor-section">
				<div className="pending">
					<h3>Pending Applications</h3>
					{vendors.filter(v => !v.approved).length === 0 && <p>No pending applications</p>}
					{vendors.filter(v => !v.approved).map((v) => (
						<div key={v.id} className="vendor-card">
							<strong>{v.brand}</strong>
							<p>{v.bio}</p>
							<div className="actions">
								<button onClick={() => approveVendor(v.id)}>Approve</button>
								<button onClick={() => rejectVendor(v.id)}>Reject</button>
							</div>
						</div>
					))}
				</div>

				<div className="active-designers">
					<h3>Active Designers Directory</h3>
					{vendors.filter(v => v.approved).map((v) => (
						<div key={v.id} className="vendor-card">
							<strong>{v.brand}</strong>
							<p>{v.bio}</p>
							<label>
								Suspend:
								<input type="checkbox" checked={!!v.suspended} onChange={() => toggleSuspend(v.id)} />
							</label>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Vendor_approvals;
