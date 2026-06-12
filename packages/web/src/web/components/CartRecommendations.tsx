/**
 * CartRecommendations — "Доповніть комплект"
 * Compact upsell inside CartDrawer.
 *
 * Mobile  → compact horizontal rows (image + name + price + + button)
 *           collapsed by default if ≥ 2 recs; toggle to expand
 * Desktop → small vertical mini-cards in scrollable row (reduced size)
 *           if only 1 rec → single compact row instead of card
 *
 * Logic: lib/cart-recommendations.ts (unchanged)
 */
import { useState } from 'react';
import { Plus, Package, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { buildCartRecommendations, beltInKitMessage } from '../lib/cart-recommendations';
import { getProductCardTitle } from './ProductCard';
import { useIsDesktop } from '../hooks/useIsDesktop';

// ─── Image helpers (unchanged) ────────────────────────────────────────────────

const BAD_IMG_PATTERNS = /size.?chart|size_chart|dimension|masstab|chart|tabelle/i;

function getRecImage(product: Product): string {
  const allImages: string[] = [
    product.image,
    ...(product.images ?? []),
    ...(product.variants?.flatMap(v => v.images) ?? []),
  ].filter(Boolean);

  const clean = allImages.filter(u => !BAD_IMG_PATTERNS.test(u));

  if (product.productType === 'belts') {
    if (product.image && !BAD_IMG_PATTERNS.test(product.image)) return product.image;
    return clean[0] ?? product.image;
  }
  if (product.productType === 'bags') {
    if (product.image && !BAD_IMG_PATTERNS.test(product.image)) return product.image;
    const v0 = product.variants?.[0]?.images?.[0];
    if (v0 && !BAD_IMG_PATTERNS.test(v0)) return v0;
    return clean[0] ?? product.image;
  }
  const v0 = product.variants?.[0]?.images?.[0];
  if (v0 && !BAD_IMG_PATTERNS.test(v0)) return v0;
  return product.image;
}

function getRecImageBg(product: Product): string {
  if (product.productType === 'belts' || product.productType === 'bags') return '#f0f0f0';
  return '#1A1A1A';
}

function getRecImageScale(product: Product): number {
  if (product.productType !== 'bags') return 1;
  const isDrawstring = /рюкзак.?мішок/i.test(product.name);
  const isBackpack   = /рюкзак/i.test(product.name) && !isDrawstring;
  if (isDrawstring) return 1.18;
  if (isBackpack)   return 1.12;
  return 1;
}

function getImgPadding(product: Product): number {
  if (product.productType === 'bags')  return 4;
  if (product.productType === 'belts') return 6;
  return 0;
}

function getPriceLabel(product: Product): string {
  const allPrices = product.variants
    ? product.variants.flatMap(v =>
        v.offers?.map(o => o.price).filter((p): p is number => typeof p === 'number' && p > 0)
        ?? (v.price != null ? [v.price] : [product.price])
      )
    : [product.price];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const showFrom = maxPrice > minPrice;
  return showFrom
    ? `від ${minPrice.toLocaleString('uk-UA')} грн`
    : `${product.price.toLocaleString('uk-UA')} грн`;
}

// ─── Compact Row (used on mobile always; on desktop when only 1 rec) ──────────

interface RowRecProps {
  product:    Product;
  hint:       string;
  onAdd:      () => void;
  onNavigate: (href: string) => void;
  added:      boolean;
}

function RowRec({ product, hint, onAdd, onNavigate, added }: RowRecProps) {
  const image      = getRecImage(product);
  const imageBg    = getRecImageBg(product);
  const imageScale = getRecImageScale(product);
  const imgPad     = getImgPadding(product);
  const title      = getProductCardTitle(product);
  const priceLabel = getPriceLabel(product);
  const href       = `/product/${product.id}`;

  return (
    <div
      className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Thumbnail */}
      <div
        className="shrink-0 rounded-lg overflow-hidden cursor-pointer"
        style={{ width: 48, height: 48, background: imageBg }}
        onClick={() => onNavigate(href)}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-contain"
          style={{
            padding: imgPad,
            transform: imageScale !== 1 ? `scale(${imageScale})` : undefined,
            transformOrigin: 'center center',
          }}
          loading="lazy"
        />
      </div>

      {/* Name + hint + price */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onNavigate(href)}
      >
        {hint && (
          <p className="font-inter leading-none mb-0.5" style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.32)' }}>
            {hint}
          </p>
        )}
        <p
          className="font-inter font-semibold leading-snug"
          style={{
            fontSize: 11.5,
            color: 'rgba(255,255,255,0.88)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </p>
        <p className="font-unbounded font-black mt-0.5" style={{ fontSize: 11, color: '#fff' }}>
          {priceLabel}
        </p>
      </div>

      {/* Add button */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); if (!added) onAdd(); }}
        className="shrink-0 flex items-center justify-center font-inter font-bold text-white transition-all active:scale-95"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          fontSize: 11,
          background: added
            ? '#16a34a'
            : 'linear-gradient(135deg, rgba(155,18,24,0.92) 0%, rgba(218,32,38,0.88) 100%)',
          border: '1px solid rgba(239,68,68,0.18)',
          flexShrink: 0,
        }}
        aria-label={added ? 'Додано' : 'Додати до кошика'}
      >
        {added ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
      </button>
    </div>
  );
}

