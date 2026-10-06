import { createContext } from 'react';
import type { SiteSettings } from '../types/siteSettings';

export interface SiteSettingsContextValue {
	settings: SiteSettings;
	loading: boolean;
	error: string;
	saveSettings: (settings: SiteSettings) => Promise<void>;
}

export const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);
