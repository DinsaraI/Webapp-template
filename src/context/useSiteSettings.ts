import { useContext } from 'react';
import { SiteSettingsContext } from './siteSettingsContext';

export function useSiteSettings() {
	const value = useContext(SiteSettingsContext);
	if (!value) throw new Error('useSiteSettings must be used within SiteSettingsProvider.');
	return value;
}
