import type React from 'react';
import { useCart } from '../context/CartContext';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import CartRecommendations from './CartRecommendations';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export default function CartDrawer() {
  const { items, count, total, isOpen, closeCart, removeItem, updateQty } = useCart();

  // Prevent background page scroll while cart is open (iOS-safe)
  useBodyScrollLock(isOpen);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-250 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.74)' }}
        onClick={closeCart}
      />

      {/* Drawer — 91vw on mobile so ~9% of the page peeks on the left */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[#0F0F0F] transition-transform ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          width: 'min(93vw, 448px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.55)',
          transitionDuration: '260ms',
        }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2E2E2E]">
          <div className="flex items-center gap-3">
            <ShoppingBag size={22} className="text-[#E8232A]" />
            <h2 className="font-unbounded text-white text-base font-black">Кошик</h2>
            {count > 0 && (
              <span className="bg-[#E8232A] text-white text-xs font-bold font-inter w-6 h-6 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="w-9 h-9 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#E8232A] rounded flex items-center justify-center transition-all">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Items — overscroll-contain stops scroll chaining to body on iOS */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <ShoppingBag size={48} className="text-[#2E2E2E] mb-4" />
              <p className="font-unbounded text-white text-sm font-bold mb-2">Кошик порожній</p>
              <p className="font-inter text-[#A0A0A0] text-sm mb-6">Додайте товари з каталогу</p>
              <button
                onClick={closeCart}
                className="bg-[#E8232A] text-white font-bold font-inter text-sm px-6 py-3 rounded"
              >
                Перейти до каталогу
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={`${item.product.id}-${item.size}-${item.color ?? ''}`} className="flex gap-4 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-4">
                <div className="w-[88px] h-[88px] flex-[0_0_88px] rounded-xl overflow-hidden bg-[#111] shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover object-[center_20%] block"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-[#A0A0A0] text-xs mb-0.5">{item.product.brand}</p>
                  <p className="font-inter text-white text-sm font-semibold leading-tight mb-1 line-clamp-2">
                    {item.product.name}
                  </p>
                  <div className="flex gap-3 mb-3">
                    {item.color && (
                      <p className="font-inter text-[#A0A0A0] text-xs">Колір: <span className="text-white font-medium">{item.color}</span></p>
                    )}
                    <p className="font-inter text-[#A0A0A0] text-xs">Розмір: <span className="text-white font-medium">{item.size}</span></p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Qty control */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.product.id, item.size, item.qty - 1, item.color)}
                        className="w-7 h-7 bg-[#242424] border border-[#2E2E2E] hover:border-[#E8232A] rounded flex items-center justify-center transition-all"
                      >
                        <Minus size={12} className="text-white" />
                      </button>
                      <span className="font-inter text-white text-sm font-bold w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.size, item.qty + 1, item.color)}
                        className="w-7 h-7 bg-[#242424] border border-[#2E2E2E] hover:border-[#E8232A] rounded flex items-center justify-center transition-all"
                      >
                        <Plus size={12} className="text-white" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-unbounded text-white text-sm font-black">
                        {(item.unitPrice * item.qty).toLocaleString('uk-UA')} грн
                      </span>
                      <button
                        onClick={() => removeItem(item.product.id, item.size, item.color)}
                        className="text-[#A0A0A0] hover:text-[#E8232A] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recommendations */}
        {items.length > 0 && <CartRecommendations />}

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 pt-5 pb-6 border-t border-[#2E2E2E]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-inter text-[#A0A0A0] text-sm">Разом:</span>
              <span className="font-unbounded text-white text-xl font-black">{total.toLocaleString('uk-UA')} грн</span>
            </div>
            <Link href="/checkout" onClick={closeCart}>
              <button className="w-full bg-[#E8232A] hover:bg-[#C41E24] text-white font-bold font-inter text-base py-4 rounded flex items-center justify-center gap-2 transition-all">
                Оформити замовлення <ArrowRight size={20} />
              </button>
            </Link>
            <p className="font-inter text-[#606060] text-xs text-center mt-3">
              Доставка Новою поштою · Оплата при отриманні або передоплата
            </p>
          </div>
        )}
      </div>
    </>
  );
}
