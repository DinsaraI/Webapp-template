import { supabase } from '../supabaseClient';

export interface CustomerNotification {
	id: string;
	title: string;
	message: string;
	created_at: string;
	read_at: string | null;
	expires_at: string | null;
}

export async function getNotifications(): Promise<CustomerNotification[]> {
	const { error: cleanupError } = await supabase.rpc('expire_read_notifications');
	if (cleanupError) throw cleanupError;

	const { data, error } = await supabase
		.from('notifications')
		.select('id, title, message, created_at, read_at, expires_at')
		.order('created_at', { ascending: false });

	if (error) throw error;
	return (data ?? []) as CustomerNotification[];
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
	const { error } = await supabase.rpc('mark_notifications_read', {
		p_notification_ids: ids ?? null,
	});

	if (error) throw error;
}
