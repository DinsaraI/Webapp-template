export type OrderStatus =
  | 'Pending'
  | 'Paid'
  | 'Confirmed'
  | 'Processing'
  | 'Shipping'
  | 'Shipped'
  | 'Delivered'
  | 'Failed'
  | 'Declined'
  | 'Cancellation Pending'
  | 'Cancelled';

export interface OrderHistoryItem {
	productId: string;
	title: string;
	quantity: number;
	unitPrice: number;
	size?: string;
	imageUrl?: string;
}

export interface CustomerOrder {
	id: string;
	order_number: number;
	user_id: string;
	customer_name: string;
	customer_email: string;
	customer_phone: string;
	items: OrderHistoryItem[];
	amount: number;
	status: OrderStatus;
	created_at: string;
	eta: string | null;
	tracking_number?: string | null;
}
