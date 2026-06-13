export type OrderStatus = 'Paid' | 'Confirmed' | 'Shipped' | 'Declined' | 'Cancellation Pending';

export interface Order {
  id: string;
  customer: string;
  vendor: string;
  amount: number;
  status: OrderStatus;
  eta?: string;
}

export interface Vendor {
  id: string;
  brand: string;
  bio?: string;
  approved: boolean;
  suspended?: boolean;
}

export interface Product {
  id: string;
  title: string;
  vendor: string;
  price: number;
  removed?: boolean;
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
