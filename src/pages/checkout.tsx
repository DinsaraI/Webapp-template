import React, { useEffect, useState } from 'react';
import Navbar from '../assets/components/navbar';
import Footer from '../assets/components/footer';
import { clearCart, getCart } from '../services/cartService';
import type { CartItem } from '../services/cartService';
import { createOrder } from '../services/orderService';
import './checkout.css';

type Shipping = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  province: string;
  email?: string;
  phone?: string;
};

type Payment = {
  cardNumber: string; // store masked/unmasked as needed
  expiry: string; // MM/YY
  cvv?: string;
};

const STORAGE_KEY = 'a2w_checkout_info_v1';
const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
}).format(price);

const Checkout: React.FC = () => {
  const [shipping, setShipping] = useState<Partial<Shipping>>({});
  const [payment, setPayment] = useState<Partial<Payment>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [editingShipping, setEditingShipping] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderMessage, setOrderMessage] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.shipping) setShipping(parsed.shipping);
        if (parsed.payment) setPayment(parsed.payment);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const syncCart = () => setCartItems(getCart());
    syncCart();
    window.addEventListener('a2w:cart-updated', syncCart);
    return () => window.removeEventListener('a2w:cart-updated', syncCart);
  }, []);

  const saveToStorage = (s: Partial<Shipping>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shipping: s }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const s: Partial<Shipping> = {
      fullName: String(data.get('fullName') || '').trim(),
      street: String(data.get('street') || '').trim(),
      city: String(data.get('city') || '').trim(),
      state: String(data.get('state') || '').trim(),
      province: String(data.get('province') || '').trim(),
      email: String(data.get('email') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
    };
    setShipping(s);
    saveToStorage(s);
    setEditingShipping(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const rawCard = String(data.get('cardNumber') || '').replace(/\s+/g, '');
    const p: Partial<Payment> = {
      cardNumber: rawCard,
      expiry: String(data.get('expiry') || '').trim(),
      cvv: String(data.get('cvv') || '').trim(),
    };
    setPayment(p);
    setEditingPayment(false);
  };

  const handlePlaceOrder = async () => {
    const customerName = shipping.fullName?.trim() ?? '';
    const customerEmail = shipping.email?.trim() ?? '';
    const customerPhone = shipping.phone?.trim() ?? '';
    if (!customerName || !customerEmail || !customerPhone) {
      setOrderError('Enter your name, email, and phone number before placing the order.');
      return;
    }
    if (cartItems.length === 0) {
      setOrderError('Your cart is empty.');
      return;
    }

    setIsPlacingOrder(true);
    setOrderError('');
    setOrderMessage('');
    try {
      const order = await createOrder({
        customerName,
        customerEmail,
        customerPhone,
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.qty ?? 1 })),
      });
      clearCart();
      setCartItems([]);
      setOrderMessage(`Order ORD-${String(order.order_number).padStart(6, '0')} placed successfully.`);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'The order could not be placed.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const subtotal = cartItems.reduce((total, item) => {
    const price = Number(item.price.replace(/[^\d.-]/g, ''));
    return total + (Number.isFinite(price) ? price : 0) * (item.qty ?? 1);
  }, 0);

  const maskCard = (n?: string) => {
    if (!n) return '';
    const last4 = n.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  return (
    <div className="checkout-page">
      <Navbar />

      <main className="co-main">
        <h1>Checkout</h1>

        <section className="co-columns">
          <div className="co-left">
            <h2>Contact</h2>
            <form className="co-form" onSubmit={(e) => e.preventDefault()}>
              <label>
                Email
                <input name="email" type="email" value={shipping.email || ''} onChange={(e) => setShipping((s) => ({ ...s, email: e.target.value }))} />
              </label>
              <label>
                Phone
                <input name="phone" type="tel" value={shipping.phone || ''} onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))} />
              </label>
            </form>

            <div className="co-section">
              <div className="co-section-head">
                <h2>Shipping Details</h2>
                <button className="small" onClick={() => setEditingShipping((v) => !v)}>{editingShipping ? 'Close' : shipping.fullName ? 'Edit' : 'Add'}</button>
              </div>

              {shipping && shipping.fullName && !editingShipping ? (
                <div className="co-card">
                  <div className="co-card-title">{shipping.fullName}</div>
                  <div className="co-card-body">{shipping.street}</div>
                  <div className="co-card-body">{shipping.city}, {shipping.state} {shipping.province}</div>
                </div>
              ) : null}

              {editingShipping ? (
                <form className="co-form" onSubmit={handleShippingSubmit}>
                  <label>Full name<input name="fullName" defaultValue={shipping.fullName || ''} required /></label>
                  <label>Street address<input name="street" defaultValue={shipping.street || ''} required /></label>
                  <label>City<input name="city" defaultValue={shipping.city || ''} required /></label>
                  <label>State<input name="state" defaultValue={shipping.state || ''} required /></label>
                  <label>Province<input name="province" defaultValue={shipping.province || ''} required /></label>
                  <div className="form-row">
                    <button type="submit" className="btn-primary">Save</button>
                    <button type="button" onClick={() => setEditingShipping(false)} className="btn-ghost">Cancel</button>
                  </div>
                </form>
              ) : null}
            </div>

            <div className="co-section">
              <div className="co-section-head">
                <h2>Payment</h2>
                <button className="small" onClick={() => setEditingPayment((v) => !v)}>{editingPayment ? 'Close' : payment.cardNumber ? 'Edit' : 'Add'}</button>
              </div>

              {payment && payment.cardNumber && !editingPayment ? (
                <div className="co-card">
                  <div className="co-card-title">{maskCard(payment.cardNumber)}</div>
                  <div className="co-card-body">Expiry: {payment.expiry}</div>
                </div>
              ) : null}

              {editingPayment ? (
                <form className="co-form" onSubmit={handlePaymentSubmit}>
                  <label>Card number<input name="cardNumber" defaultValue={payment.cardNumber || ''} inputMode="numeric" required /></label>
                  <label>Expiry (MM/YY)<input name="expiry" defaultValue={payment.expiry || ''} placeholder="MM/YY" required /></label>
                  <label>CVV<input name="cvv" defaultValue={payment.cvv || ''} inputMode="numeric" required /></label>
                  <div className="form-row">
                    <button type="submit" className="btn-primary">Save</button>
                    <button type="button" onClick={() => setEditingPayment(false)} className="btn-ghost">Cancel</button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>

          <aside className="co-right">
            <h2>Order summary</h2>
            <div className="summary-card">
              <div className="summary-row"><span>Item</span><span>Price</span></div>
              {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : cartItems.map((item) => (
                <div className="summary-row" key={item.id}>
                  <span>{item.name} × {item.qty ?? 1}</span>
                  <span>{item.price}</span>
                </div>
              ))}
              <div className="summary-total"><span>Total</span><span>{formatPrice(subtotal)}</span></div>

              <div className="checkout-actions">
                <button className="btn-primary" type="button" onClick={() => void handlePlaceOrder()} disabled={isPlacingOrder || cartItems.length === 0}>
                  {isPlacingOrder ? 'Placing order...' : 'Place order'}
                </button>
                {orderError && <p role="alert">{orderError}</p>}
                {orderMessage && <p role="status">{orderMessage}</p>}
              </div>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
