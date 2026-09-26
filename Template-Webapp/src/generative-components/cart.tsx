import React, { useEffect, useState } from 'react';
import './cart.css';
import { getCart, removeItem, clearCart } from '../services/cartService';

type Item = {
  id: string;
  name: string;
  price: string;
  image?: string;
  qty?: number;
};

const Cart: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

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

  const handleProceed = () => {
    setOpen(false);
    window.location.hash = '#checkout';
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
                <div className="ci-meta">{it.qty} × {it.price}</div>
              </div>
              <button className="ci-remove" onClick={() => handleRemove(it.id)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <button className="btn-ghost btn-clear" onClick={() => { clearCart(); setItems([]); }}>Clear</button>
          <button className="btn-primary" onClick={handleProceed} disabled={items.length === 0}>Proceed to checkout</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
