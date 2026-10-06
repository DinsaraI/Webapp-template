import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Navbar from '../assets/components/navbar';
import Footer from '../assets/components/footer';
import { clearCart, getCart } from '../services/cartService';
import type { CartItem } from '../services/cartService';
import { createOrder } from '../services/orderService';
import { getSignedInUser, listShippingAddresses, saveShippingAddress } from '../services/profileService';
import { supabase } from '../supabaseClient';
import type { ShippingAddress, ShippingAddressInput } from '../types/profile';
import { calculateCartSubtotal, calculateShippingFee, FREE_SHIPPING_THRESHOLD, parseCartItemPrice } from '../services/pricing';
import './checkout.css';

const NEW_ADDRESS = 'new-address';

const emptyAddress = (): ShippingAddressInput => ({
  recipient_name: '',
  phone_number: '',
  street_address: '',
  city: '',
  postal_code: '',
  country: 'Sri Lanka',
  is_default: false,
});

type Payment = {
  cardNumber: string; // store masked/unmasked as needed
  expiry: string; // MM/YY
  cvv?: string;
};

const STORAGE_KEY = 'a2w_checkout_info_v1';
const SRI_LANKAN_MOBILE_E164 = /^\+947\d{8}$/;
const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
}).format(price);

const Checkout: React.FC = () => {
  const [payment, setPayment] = useState<Partial<Payment>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState(NEW_ADDRESS);
  const [addressForm, setAddressForm] = useState<ShippingAddressInput>(emptyAddress);
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [editingPayment, setEditingPayment] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [addressSaveError, setAddressSaveError] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const placingOrderRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.payment) setPayment(parsed.payment);
        if (parsed.shipping) {
          setAddressForm((current) => ({
            ...current,
            recipient_name: parsed.shipping.fullName || current.recipient_name,
            phone_number: parsed.shipping.phone || current.phone_number,
            street_address: parsed.shipping.street || current.street_address,
            city: parsed.shipping.city || current.city,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadCheckoutDetails = async () => {
      try {
        const user = await getSignedInUser();
        const [{ data: profile, error: profileError }, savedAddresses] = await Promise.all([
          supabase.from('profiles').select('full_name, phone_number').eq('id', user.id).maybeSingle(),
          listShippingAddresses(),
        ]);
        if (profileError) throw profileError;
        if (!active) return;

        const availableAddresses = savedAddresses ?? [];
        setContactEmail(user.email ?? '');
        setAddresses(availableAddresses);
        setSelectedAddressId(
          availableAddresses.find((address) => address.is_default)?.id
          ?? availableAddresses[0]?.id
          ?? NEW_ADDRESS,
        );
        setAddressForm((current) => ({
          ...current,
          recipient_name: profile?.full_name || current.recipient_name,
          phone_number: profile?.phone_number || current.phone_number,
          is_default: availableAddresses.length === 0,
        }));
      } catch (error) {
        if (active) setOrderError(error instanceof Error ? error.message : 'Checkout details could not be loaded.');
      } finally {
        if (active) setAddressesLoading(false);
      }
    };

    void loadCheckoutDetails();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const syncCart = () => setCartItems(getCart());
    syncCart();
    window.addEventListener('a2w:cart-updated', syncCart);
    return () => window.removeEventListener('a2w:cart-updated', syncCart);
  }, []);

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
    if (placingOrderRef.current) return;
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
    const shippingAddress: ShippingAddressInput = selectedAddress
      ? {
        recipient_name: selectedAddress.recipient_name,
        phone_number: selectedAddress.phone_number,
        street_address: selectedAddress.street_address,
        city: selectedAddress.city,
        postal_code: selectedAddress.postal_code,
        country: selectedAddress.country,
        is_default: selectedAddress.is_default,
      }
      : addressForm;
    const customerName = shippingAddress.recipient_name.trim();
    const customerPhone = shippingAddress.phone_number.trim();
    const customerEmail = contactEmail.trim();

    if (!SRI_LANKAN_MOBILE_E164.test(customerPhone)) {
      setOrderError('Enter a Sri Lankan mobile number in E.164 format, for example +94712345678.');
      return;
    }
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress.street_address.trim() || !shippingAddress.city.trim() || !shippingAddress.postal_code.trim()) {
      setOrderError('Complete your contact and shipping details before placing the order.');
      return;
    }
    if (cartItems.length === 0) {
      setOrderError('Your cart is empty.');
      return;
    }

    placingOrderRef.current = true;
    setIsPlacingOrder(true);
    setOrderError('');
    setAddressSaveError('');
    setOrderMessage('');
    try {
      await getSignedInUser();
      const order = await createOrder({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: {
          recipient_name: customerName,
          phone_number: customerPhone,
          street_address: shippingAddress.street_address.trim(),
          city: shippingAddress.city.trim(),
          postal_code: shippingAddress.postal_code.trim(),
          country: shippingAddress.country.trim() || 'Sri Lanka',
        },
        items: cartItems.map((item) => {
          if (!item.size) throw new Error(`Choose a size for ${item.name} before checking out.`);
          return { productId: item.id, quantity: item.qty ?? 1, size: item.size };
        }),
      });
      clearCart();
      setCartItems([]);
      setOrderMessage(`Order ORD-${String(order.order_number).padStart(6, '0')} placed successfully.`);
      if (!selectedAddress && saveAddressForLater) {
        try {
          const savedAddress = await saveShippingAddress({
            ...shippingAddress,
            recipient_name: customerName,
            phone_number: customerPhone,
            street_address: shippingAddress.street_address.trim(),
            city: shippingAddress.city.trim(),
            postal_code: shippingAddress.postal_code.trim(),
            country: shippingAddress.country.trim() || 'Sri Lanka',
            is_default: addresses.length === 0,
          });
          setAddresses((current) => [...current, savedAddress]);
          setSelectedAddressId(savedAddress.id);
        } catch (error) {
          setAddressSaveError(error instanceof Error ? error.message : 'The order was placed, but this address could not be saved.');
        }
      }
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'The order could not be placed.');
    } finally {
      placingOrderRef.current = false;
      setIsPlacingOrder(false);
    }
  };

  const subtotal = calculateCartSubtotal(cartItems);
  const shippingFee = calculateShippingFee(subtotal);
  const grandTotal = subtotal + shippingFee;

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
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
                <input name="email" type="email" value={contactEmail} readOnly />
              </label>
            </form>

            <div className="co-section">
              <div className="co-section-head">
                <h2>Shipping Details</h2>
              </div>

              {addressesLoading ? <p className="co-loading" role="status"><LoaderCircle size={17} aria-hidden="true" /> Loading saved addresses...</p> : null}

              {!addressesLoading && addresses.length > 0 && (
                <label className="co-address-select-label">
                  Choose a saved address
                  <select className="co-address-select" value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)}>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.recipient_name} · {address.street_address}, {address.city}{address.is_default ? ' · Default' : ''}
                      </option>
                    ))}
                    <option value={NEW_ADDRESS}>Use a new shipping address</option>
                  </select>
                </label>
              )}

              {!addressesLoading && addresses.length === 0 && <p className="co-card-body">Add your shipping details to continue.</p>}

              {selectedAddress && !addressesLoading ? (
                <div className="co-card">
                  <div className="co-card-title">{selectedAddress.recipient_name} · {selectedAddress.phone_number}</div>
                  <div className="co-card-body">{selectedAddress.street_address}</div>
                  <div className="co-card-body">{selectedAddress.city}, {selectedAddress.postal_code}</div>
                  <div className="co-card-body">{selectedAddress.country}</div>
                </div>
              ) : null}

              {selectedAddressId === NEW_ADDRESS && !addressesLoading ? (
                <form className="co-form co-address-form" onSubmit={(event) => event.preventDefault()}>
                  <label>Recipient name<input autoComplete="name" value={addressForm.recipient_name} onChange={(event) => setAddressForm((current) => ({ ...current, recipient_name: event.target.value }))} required /></label>
                  <label>
                    Phone number
                    <input
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+94712345678"
                      pattern="\+947[0-9]{8}"
                      title="Use Sri Lankan E.164 format, for example +94712345678."
                      maxLength={12}
                      value={addressForm.phone_number}
                      onChange={(event) => setAddressForm((current) => ({ ...current, phone_number: event.target.value }))}
                      required
                    />
                  </label>
                  <label>Delivery address<input autoComplete="street-address" value={addressForm.street_address} onChange={(event) => setAddressForm((current) => ({ ...current, street_address: event.target.value }))} required /></label>
                  <div className="co-address-row">
                    <label>City<input autoComplete="address-level2" value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} required /></label>
                    <label>Postal code<input autoComplete="postal-code" value={addressForm.postal_code} onChange={(event) => setAddressForm((current) => ({ ...current, postal_code: event.target.value }))} required /></label>
                  </div>
                  <label>Country<input autoComplete="country-name" value={addressForm.country} onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))} required /></label>
                  <label className="co-save-address">
                    <input type="checkbox" checked={saveAddressForLater} onChange={(event) => setSaveAddressForLater(event.target.checked)} />
                    <span>Save this address to my profile for future purchases</span>
                  </label>
                </form>
              ) : null}
              {selectedAddress && !SRI_LANKAN_MOBILE_E164.test(selectedAddress.phone_number.trim()) && (
                <p className="co-error" role="alert">This saved address has an invalid phone number. Select or enter an address using +947XXXXXXXX format.</p>
              )}
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
                <div className="summary-row" key={`${item.id}-${item.size ?? 'no-size'}`}>
                  <span>{item.name}{item.size ? ` · ${item.size}` : ''} × {item.qty ?? 1}</span>
                  <span>{formatPrice(parseCartItemPrice(item.price) * (item.qty ?? 1))}</span>
                </div>
              ))}
              <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
              </div>
              {shippingFee > 0 && (
                <p className="summary-shipping-note">Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} for free delivery.</p>
              )}
              <div className="summary-total"><span>Grand total</span><span>{formatPrice(grandTotal)}</span></div>

              <div className="checkout-actions">
                <button className="btn-primary" type="button" onClick={() => void handlePlaceOrder()} disabled={isPlacingOrder || cartItems.length === 0 || addressesLoading}>
                  {isPlacingOrder && <LoaderCircle className="co-spinner" size={17} aria-hidden="true" />}
                  {isPlacingOrder ? 'Placing order...' : 'Place Order'}
                </button>
                {orderError && <p className="co-error" role="alert">{orderError}</p>}
                {addressSaveError && <p role="alert">{addressSaveError}</p>}
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
