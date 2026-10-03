import { supabase } from '../supabaseClient';
import type { Order, OrderStatus } from '../Admin/types';

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
	items: { productId: string; quantity: number }[];
}

export async function getOrders(): Promise<Order[]> {
	const { data, error } = await supabase
		.from('orders')
		.select('*')
		.not('status', 'in', '("Declined","Failed")')
		.order('created_at', { ascending: false });

	if (error) throw error;
	return (data ?? []) as Order[];
}

export async function createOrder(order: NewOrder): Promise<{ id: string; order_number: number }> {
	const { data, error } = await supabase.rpc('place_order', {
		p_customer_name: order.customerName,
		p_customer_email: order.customerEmail,
		p_customer_phone: order.customerPhone,
		p_shipping_address: order.shippingAddress,
		p_items: order.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
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
}