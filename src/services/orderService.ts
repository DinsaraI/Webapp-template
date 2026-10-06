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
		.select('id, order_number, user_id, customer_name, customer_email, customer_phone, items, amount, status, created_at, eta')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return (data ?? []) as CustomerOrder[];
}

export async function createOrder(order: NewOrder): Promise<{ id: string; order_number: number }> {
	const { data, error } = await supabase.rpc('place_order', {
		p_customer_name: order.customerName,
		p_customer_email: order.customerEmail,
		p_customer_phone: order.customerPhone,
		p_shipping_address: order.shippingAddress,
		p_items: order.items.map((item) => ({ product_id: item.productId, quantity: item.quantity, size: item.size })),
	});

	if (error) throw error;
	const createdOrder = (data as { id: string; order_number: number }[] | null)?.[0];
	if (!createdOrder) throw new Error('The order could not be created.');
	return createdOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus, eta?: string): Promise<void> {
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
	const { error } = await supabase
		.from('orders')
		.update({ tracking_number: trackingNumber.trim() || null })
		.eq('id', id);
	if (error) throw error;
}