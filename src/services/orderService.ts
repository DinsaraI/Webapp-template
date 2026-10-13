import { supabase } from '../supabaseClient';
import type { Order, OrderStatus } from '../Admin/types';
import type { CustomerOrder } from '../types/order';
import { getSignedInUser } from './profileService';

export interface NewOrder {
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	shippingAddress: {
		recipient_name: string;
		phone_number: string;
		street_address: string;
		city: string;
		postal_code: string;
		country: string;
	};
	items: { productId: string; quantity: number; size: string }[];
}

export class OrderNotificationError extends Error {
	readonly orderId: string;

	constructor(orderId: string, message: string) {
		super(message);
		this.name = 'OrderNotificationError';
		this.orderId = orderId;
	}
}

export async function sendOrderStatusNotification(orderId: string): Promise<void> {
	const { error } = await supabase.functions.invoke('send-order-status-notification', {
		body: { orderId },
	});
	if (!error) return;

	let detail = error.message;
	if ('context' in error && error.context instanceof Response) {
		const responseBody: unknown = await error.context.clone().json().catch(() => null);
		if (
			typeof responseBody === 'object'
			&& responseBody !== null
			&& 'error' in responseBody
			&& typeof responseBody.error === 'string'
		) {
			detail = responseBody.error;
		}
	}
	throw new OrderNotificationError(orderId, detail);
}

export async function getOrders(): Promise<Order[]> {
	const { data, error } = await supabase
		.from('orders')
		.select('*')
		.not('status', 'in', '("Declined","Failed","Cancelled")')
		.order('created_at', { ascending: false });

	if (error) throw error;
	return (data ?? []) as Order[];
}

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
	const user = await getSignedInUser();
	const { data, error } = await supabase
		.from('orders')
		.select('id, order_number, user_id, customer_name, customer_email, customer_phone, items, amount, status, created_at, eta, tracking_number')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return (data ?? []) as CustomerOrder[];
}

export async function createOrder(order: NewOrder, amountInCents: number): Promise<{ id: string; order_number: number }> {
	const { data, error } = await supabase.functions.invoke('payhere-demo-confirmation', {
		body: { order, amountInCents },
	});
	if (error) {
		let message = error.message;
		if ('context' in error && error.context instanceof Response) {
			const responseBody: unknown = await error.context.clone().json().catch(() => null);
			if (
				typeof responseBody === 'object'
				&& responseBody !== null
				&& 'error' in responseBody
				&& typeof responseBody.error === 'string'
			) {
				message = responseBody.error;
			}
		}
		throw new Error(message);
	}
	if (
		typeof data?.paymentStatus !== 'string'
		|| data.paymentStatus !== 'COMPLETE'
		|| typeof data.order?.id !== 'string'
		|| typeof data.order?.order_number !== 'number'
	) {
		throw new Error('PayHere did not confirm this demo payment. No order was created.');
	}
	return data.order as { id: string; order_number: number };
}

export async function updateOrderStatus(id: string, status: OrderStatus, eta?: string): Promise<void> {
	if (status === 'Shipped') {
		const { data, error: trackingError } = await supabase
			.from('orders')
			.select('tracking_number')
			.eq('id', id)
			.single();
		if (trackingError) throw trackingError;
		if (!data.tracking_number?.trim()) {
			throw new Error('Save a tracking number before marking this order as shipped.');
		}
	}

	const updates = eta ? { status, eta } : { status };
	const { error } = await supabase.from('orders').update(updates).eq('id', id);
	if (error) throw error;

	try {
		await sendOrderStatusNotification(id);
	} catch (error) {
		if (error instanceof OrderNotificationError) {
			throw new OrderNotificationError(id, `Order status was updated, but customer notifications failed: ${error.message}`);
		}
		throw error;
	}
}

export async function updateOrderTrackingNumber(id: string, trackingNumber: string): Promise<void> {
	const normalizedTrackingNumber = trackingNumber.trim();
	if (!normalizedTrackingNumber) throw new Error('Enter a tracking number before saving.');
	const { error } = await supabase
		.from('orders')
		.update({ tracking_number: normalizedTrackingNumber })
		.eq('id', id);
	if (error) throw error;
}