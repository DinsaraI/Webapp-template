type CartItem = {
  id: string;
  name: string;
  price: string;
  image?: string;
  qty?: number;
};

const CART_KEY = 'a2w_cart_v1';

const read = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
};

const write = (items: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('a2w:cart-updated', { detail: items }));
};

export const getCart = () => read();

export const addItem = (item: CartItem) => {
  const items = read();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx].qty = Math.min(20, (items[idx].qty || 1) + (item.qty || 1));
  } else {
    items.push({ ...item, qty: Math.min(20, item.qty || 1) });
  }
  write(items);
  // open cart UI
  window.dispatchEvent(new CustomEvent('a2w:cart-open'));
  // notify an item was added (for small UI feedback like a shake)
  window.dispatchEvent(new CustomEvent('a2w:cart-added', { detail: item }));
};

export const removeItem = (id: string) => {
  const items = read().filter((i) => i.id !== id);
  write(items);
};

export const updateQuantity = (id: string, quantity: number) => {
  const items = read();
  const nextQuantity = Number.isFinite(quantity) ? Math.min(20, Math.floor(quantity)) : 1;
  const updatedItems = nextQuantity < 1
    ? items.filter((item) => item.id !== id)
    : items.map((item) => item.id === id ? { ...item, qty: nextQuantity } : item);
  write(updatedItems);
};

export const clearCart = () => {
  write([]);
};

export const openCart = () => window.dispatchEvent(new CustomEvent('a2w:cart-open'));
export const closeCart = () => window.dispatchEvent(new CustomEvent('a2w:cart-close'));

export type { CartItem };
