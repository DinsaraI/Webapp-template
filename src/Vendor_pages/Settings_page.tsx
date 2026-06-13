import React, { useState } from 'react';
import SideNavbar from './components/side_navbar';
import './Settings_page.css';

type SettingsState = {
	brandName: string;
	storeHandle: string;
	brandBio: string;
	logo?: string | null;
	banner?: string | null;
	instagram: string;
	tiktok: string;
	legalName: string;
	address: string;
	contactEmail: string;
	contactPhone: string;
	processingTime: string;
	returnPolicy: string;
	vacationMode: boolean;
	bankName: string;
	branchCode: string;
	accountNumber: string;
	accountHolder: string;
};

const Settings_page = () => {
	const [state, setState] = useState<SettingsState>({
		brandName: '',
		storeHandle: '',
		brandBio: '',
		logo: null,
		banner: null,
		instagram: '',
		tiktok: '',
		legalName: '',
		address: '',
		contactEmail: '',
		contactPhone: '',
		processingTime: '',
		returnPolicy: '',
		vacationMode: false,
		bankName: '',
		branchCode: '',
		accountNumber: '',
		accountHolder: '',
	});

	function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
		setState(prev => ({ ...prev, [key]: value }));
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'banner') {
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		update(key, url);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		// For now: local save (replace with API call)
		console.log('Vendor settings saved', state);
		alert('Settings saved (local only)');
	}

	return (
		<div className="vendor-page-container">
			<SideNavbar activeItem="settings" />
			<div className="settings-page">
				<header className="settings-header">
					<h1>Store Settings</h1>
					<p className="muted">Manage your brand information and payout details.</p>
				</header>

				<form className="settings-form" onSubmit={handleSubmit}>
					<section className="form-section">
						<div className="form-row">
							<div className="form-group">
								<label>Brand Display Name</label>
								<input value={state.brandName} onChange={e => update('brandName', e.target.value)} />
							</div>

							<div className="form-group">
								<label>Store Handle / URL Slug</label>
								<input value={state.storeHandle} onChange={e => update('storeHandle', e.target.value)} />
							</div>
						</div>

						<div className="form-group">
							<label>Brand Bio / Description</label>
							<textarea value={state.brandBio} onChange={e => update('brandBio', e.target.value)} />
						</div>

						<div className="form-row">
							<div className="form-group">
								<label>Brand Logo (Upload)</label>
								<input type="file" accept="image/*" onChange={e => handleFileChange(e, 'logo')} />
								{state.logo && <img className="file-preview" src={state.logo} alt="logo preview" />}
							</div>

							<div className="form-group">
								<label>Banner Image (Upload)</label>
								<input type="file" accept="image/*" onChange={e => handleFileChange(e, 'banner')} />
								{state.banner && <img className="file-preview" src={state.banner} alt="banner preview" />}
							</div>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label>Instagram</label>
								<input value={state.instagram} onChange={e => update('instagram', e.target.value)} placeholder="https://instagram.com/yourhandle" />
							</div>
							<div className="form-group">
								<label>TikTok</label>
								<input value={state.tiktok} onChange={e => update('tiktok', e.target.value)} placeholder="https://tiktok.com/@yourhandle" />
							</div>
						</div>
					</section>

					<section className="form-section">
						<h3>Business & Contact</h3>
						<div className="form-row">
							<div className="form-group">
								<label>Legal Business Name</label>
								<input value={state.legalName} onChange={e => update('legalName', e.target.value)} />
							</div>
							<div className="form-group">
								<label>Address</label>
								<input value={state.address} onChange={e => update('address', e.target.value)} />
							</div>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label>Vendor Contact Email</label>
								<input value={state.contactEmail} onChange={e => update('contactEmail', e.target.value)} type="email" />
							</div>
							<div className="form-group">
								<label>Vendor Contact Phone</label>
								<input value={state.contactPhone} onChange={e => update('contactPhone', e.target.value)} />
							</div>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label>Average Processing / Handling Time</label>
								<input value={state.processingTime} onChange={e => update('processingTime', e.target.value)} placeholder="e.g. 1-3 business days" />
							</div>
							<div className="form-group">
								<label>Vacation Mode</label>
								<div className="toggle-row">
									<label className="switch">
										<input type="checkbox" checked={state.vacationMode} onChange={e => update('vacationMode', e.target.checked)} />
										<span className="slider" />
									</label>
								</div>
							</div>
						</div>

						<div className="form-group">
							<label>Return & Exchange Policy</label>
							<textarea value={state.returnPolicy} onChange={e => update('returnPolicy', e.target.value)} />
						</div>
					</section>

					<section className="form-section">
						<h3>Payout Details</h3>
						<div className="form-row">
							<div className="form-group">
								<label>Bank Name</label>
								<input value={state.bankName} onChange={e => update('bankName', e.target.value)} />
							</div>
							<div className="form-group">
								<label>Branch Code</label>
								<input value={state.branchCode} onChange={e => update('branchCode', e.target.value)} />
							</div>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label>Account Number</label>
								<input value={state.accountNumber} onChange={e => update('accountNumber', e.target.value)} />
							</div>
							<div className="form-group">
								<label>Account Holder Name</label>
								<input value={state.accountHolder} onChange={e => update('accountHolder', e.target.value)} />
							</div>
						</div>
					</section>

					<div className="form-actions">
						<button type="submit" className="save-button">Save Settings</button>
						<button type="button" className="cancel-button" onClick={() => alert('Changes discarded')}>Cancel</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Settings_page;

