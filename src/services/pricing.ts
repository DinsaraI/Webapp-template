import type { CartItem } from './cartService';

export const FREE_SHIPPING_THRESHOLD = 10_000;
export const STANDARD_SHIPPING_FEE = 500;

export function parseCartItemPrice(price: string): number {
  const parsed = Number(price.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateCartSubtotal(items: CartItem[]): number {
  const subtotal = items.reduce(
    (total, item) => total + parseCartItemPrice(item.price) * (item.qty ?? 1),
    0,
  );
  return Math.round((subtotal + Number.EPSILON) * 100) / 100;
}

export function calculateShippingFee(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
}
