import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Minus, Plus, Trash2 } from 'lucide-react';
import './cart.css';
import { getCart, removeItem, clearCart, updateQuantity } from '../services/cartService';
import { supabase } from '../supabaseClient';
import { setCheckoutRedirect } from '../services/checkoutRedirect';

type Item = {
  id: string;
  name: string;
  price: string;
  image?: string;
  qty?: number;
};

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
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

  const handleRemove = (id: string) => {
    removeItem(id);
    setItems(getCart());
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
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

  if (!open) return null;

  return (
    <div className="cart-overlay" onClick={() => setOpen(false)}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-head">
          <h3>Your Cart</h3>
          <button className="cart-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="cart-items">
          {items.length === 0 && <div className="empty">Your cart is empty.</div>}
          {items.map((it) => (
            <div className="cart-item" key={it.id}>
              <div className="ci-media" style={it.image ? { backgroundImage: `url(${it.image})` } : undefined} />
              <div className="ci-body">
                <div className="ci-title">{it.name}</div>
                <div className="ci-meta">{it.price}</div>
                <div className="ci-quantity" aria-label={`Quantity for ${it.name}`}>
                  <button type="button" onClick={() => handleQuantityChange(it.id, (it.qty ?? 1) - 1)} disabled={(it.qty ?? 1) <= 1} aria-label={`Decrease ${it.name} quantity`}>
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span>{it.qty ?? 1}</span>
                  <button type="button" onClick={() => handleQuantityChange(it.id, (it.qty ?? 1) + 1)} disabled={(it.qty ?? 1) >= 20} aria-label={`Increase ${it.name} quantity`}>
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <button className="ci-remove" onClick={() => handleRemove(it.id)} aria-label={`Remove ${it.name}`} title="Remove item"><Trash2 size={16} aria-hidden="true" /></button>
            </div>
          ))}
        </div>

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