// ─── Desktop Mini-card (only used when ≥ 2 recs on desktop) ──────────────────

interface MiniCardProps {
  product:    Product;
  hint:       string;
  onAdd:      () => void;
  onNavigate: (href: string) => void;
  added:      boolean;
}

function MiniCard({ product, hint, onAdd, onNavigate, added }: MiniCardProps) {
  const image      = getRecImage(product);
  const imageBg    = getRecImageBg(product);
  const imageScale = getRecImageScale(product);
  const imgPad     = getImgPadding(product);
  const title      = getProductCardTitle(product);
  const priceLabel = getPriceLabel(product);
  const href       = `/product/${product.id}`;

  // Compact desktop token values (smaller than before)
  const IMG_H   = 88;
  const WIDTH   = 140;
  const PX      = 10;

  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
      style={{
        width: WIDTH,
        background: 'linear-gradient(160deg, #1D1D1D 0%, #181818 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
      }}
    >
      {/* Image — clickable */}
      <div
        className="w-full shrink-0 overflow-hidden cursor-pointer relative"
        style={{ height: IMG_H, background: imageBg }}
        onClick={() => onNavigate(href)}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-contain"
          style={{
            padding: imgPad,
            transform: imageScale !== 1 ? `scale(${imageScale})` : undefined,
            transformOrigin: 'center center',
          }}
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col" style={{ padding: `8px ${PX}px 10px`, gap: 4 }}>
        {hint && (
          <p className="font-inter leading-snug" style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.32)', lineHeight: 1.3 }}>
            {hint}
          </p>
        )}
        <p
          className="font-inter font-semibold leading-snug cursor-pointer"
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.87)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          onClick={() => onNavigate(href)}
        >
          {title}
        </p>
        <p className="font-unbounded font-black" style={{ fontSize: 11, color: '#fff', marginTop: 2 }}>
          {priceLabel}
        </p>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); if (!added) onAdd(); }}
          className="w-full flex items-center justify-center gap-1 font-inter font-bold text-white transition-all active:scale-[0.97] mt-1"
          style={{
            fontSize:     11,
            padding:      '7px 0',
            borderRadius: 7,
            background:   added
              ? '#16a34a'
              : 'linear-gradient(135deg, rgba(155,18,24,0.92) 0%, rgba(218,32,38,0.88) 100%)',
            border:       '1px solid rgba(239,68,68,0.18)',
          }}
        >
          {added
            ? <><Check size={11} strokeWidth={2.5} /> Додано</>
            : <><Plus size={11} strokeWidth={2.5} /> Додати</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main block ───────────────────────────────────────────────────────────────

export default function CartRecommendations() {
  const { items, addItem, closeCart } = useCart();
  const [, navigate] = useLocation();
  const isDesktop = useIsDesktop();

  // mobile: expanded by default, user can collapse manually
  const [expanded, setExpanded] = useState(true);

  function handleNavigate(href: string) {
    closeCart();
    navigate(href);
  }

  const { data: catalog = [] } = useQuery<Product[]>({
    queryKey: ['all-products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (items.length === 0 || catalog.length === 0) return null;

  const recs = buildCartRecommendations(items, catalog, 3);
  if (recs.length === 0) return null;

  const kitMsg = beltInKitMessage(items);

  // "added" = product actually present in cart right now
  const cartProductIds = new Set(items.map(i => i.product.id));

  function handleAdd(product: Product) {
    addItem(product, product.sizes[0] ?? '');
  }

  // ── DESKTOP ──────────────────────────────────────────────────────────────
  if (isDesktop) {
    // 1 rec → compact row; ≥2 recs → small cards in scroll row
    const showRows = recs.length === 1;

    return (
      <div
        className="px-5 py-3.5 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <Package size={12} className="text-[#E8232A] flex-shrink-0" />
          <p className="font-unbounded font-bold text-white" style={{ fontSize: 11 }}>
            Доповніть комплект
          </p>
        </div>
        <p className="font-inter mb-3" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
          {kitMsg ?? 'Часто беруть разом із вашим замовленням'}
        </p>

        {showRows ? (
          // Single rec → row layout
          <div>
            {recs.map(({ product, hint }) => (
              <RowRec
                key={product.id}
                product={product}
                hint={hint}
                added={cartProductIds.has(product.id)}
                onAdd={() => handleAdd(product)}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        ) : (
          // Multiple recs → compact cards row
          <div className="relative">
            <div
              className="flex overflow-x-auto"
              style={{
                gap: 10,
                paddingBottom: 4,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
              }}
            >
              {recs.map(({ product, hint }) => (
                <div key={product.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                  <MiniCard
                    product={product}
                    hint={hint}
                    added={cartProductIds.has(product.id)}
                    onAdd={() => handleAdd(product)}
                    onNavigate={handleNavigate}
                  />
                </div>
              ))}
            </div>
            {/* Right fade if overflow */}
            {recs.length >= 3 && (
              <div
                className="absolute right-0 top-0 bottom-1 w-8 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgba(15,15,15,0.88) 0%, transparent 100%)' }}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // ── MOBILE ───────────────────────────────────────────────────────────────
  // Always compact rows; collapsed if ≥ 2 recs
  const collapsible = recs.length >= 2;
  const isOpen = !collapsible || expanded;

  return (
    <div
      className="px-4 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.07)', paddingTop: collapsible ? 0 : 12, paddingBottom: isOpen ? 4 : 0 }}
    >
      {/* Header row — acts as toggle on mobile when collapsible */}
      <div
        className={`flex items-center justify-between py-3 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setExpanded(v => !v)}
      >
        <div className="flex items-center gap-1.5">
          <Package size={11} className="text-[#E8232A] flex-shrink-0" />
          <p className="font-unbounded font-bold text-white" style={{ fontSize: 10 }}>
            Доповніть комплект
          </p>
          {collapsible && !isOpen && (
            <span
              className="font-inter ml-1"
              style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)' }}
            >
              · {recs.length} товари
            </span>
          )}
        </div>
        {collapsible && (
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>
            {isOpen
              ? <ChevronUp size={14} strokeWidth={2} />
              : <ChevronDown size={14} strokeWidth={2} />}
          </div>
        )}
      </div>

      {/* Content — shown when open */}
      {isOpen && (
        <div style={{ paddingBottom: 8 }}>
          {!collapsible && (
            <p className="font-inter mb-2" style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.32)', lineHeight: 1.4 }}>
              {kitMsg ?? 'Часто беруть разом із вашим замовленням'}
            </p>
          )}
          {recs.map(({ product, hint }) => (
            <RowRec
              key={product.id}
              product={product}
              hint={hint}
              added={cartProductIds.has(product.id)}
              onAdd={() => handleAdd(product)}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
