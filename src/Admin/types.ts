import type { OrderStatus } from '../types/order';
export type { OrderStatus } from '../types/order';

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address?: {
    recipient_name: string;
    phone_number: string;
    street_address: string;
    city: string;
    postal_code: string;
    country: string;
  } | null;
  items: OrderItem[];
  amount: number;
  status: OrderStatus;
  eta?: string | null;
  tracking_number?: string | null;
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
