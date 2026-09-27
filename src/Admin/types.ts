export type OrderStatus = 'Pending' | 'Paid' | 'Confirmed' | 'Shipped' | 'Declined' | 'Cancellation Pending';

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  amount: number;
  status: OrderStatus;
  eta?: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  gross: number;
  commissionPct: number;
  transferred?: boolean;
}

export type DesignerStatus = 'active' | 'suspended' | 'banned';

export interface Designer {
  id: string;
  brand: string;
  owner: string;
  email: string;
  joinDate: string;
  status: DesignerStatus;
  warnings: number;
  bio?: string;
  rating?: number;
}
