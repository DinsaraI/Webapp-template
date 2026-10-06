import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getSiteSettings, updateSiteSettings } from '../services/siteSettingsService';
import { defaultSiteSettings, type SiteSettings } from '../types/siteSettings';
import { supabase } from '../supabaseClient';
import { SiteSettingsContext } from './siteSettingsContext';

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState(defaultSiteSettings);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let active = true;
		void getSiteSettings()
			.then((current) => {
				if (active) {
					setSettings(current);
					setError('');
				}
			})
			.catch((loadError: unknown) => {
				console.error('Unable to load site settings:', loadError);
				if (active) setError(loadError instanceof Error ? loadError.message : 'Site settings could not be loaded.');
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		const channel = supabase
			.channel('site-settings-live-updates')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
				if (payload.eventType !== 'DELETE') {
					setSettings(payload.new as SiteSettings);
					setError('');
				}
			})
			.subscribe();

		return () => {
			active = false;
			void supabase.removeChannel(channel);
		};
	}, []);

	const saveSettings = useCallback(async (nextSettings: SiteSettings) => {
		const savedSettings = await updateSiteSettings(nextSettings);
		setSettings(savedSettings);
		setError('');
	}, []);

	return (
		<SiteSettingsContext.Provider value={{ settings, loading, error, saveSettings }}>
			{children}
		</SiteSettingsContext.Provider>
	);
}
