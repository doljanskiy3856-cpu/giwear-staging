import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Product } from '../data/products';

export type CartItem = {
  product: Product;
  size: string;
  qty: number;
  /** Selected color name (e.g. "Синій") */
  color?: string;
  /** Actual unit price for the selected color+size offer */
  unitPrice: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, size: string, color?: string, unitPrice?: number) => void;
  removeItem: (id: string, size: string, color?: string) => void;
  updateQty: (id: string, size: string, qty: number, color?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product, size: string, color?: string, unitPrice?: number) => {
    const price = unitPrice ?? product.price;
    setItems(prev => {
      const existing = prev.find(
        i => i.product.id === product.id && i.size === size && (i.color ?? '') === (color ?? '')
      );
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.size === size && (i.color ?? '') === (color ?? '')
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, { product, size, qty: 1, color, unitPrice: price }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string, size: string, color?: string) => {
    setItems(prev => prev.filter(
      i => !(i.product.id === id && i.size === size && (i.color ?? '') === (color ?? ''))
    ));
  }, []);

  const updateQty = useCallback((id: string, size: string, qty: number, color?: string) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(
        i => !(i.product.id === id && i.size === size && (i.color ?? '') === (color ?? ''))
      ));
    } else {
      setItems(prev =>
        prev.map(i =>
          i.product.id === id && i.size === size && (i.color ?? '') === (color ?? '')
            ? { ...i, qty }
            : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, count, total, isOpen, openCart, closeCart, addItem, removeItem, updateQty, clearCart }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, count, total, isOpen]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
