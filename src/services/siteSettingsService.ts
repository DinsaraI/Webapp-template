import { supabase } from '../supabaseClient';
import type { SiteSettings } from '../types/siteSettings';

export async function getSiteSettings(): Promise<SiteSettings> {
	const { data, error } = await supabase
		.from('site_settings')
		.select('hero_banner_image_url, hero_title, hero_subtitle, announcement_text, announcement_enabled')
		.eq('id', true)
		.single();

	if (error) throw error;
	return data as SiteSettings;
}

export async function updateSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
	const { data, error } = await supabase
		.from('site_settings')
		.update(settings)
		.eq('id', true)
		.select('hero_banner_image_url, hero_title, hero_subtitle, announcement_text, announcement_enabled')
		.single();

	if (error) throw error;
	return data as SiteSettings;
}
