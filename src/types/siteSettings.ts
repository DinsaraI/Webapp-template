export interface SiteSettings {
	hero_banner_image_url: string;
	hero_title: string;
	hero_subtitle: string;
	announcement_text: string;
	announcement_enabled: boolean;
}

export const defaultSiteSettings: SiteSettings = {
	hero_banner_image_url: '',
	hero_title: 'Stop blending in. Start being the reference.',
	hero_subtitle: 'Designer-grade silhouettes for the everyday icon. High-end looks, real-world accessibility.',
	announcement_text: 'Free delivery on orders over LKR 10,000!',
	announcement_enabled: true,
};
