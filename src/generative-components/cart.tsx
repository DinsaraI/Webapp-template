import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Minus, Plus, Trash2 } from 'lucide-react';
import './cart.css';
import { getCart, removeItem, clearCart, updateQuantity } from '../services/cartService';
import type { CartItem } from '../services/cartService';
import { supabase } from '../supabaseClient';
import { setCheckoutRedirect } from '../services/checkoutRedirect';
import { calculateCartSubtotal, calculateShippingFee, FREE_SHIPPING_THRESHOLD } from '../services/pricing';

const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
}).format(price);

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const onUpdated = () => setItems(getCart());
    onUpdated();
    window.addEventListener('a2w:cart-updated', onUpdated as EventListener);
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener('a2w:cart-open', onOpen as EventListener);
    window.addEventListener('a2w:cart-close', onClose as EventListener);
    return () => {
      window.removeEventListener('a2w:cart-updated', onUpdated as EventListener);
      window.removeEventListener('a2w:cart-open', onOpen as EventListener);
      window.removeEventListener('a2w:cart-close', onClose as EventListener);
    };
  }, []);

  const handleRemove = (id: string, size?: string) => {
    removeItem(id, size);
    setItems(getCart());
  };

  const handleQuantityChange = (id: string, size: string | undefined, quantity: number) => {
    updateQuantity(id, size, quantity);
    setItems(getCart());
  };

  const handleProceed = async () => {
    setCheckoutError('');
    setCheckingOut(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && error.name !== 'AuthSessionMissingError') {
        throw error;
      }

      setOpen(false);
      if (!user) {
        setCheckoutRedirect();
        navigate('/login');
        return;
      }
      navigate('/checkout');
    } catch {
      setCheckoutError('We could not verify your account. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const subtotal = calculateCartSubtotal(items);
  const shippingFee = calculateShippingFee(subtotal);

  if (!open) return null;

  return (
    <div className="cart-overlay" onClick={() => setOpen(false)}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-head">
          <h3>Your Cart</h3>
          <button type="button" className="cart-close" onClick={() => setOpen(false)} aria-label="Close cart">×</button>
        </div>

        <div className="cart-items">
          {items.length === 0 && <div className="empty">Your cart is empty.</div>}
          {items.map((it) => (
            <div className="cart-item" key={`${it.id}-${it.size ?? 'no-size'}`}>
              <div className="ci-media" style={it.image ? { backgroundImage: `url(${it.image})` } : undefined} />
              <div className="ci-body">
                <div className="ci-title">{it.name}</div>
                <div className="ci-meta">{it.price}</div>
                {it.size && <div className="ci-meta">Size: {it.size}</div>}
                <div className="ci-quantity" aria-label={`Quantity for ${it.name}${it.size ? `, size ${it.size}` : ''}`}>
                  <button type="button" onClick={() => handleQuantityChange(it.id, it.size, (it.qty ?? 1) - 1)} disabled={(it.qty ?? 1) <= 1} aria-label={`Decrease ${it.name} quantity`}>
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span>{it.qty ?? 1}</span>
                  <button type="button" onClick={() => handleQuantityChange(it.id, it.size, (it.qty ?? 1) + 1)} disabled={(it.qty ?? 1) >= 20} aria-label={`Increase ${it.name} quantity`}>
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <button className="ci-remove" onClick={() => handleRemove(it.id, it.size)} aria-label={`Remove ${it.name}${it.size ? `, size ${it.size}` : ''}`} title="Remove item"><Trash2 size={16} aria-hidden="true" /></button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="cart-summary" aria-label="Cart totals">
            <div><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div>
              <span>Delivery</span>
              <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
            </div>
            <div className="cart-grand-total"><strong>Total</strong><strong>{formatPrice(subtotal + shippingFee)}</strong></div>
            {shippingFee > 0 && (
              <p>Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} for free delivery.</p>
            )}
          </div>
        )}

        <div className="cart-footer">
          <button className="btn-ghost btn-clear" onClick={() => { clearCart(); setItems([]); }}>Clear</button>
          <button className="btn-primary" onClick={() => void handleProceed()} disabled={items.length === 0 || checkingOut}>
            {checkingOut && <LoaderCircle className="cart-spinner" size={16} aria-hidden="true" />}
            {checkingOut ? 'Checking account...' : 'Proceed to checkout'}
          </button>
        </div>
        {checkoutError && <p className="cart-error" role="alert">{checkoutError}</p>}
      </div>
    </div>
  );
};

export default Cart;
