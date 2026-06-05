/**
 * CartRecommendations — "Доповніть комплект"
 * Compact horizontal mini-cards inside CartDrawer.
 * Logic: lib/cart-recommendations.ts
 */
import { useRef } from 'react';
import { Plus, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { buildCartRecommendations, beltInKitMessage } from '../lib/cart-recommendations';
import { getProductCardTitle } from './ProductCard';
import { useIsDesktop } from '../hooks/useIsDesktop';

// ─── Layout tokens ────────────────────────────────────────────────────────────

interface CardTokens {
  cardWidth:    number;
  imageHeight:  number;
  px:           number;   // horizontal padding inside body
  pt:           number;   // top padding body
  pb:           number;   // bottom padding body
  gap:          number;   // body gap
  hintSize:     number;
  titleSize:    number;
  priceSize:    number;
  btnFontSize:  number;
  btnPadding:   string;
  btnRadius:    number;
  btnIconSize:  number;
  titleClamp:   number;   // line-clamp lines
}

const MOBILE_TOKENS: CardTokens = {
  cardWidth:   138,
  imageHeight: 106,
  px:          10,
  pt:          8,
  pb:          10,
  gap:         4,
  hintSize:    9,
  titleSize:   10,
  priceSize:   10.5,
  btnFontSize: 10,
  btnPadding:  '5px 0',
  btnRadius:   6,
  btnIconSize: 10,
  titleClamp:  2,
};

const DESKTOP_TOKENS: CardTokens = {
  cardWidth:   162,
  imageHeight: 128,
  px:          12,
  pt:          10,
  pb:          12,
  gap:         5,
  hintSize:    12,
  titleSize:   13,
  priceSize:   14,
  btnFontSize: 12,
  btnPadding:  '9px 0',
  btnRadius:   8,
  btnIconSize: 12,
  titleClamp:  3,
};

// ─── Rec image helpers ────────────────────────────────────────────────────────

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
  if (product.productType === 'belts' || product.productType === 'bags') return '#f5f5f5';
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
  if (product.productType === 'bags')  return 6;
  if (product.productType === 'belts') return 8;
  return 0;
}

// ─── Mini-card ────────────────────────────────────────────────────────────────

interface MiniCardProps {
  product:    Product;
  hint:       string;
  onAdd:      () => void;
  onNavigate: (href: string) => void;
  tokens:     CardTokens;
}

