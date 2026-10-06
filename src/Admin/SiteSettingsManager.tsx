import { useEffect, useState, type FormEvent } from 'react';
import { useSiteSettings } from '../context/useSiteSettings';
import type { SiteSettings } from '../types/siteSettings';

export default function SiteSettingsManager() {
	const { settings, loading, error, saveSettings } = useSiteSettings();
	const [draft, setDraft] = useState<SiteSettings>(settings);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');
	const [saveError, setSaveError] = useState('');

	useEffect(() => {
		setDraft(settings);
	}, [settings]);

	const update = (key: keyof SiteSettings, value: string | boolean) => {
		setDraft((current) => ({ ...current, [key]: value }));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSaving(true);
		setMessage('');
		setSaveError('');
		try {
			await saveSettings(draft);
			setMessage('Homepage settings saved and published.');
		} catch (saveFailure) {
			setSaveError(saveFailure instanceof Error ? saveFailure.message : 'Homepage settings could not be saved.');
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <p role="status">Loading site settings...</p>;

	return (
		<section className="site-settings-panel">
			<header>
				<h1>Site settings</h1>
				<p>Update the homepage banner and announcement shown to customers.</p>
			</header>
			{error && <p role="alert">Current settings could not be loaded: {error}</p>}
			<form onSubmit={(event) => void handleSubmit(event)}>
				<label>
					Hero banner image URL
					<input
						type="url"
						value={draft.hero_banner_image_url}
						onChange={(event) => update('hero_banner_image_url', event.target.value)}
						placeholder="https://example.com/banner.jpg"
					/>
				</label>
				<label>
					Hero title
					<input
						type="text"
						required
						maxLength={120}
						value={draft.hero_title}
						onChange={(event) => update('hero_title', event.target.value)}
					/>
				</label>
				<label>
					Hero subtitle
					<textarea
						required
						maxLength={300}
						rows={3}
						value={draft.hero_subtitle}
						onChange={(event) => update('hero_subtitle', event.target.value)}
					/>
				</label>
				<label>
					Top announcement text
					<input
						type="text"
						required
						maxLength={180}
						value={draft.announcement_text}
						onChange={(event) => update('announcement_text', event.target.value)}
					/>
				</label>
				<label className="site-settings-toggle">
					<input
						type="checkbox"
						checked={draft.announcement_enabled}
						onChange={(event) => update('announcement_enabled', event.target.checked)}
					/>
					Show announcement bar
				</label>
				{saveError && <p className="site-settings-error" role="alert">{saveError}</p>}
				{message && <p className="site-settings-success" role="status">{message}</p>}
				<button type="submit" disabled={saving || Boolean(error)}>
					{saving ? 'Saving...' : 'Save homepage settings'}
				</button>
			</form>
		</section>
	);
}