function MiniCard({ product, hint, onAdd, onNavigate, tokens: t }: MiniCardProps) {
  const image      = getRecImage(product);
  const imageBg    = getRecImageBg(product);
  const imageScale = getRecImageScale(product);
  const imgPad     = getImgPadding(product);
  const title      = getProductCardTitle(product);
  const href       = `/product/${product.id}`;

  const lightBg = product.productType === 'belts' || product.productType === 'bags';

  const allPrices = product.variants
    ? product.variants.flatMap(v =>
        v.offers?.map(o => o.price).filter((p): p is number => typeof p === 'number' && p > 0)
        ?? (v.price != null ? [v.price] : [product.price])
      )
    : [product.price];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const showFrom = maxPrice > minPrice;
  const priceLabel = showFrom
    ? `від ${minPrice.toLocaleString('uk-UA')} грн`
    : `${product.price.toLocaleString('uk-UA')} грн`;

  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
      style={{
        width: t.cardWidth,
        background: 'linear-gradient(160deg, #1D1D1D 0%, #181818 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
      }}
    >
      {/* Clickable area: image + title → navigates to product page */}
      <div
        role="link"
        tabIndex={0}
        aria-label={`Перейти до товару: ${title}`}
        onClick={() => onNavigate(href)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate(href); }}
        style={{ cursor: 'pointer', display: 'contents' }}
      >
        {/* Image */}
        <div
          className="w-full shrink-0 overflow-hidden relative transition-transform duration-200"
          style={{ height: t.imageHeight, background: imageBg }}
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain transition-transform duration-200"
            style={{
              padding: imgPad,
              transform: imageScale !== 1 ? `scale(${imageScale})` : undefined,
              transformOrigin: 'center center',
            }}
            loading="lazy"
          />
          {lightBg && (
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: 28,
                background: 'linear-gradient(to top, rgba(27,27,27,0.38) 0%, transparent 100%)',
              }}
            />
          )}
        </div>

        {/* Body top: hint + title */}
        <div
          className="flex flex-col"
          style={{ padding: `${t.pt}px ${t.px}px 0`, gap: t.gap }}
        >
          {hint && (
            <p
              className="font-inter leading-snug"
              style={{ fontSize: t.hintSize, color: 'rgba(255,255,255,0.35)', lineHeight: 1.35 }}
            >
              {hint}
            </p>
          )}
          <p
            className="font-inter font-bold leading-snug flex-1"
            style={{
              fontSize: t.titleSize,
              color: 'rgba(255,255,255,0.87)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: t.titleClamp,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </p>
        </div>
      </div>

      {/* Body bottom: price + button — not part of clickable area */}
      <div
        className="flex flex-col"
        style={{ padding: `${t.gap}px ${t.px}px ${t.pb}px`, gap: t.gap }}
      >
        <p
          className="font-unbounded font-black"
          style={{ fontSize: t.priceSize, color: '#FFFFFF', marginTop: 2 }}
        >
          {priceLabel}
        </p>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
          className="w-full flex items-center justify-center gap-1 font-inter font-bold text-white transition-all active:scale-[0.97]"
          style={{
            fontSize:     t.btnFontSize,
            padding:      t.btnPadding,
            borderRadius: t.btnRadius,
            marginTop:    2,
            background:   'linear-gradient(135deg, rgba(155,18,24,0.92) 0%, rgba(218,32,38,0.88) 100%)',
            border:       '1px solid rgba(239,68,68,0.18)',
          }}
        >
          <Plus size={t.btnIconSize} strokeWidth={2.5} />
          Додати
        </button>
      </div>
    </div>
  );
}

// ─── Block ────────────────────────────────────────────────────────────────────

export default function CartRecommendations() {
  const { items, addItem, closeCart } = useCart();
  const [, navigate] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();

  function handleNavigate(href: string) {
    closeCart();
    navigate(href);
  }
  const tokens    = isDesktop ? DESKTOP_TOKENS : MOBILE_TOKENS;

  const { data: catalog = [] } = useQuery<Product[]>({
    queryKey: ['all-products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (items.length === 0 || catalog.length === 0) return null;

  const recs = buildCartRecommendations(items, catalog, 3);
  if (recs.length === 0) return null;

  const kitMsg = beltInKitMessage(items);

  // On desktop: 3 cards × 162px + 2 × 14px gap = 514px > drawer (~400px inner)
  // → still allow horizontal scroll but cards never shrink below cardWidth
  const desktopGap = 14;
  const mobileGap  = 10;
  const gap        = isDesktop ? desktopGap : mobileGap;

  return (
    <div
      className="px-6 py-4 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-0.5">
        <Package size={isDesktop ? 14 : 12} className="text-[#E8232A] flex-shrink-0" />
        <p
          className="font-unbounded font-bold text-white"
          style={{ fontSize: isDesktop ? 12 : 10.5 }}
        >
          Доповніть комплект
        </p>
      </div>

      {/* Subtitle */}
      <p
        className="font-inter mb-3"
        style={{ fontSize: isDesktop ? 11 : 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}
      >
        {kitMsg ?? 'Товари, які часто беруть разом із вашим замовленням'}
      </p>

      {/* Scrollable row */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto"
          style={{
            gap,
            paddingRight: recs.length >= 3 ? 8 : 0,
            paddingBottom: 4,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
          }}
        >
          {recs.map(({ product, hint }) => (
            <div
              key={product.id}
              style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <MiniCard
                product={product}
                hint={hint}
                tokens={tokens}
                onAdd={() => addItem(product, product.sizes[0] ?? '')}
                onNavigate={handleNavigate}
              />
            </div>
          ))}
        </div>

        {/* Right fade */}
        {recs.length >= 3 && (
          <div
            className="absolute right-0 top-0 bottom-1 w-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, rgba(15,15,15,0.88) 0%, transparent 100%)',
            }}
          />
        )}
      </div>
    </div>
  );
}
