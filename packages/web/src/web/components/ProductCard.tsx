import { useState, memo } from 'react';
import { Link } from 'wouter';
import { ShoppingBag, Check } from 'lucide-react';
import type { Product, SportSlug } from '../data/products';
import { useCart } from '../context/CartContext';
import { getKitResult } from '../lib/belt-rules';
import { detectFit, isFitVariantProduct } from '../lib/fit-utils';

// ─── Brand label ──────────────────────────────────────────────────────────────

// Inject dot-pulse keyframe once
let _dotPulseInjected = false;
function ensureDotPulseCss() {
  if (_dotPulseInjected || typeof document === 'undefined') return;
  _dotPulseInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes gi-dot-pulse {
      0%,100% { transform: scale(1);    opacity: 0.75; box-shadow: 0 0 0px 0px rgba(232,35,42,0); }
      50%      { transform: scale(1.12); opacity: 1;    box-shadow: 0 0 4px 1px rgba(232,35,42,0.35); }
    }
    @media (prefers-reduced-motion: reduce) {
      .gi-dot-pulse { animation: none !important; }
    }
  `;
  document.head.appendChild(s);
}

const BRAND_COLOR: Record<string, string> = {
  'BUDOGI':     '#C83A3A',
  'KINTAYO':    'rgba(255,255,255,0.72)',
  'IPPON GEAR': 'rgba(255,255,255,0.72)',
  'IPPONGEAR':  'rgba(255,255,255,0.72)',
};
const BRAND_WEIGHT: Record<string, number> = {
  'BUDOGI': 800, 'KINTAYO': 700, 'IPPON GEAR': 700, 'IPPONGEAR': 700,
};

function normBrandKey(brand: string): string {
  return brand.toUpperCase().replace(/\s+/g, ' ').trim();
}

function BrandLogo({ brand }: { brand: string }) {
  ensureDotPulseCss();
  const key    = normBrandKey(brand);
  const color  = BRAND_COLOR[key]  ?? 'rgba(255,255,255,0.68)';
  const weight = BRAND_WEIGHT[key] ?? 600;
  const label  = key === 'IPPONGEAR' ? 'IPPON GEAR' : brand.toUpperCase();

  return (
    <div style={{
      marginBottom: '5px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
    }}>
      {/* Red dot — slow premium pulse, only this element animates */}
      <span
        className="gi-dot-pulse"
        style={{
          display: 'inline-block',
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: '#E8232A',
          flexShrink: 0,
          animation: 'gi-dot-pulse 2.5s ease-in-out infinite',
        }}
      />
      <span style={{
        color,
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        fontWeight: weight,
        letterSpacing: '0.06em',
        lineHeight: 1,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  );
}

/**
/**
 * Returns kit info for the active variant — used for badges on card.
 */
function getActiveKit(product: Product, activeColor: string) {
  if (product.productType !== 'kimono' && product.productType !== 'uniform') {
    return { showBadge: false, hasGift: false };
  }
  const kit = getKitResult({
    brand:    product.brand,
    sportSlug: product.sportSlug,
    color:    activeColor || product.color,
    density:  product.density,
  });
  return {
    showBadge: kit.showBadge,
    hasGift:   kit.gifts.length > 0,
  };
}

interface Props {
  product: Product;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Format price with space-thousands separator + "грн" suffix. */
export function formatPrice(n: number): string {
  // toLocaleString with uk-UA already uses non-breaking space as thousands separator
  return `${n.toLocaleString('uk-UA')} грн`;
}

/** Normalize density string to "350 гр/м²" form. */
function normDensity(raw: string): string {
  if (!raw) return '';
  const m = raw.match(/(\d+)\s*(?:гр[./]?[мm]\.?(?:кв\.?|²)?|г\/м²)/i);
  return m ? `${m[1]} гр/м²` : '';
}

/** Extract model/series name from raw YML name for known brands. */
function extractSeries(name: string, brandUpper: string): string {
  if (brandUpper === 'KINTAYO') {
    // TM "Kintayo" Koka / TM "Kintayo" Yuko / TM "Kintayo" Wazari
    const m = name.match(/[Kk]intayo["»]?\s+(?!серія|,)([A-Za-z][A-Za-z0-9]+)/);
    if (m) return m[1].toUpperCase(); // KOKA, YUKO, WAZARI
    return '';
  }
  if (brandUpper === 'BUDOGI') {
    // "серія BEGINNER" / "серія ADVANCED" / "серія PRO"
    const m = name.match(/серія\s+([A-Z]+)/i);
    if (m) return m[1].toUpperCase();
    return '';
  }
  if (brandUpper === 'IPPON GEAR' || brandUpper === 'IPPONGEAR') {
    // Extract model: FUTURE 2 / BASIC 2 / ULTRALIGHT / LEGEND 2 / NXT / FUTURE 2.0 PINK!
    // Stop before: numeric size (160см), clothing size (XS/S/M/L/XL/2XL/3XL/4XL/XXL), comma, paren
    const m = name.match(/IPPON\s*GEAR\s+([A-Z][A-Z0-9.\s!PINK]+?)(?:\s+(?:4XL|3XL|2XL|XXL|XXXL|XXXXL|XL|XS|[SML])\s*$|\s+\d{2,3}(?:см|cm|\s|$)|\s*[,(]|\s+\d+\s*$|$)/i);
    if (m) return m[1].replace(/\s+/g, ' ').trim().toUpperCase();
    return '';
  }
  return '';
}

/** Detect gender/target audience from YML name. */
function extractGender(name: string): string {
  const n = name.toLowerCase();
  if (/для дівчаток/.test(n)) return 'для дівчаток';
  if (/для хлопчиків/.test(n)) return 'для хлопчиків';
  if (/для дівчат\/жінок|для жінок/.test(n)) return 'для жінок';
  if (/для хлопців\/чоловіків|для чоловіків/.test(n)) return 'для чоловіків';
  if (/для дівчат(?!\/)/.test(n)) return 'для дівчат';
  return '';
}

const KIMONO_TYPE_PREFIX: Record<SportSlug, string> = {
  karate:           'Кімоно для карате',
  judo:             'Кімоно для дзюдо',
  bjj:              'Кімоно для джиу-джитсу',
  grappling:        'Кімоно для грепплінгу',
  sambo:            'Форма для самбо',
  aikido:           'Кімоно для айкідо',
  rukopashnyy_biy:  'Кімоно для рукопашного бою',
  boyovyi_khortyng: 'Форма для хортингу',
  uncategorized:    'Кімоно',
};

const SPORT_LABEL: Record<SportSlug, string> = {
  karate:           'карате',
  judo:             'дзюдо',
  bjj:              'джиу-джитсу',
  grappling:        'грепплінгу',
  sambo:            'самбо',
  aikido:           'айкідо',
  rukopashnyy_biy:  'рукопашного бою',
  boyovyi_khortyng: 'хортингу',
  uncategorized:    '',
};

/**
 * Build a clean, store-friendly product card title (legacy — used for alt text).
 */
export function getProductCardTitle(product: Product, activeName?: string): string {
  const parts = getProductCardParts(product, activeName);
  return [parts.model, parts.typeLabel, parts.metaLine].filter(Boolean).join(' · ');
}

/**
 * Structured card parts for the new 3-line layout:
 *   model     — "IPPON GEAR ULTRALIGHT" / "BUDOGI BEGINNER" / "KINTAYO WAZARI"
 *   typeLabel — "Кімоно для дзюдо" / "Дитяче кімоно для дзюдо"
 *   metaLine  — "Slim Fit · 600 г/м²" / "Women · IJF" / "350 г/м²" / null
 */
export interface CardParts {
  model: string;
  typeLabel: string;
  metaLine: string | null;
}

export function getProductCardParts(product: Product, activeName?: string): CardParts {
  const { productType, sportSlug, brand, density, isChildren } = product;
  // For belts: use activeName so the color in title updates when swatch changes
  const name = (productType === 'belts' && activeName) ? activeName : product.name;
  const brandU = brand.toUpperCase();
  const series = extractSeries(name, brandU);
  const gender = extractGender(name);
  const dens = normDensity(density);

  // ── KIMONO / UNIFORM ──────────────────────────────────────────────────────
  if (productType === 'kimono' || productType === 'uniform') {
    const sportTypeBase = KIMONO_TYPE_PREFIX[sportSlug] || 'Кімоно';
    const childPrefix = isChildren ? 'Дитяче ' : '';
    const lc = (s: string) => s[0].toLowerCase() + s.slice(1);
    const typeLabel = childPrefix
      ? `${childPrefix}${lc(sportTypeBase)}`
      : sportTypeBase;

    if (brandU === 'KINTAYO') {
      const model = series ? `KINTAYO ${series}` : 'KINTAYO';
      const metaLine = dens || null;
      return { model, typeLabel, metaLine };
    }

    if (brandU === 'BUDOGI') {
      const model = series ? `BUDOGI ${series}` : 'BUDOGI';
      const metaParts: string[] = [];
      if (gender) metaParts.push(gender);
      if (dens) metaParts.push(dens);
      return { model, typeLabel, metaLine: metaParts.join(' · ') || null };
    }

    if (brandU === 'IPPON GEAR' || brandU === 'IPPONGEAR') {
      const licensed = /ліцензійн/i.test(name);
      const licPrefix = licensed ? 'Ліцензійне ' : '';
      const fullTypeLabel = licPrefix
        ? `${licPrefix}${lc(typeLabel)}`
        : typeLabel;
      // model: "IPPON GEAR ULTRALIGHT" / "IPPON GEAR LEGEND 2 IJF"
      let modelCore = series ? `IPPON GEAR ${series}` : 'IPPON GEAR';
      if (/ijf|approved/i.test(name) && !/IJF/.test(modelCore)) {
        modelCore += ' IJF';
      }
      const metaParts: string[] = [];
      // fit label added separately in render — skip here to avoid duplication
      if (gender && !isChildren) metaParts.push(gender);
      if (dens) metaParts.push(dens);
      return { model: modelCore, typeLabel: fullTypeLabel, metaLine: metaParts.join(' · ') || null };
    }

    // Generic fallback
    const model = series ? `${brand.toUpperCase()} ${series}` : brand.toUpperCase();
    const metaParts: string[] = [];
    if (gender) metaParts.push(gender);
    if (dens) metaParts.push(dens);
    return { model, typeLabel, metaLine: metaParts.join(' · ') || null };
  }

  // ── BELTS ─────────────────────────────────────────────────────────────────
  if (productType === 'belts') {
    const sportPart = sportSlug !== 'uncategorized' ? ` для ${SPORT_LABEL[sportSlug]}` : '';
    const colorMatch = name.match(/^(Білий|Синій|Чорний|Жовтий|Зелений|Червоний|Коричневий|Фіолетовий)/i);
    const color = colorMatch ? (colorMatch[1][0].toUpperCase() + colorMatch[1].slice(1).toLowerCase()) : '';
    let beltSeries = series;
    if (!beltSeries) {
      const sm = name.match(/серія\s+([A-Z][A-Z0-9\s]+?)(?:\s+\d{2,3}(?:см|cm)|,|$)/i);
      if (sm) beltSeries = sm[1].trim().toUpperCase();
    }
    const model = beltSeries ? `${brand.toUpperCase()} ${beltSeries}` : brand.toUpperCase();
    const typeLabel = `${color ? color + ' п' : 'П'}ояс${sportPart}`;
    return { model, typeLabel, metaLine: null };
  }

  // ── FOOTWEAR ──────────────────────────────────────────────────────────────
  if (productType === 'footwear') {
    const sportPart = sportSlug !== 'uncategorized' ? ` для ${SPORT_LABEL[sportSlug]}` : '';
    return { model: brand.toUpperCase(), typeLabel: `Взуття${sportPart}`, metaLine: null };
  }

  // ── BAGS ──────────────────────────────────────────────────────────────────
  if (productType === 'bags') {
    const n = name.toLowerCase();
    let bagType = 'Сумка';
    if (/рюкзак.?мішок/.test(n)) bagType = 'Рюкзак-мішок';
    else if (/рюкзак/.test(n)) bagType = 'Рюкзак';
    else if (/валіза/.test(n)) bagType = 'Валіза';
    const seriesMatch = name.match(/серія\s+([A-Z][A-Z0-9\s]+?)(?:\s+(?:Medium|Large|XL|M|L|S)|,|$)/i)
      || name.match(/IPPON\s*GEAR\s+(.+?)(?:\s+(?:Medium|Large|XL|M|L|S)\s*$|,|$)/i);
    const bagModel = series || (seriesMatch ? seriesMatch[1].trim() : '');
    const model = bagModel ? `${brand.toUpperCase()} ${bagModel.toUpperCase()}` : brand.toUpperCase();
    return { model, typeLabel: bagType, metaLine: null };
  }

  // ── TRAINERS ──────────────────────────────────────────────────────────────
  if (productType === 'trainers') {
    const uchiMatch = name.match(/[Uu]chi\s*[Kk]omi|учі\s*комі|учи\s*коми/i);
    if (uchiMatch) return { model: `${brand.toUpperCase()} Uchi Komi`, typeLabel: 'Тренажер', metaLine: null };
    const subtypeMatch = name.match(/(?:Канат|Комір|Захват)[а-яґєіїА-ЯҐЄІЇa-zA-Z-]*/i);
    if (subtypeMatch) {
      const raw = subtypeMatch[0];
      const normalized = raw
        .replace(/захват[уіи]/i, 'Захват')
        .replace(/захват/i, 'Захват')
        .replace(/захвати/i, 'Захвати');
      return { model: brand.toUpperCase(), typeLabel: `Тренажер ${normalized}`, metaLine: null };
    }
    return { model: brand.toUpperCase(), typeLabel: 'Тренажер', metaLine: null };
  }

  // ── T-SHIRTS ──────────────────────────────────────────────────────────────
  if (productType === 'tshirts') {
    // Strip trailing clothing size from YML name (e.g. "Сіра футболка IPPON GEAR CLAIM XS" → strip "XS")
    const nameNoSize = name.replace(/\s+(?:4XL|3XL|2XL|XXL|XXXL|XXXXL|XL|XS|[SML])\s*$/i, '').trim();
    const colorMatch2 = nameNoSize.match(/^([А-ЯҐЄІЇа-яґєіїa-zA-Z\-]+(?:\s+[А-ЯҐЄІЇа-яґєіїa-zA-Z\-]+)?)\s+футболка/i);
    const color2 = colorMatch2 ? colorMatch2[1] : '';
    const model = series ? `${brand.toUpperCase()} ${series}` : brand.toUpperCase();
    return { model, typeLabel: `${color2 ? color2 + ' ' : ''}Футболка`, metaLine: null };
  }

  // ── SAUNA SUIT ────────────────────────────────────────────────────────────
  if (productType === 'sauna_suit') {
    return { model: brand.toUpperCase(), typeLabel: 'Костюм-сауна', metaLine: null };
  }

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  const cleaned = name
    .replace(/,?\s*зріст\s+\d+\s*см/gi, '')
    .replace(/,?\s*\d{2,3}\s*зріст/gi, '')
    .replace(/,?\s*\d{2,3}\s*см/gi, '')
    .replace(/,?\s*щільність\s+[\d.,]+\s*(?:гр[./]?[мm]\.?(?:кв\.?)?|г\/м²)/gi, '')
    .replace(/,?\s*\d+\s*г\/м²/gi, '')
    .replace(/,?\s*(?:розмір|Розмір):\s*\d+/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/, '')
    .trim();
  return { model: cleaned || name, typeLabel: '', metaLine: null };
}

// ─── Component ────────────────────────────────────────────────────────────────

function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [activeVariant, setActiveVariant] = useState(0);

  // ── Active variant ref ────────────────────────────────────────────────────
  const activeVarObj = product.variants?.[activeVariant] ?? null;

  const currentImage = activeVarObj
    ? (activeVarObj.images[0] ?? product.image)
    : product.image;

  // ── Price for the active color ────────────────────────────────────────────
  // 1. Collect prices for the selected color's offers
  // 2. Fallback to product.price only if no variant data
  const activeColorPrices: number[] = (() => {
    if (!activeVarObj) return [product.price];
    if (activeVarObj.offers && activeVarObj.offers.length > 0) {
      return activeVarObj.offers
        .filter(o => o.price > 0)
        .map(o => o.price);
    }
    // variant has a single representative price
    return [activeVarObj.price ?? product.price];
  })();

  const minPrice = activeColorPrices.length > 0
    ? Math.min(...activeColorPrices)
    : product.price;
  const maxPrice = activeColorPrices.length > 0
    ? Math.max(...activeColorPrices)
    : product.price;
  const showFrom = maxPrice > minPrice;

  // Discount: use active variant oldPrice if available, else product.oldPrice
  const activeOldPrice = activeVarObj?.oldPrice ?? product.oldPrice;
  const discount = activeOldPrice && minPrice < activeOldPrice
    ? Math.round((1 - minPrice / activeOldPrice) * 100)
    : null;

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();

    // Find the best offer for this color: prefer first available size, else first offer
    let sizeToAdd = '';
    if (activeVarObj?.offers && activeVarObj.offers.length > 0) {
      const availableOffer = activeVarObj.offers.find(o => o.available) ?? activeVarObj.offers[0];
      sizeToAdd = availableOffer.size;
    } else {
      sizeToAdd = product.sizes[0] ?? '';
    }

    addItem(product, sizeToAdd, activeVarObj?.color ?? product.color, minPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // For belts: recalculate title from active variant name so color updates on swatch click
  const activeName = activeVarObj?.name ?? product.name;
  const cardTitle = getProductCardTitle(product, activeName);
  const fitKind = isFitVariantProduct(product) ? detectFit(product.name) : null;

  // Active color — drives belt/kit badge logic
  const activeColor = activeVarObj?.color ?? product.color;
  const { showBadge: showBeltBadge, hasGift: showGiftBadge } = getActiveKit(product, activeColor);

  // ── Benefit row (1 line under title) ──────────────────────────────────────
  type BenefitKind = 'ijf' | 'belt_backpack' | 'belt' | null;
  const benefitKind: BenefitKind = (() => {
    const isKimono = product.productType === 'kimono' || product.productType === 'uniform';
    if (!isKimono) return null;
    if (/ijf|approved/i.test(product.name)) return 'ijf';
    if (showBeltBadge && showGiftBadge) return 'belt_backpack';
    if (showBeltBadge) return 'belt';
    return null;
  })();

  const priceStr = showFrom
    ? `від ${formatPrice(minPrice)}`
    : formatPrice(minPrice);
  const oldPriceStr = !showFrom && activeOldPrice && minPrice < activeOldPrice
    ? formatPrice(activeOldPrice)
    : null;

  return (
    <Link href={activeColor ? `/product/${product.id}?color=${encodeURIComponent(activeColor)}` : `/product/${product.id}`}>
      <div
        className="gi-card h-full flex flex-col rounded-xl overflow-hidden cursor-pointer group transition-all duration-300"
        style={{
          background: 'linear-gradient(160deg, #1E1E1E 0%, #191919 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(232,35,42,0.35)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.45), 0 0 0 1px rgba(232,35,42,0.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.07)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
        }}
      >

        {/* ── Image area ── */}
        <div
          className="relative overflow-hidden shrink-0"
          style={{ aspectRatio: '3/4', background: '#1C1C1C' }}
        >
          <img
            src={currentImage}
            alt={cardTitle}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ willChange: 'transform' }}
          />

          {/* Bottom gradient — ties image to card body */}
          <div
            className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(25,25,25,0.55) 0%, transparent 100%)' }}
          />

          {/* Discount badge */}
          {discount && (
            <div className="absolute top-2 left-2">
              <span
                className="text-white text-[10px] font-bold font-inter px-2 py-0.5 rounded-md"
                style={{ background: 'linear-gradient(135deg, rgba(180,20,26,0.92) 0%, rgba(220,34,40,0.88) 100%)', border: '1px solid rgba(239,68,68,0.22)' }}
              >
                -{discount}%
              </span>
            </div>
          )}


        </div>

        {/* ── Info panel ── */}
        <div className="flex flex-col flex-1 p-3 sm:p-3.5">

          {/* Hit / New badges — belt/gift badges intentionally hidden (kept in logic only) */}
          {(product.isHit || product.isNew) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {product.isHit && (
                <span
                  className="text-white text-[9px] font-bold font-inter px-2 py-0.5 rounded-md"
                  style={{ background: 'linear-gradient(135deg, rgba(180,20,26,0.92) 0%, rgba(220,34,40,0.88) 100%)', border: '1px solid rgba(239,68,68,0.22)' }}
                >
                  ХІТ
                </span>
              )}
              {product.isNew && (
                <span className="bg-[#252525] border border-white/10 text-white/70 text-[9px] font-bold font-inter px-2 py-0.5 rounded-md">
                  НОВИНКА
                </span>
              )}
            </div>
          )}

          {/* Color swatches */}
          {product.variants && product.variants.length > 1 && (() => {
            const isBeltSwatch = product.productType === 'belts' && (product.sportSlug === 'bjj' || product.sportSlug === 'grappling');
            return (
              <div className={`flex flex-wrap mb-2.5 ${isBeltSwatch ? 'gap-1' : 'gap-1.5'}`}>
                {product.variants.map((v, i) => {
                  const swatchStyle: React.CSSProperties = v.colorGradient
                    ? { background: v.colorGradient, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' }
                    : {
                        backgroundColor: v.colorHex,
                        boxShadow: (v.colorHex === '#FFFFFF' || v.colorHex === '#808080')
                          ? 'inset 0 0 0 1px rgba(255,255,255,0.35)'
                          : 'inset 0 0 0 1px rgba(255,255,255,0.15)',
                      };
                  if (isBeltSwatch) {
                    // Rectangular belt-strip swatch
                    const isActive = activeVariant === i;
                    return v.linkedProductId ? (
                      <Link key={i} href={`/product/${v.linkedProductId}`}>
                        <button
                          type="button"
                          title={v.color}
                          onClick={e => e.stopPropagation()}
                          style={{ ...swatchStyle, width: 28, height: 12, borderRadius: 3, border: `2px solid #333` }}
                        />
                      </Link>
                    ) : (
                      <button
                        key={i}
                        type="button"
                        title={v.color}
                        onClick={e => { e.preventDefault(); setActiveVariant(i); }}
                        style={{
                          ...swatchStyle,
                          width: 28,
                          height: 12,
                          borderRadius: 3,
                          border: `2px solid ${isActive ? '#E8232A' : '#333'}`,
                          transform: isActive ? 'scaleY(1.2)' : undefined,
                          transition: 'border-color 0.15s, transform 0.15s',
                        }}
                      />
                    );
                  }
                  // Standard circle swatch
                  return v.linkedProductId ? (
                    <Link key={i} href={`/product/${v.linkedProductId}`}>
                      <button
                        type="button"
                        title={v.color}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded-full border-2 border-[#333] hover:border-[#E8232A] transition-all"
                        style={swatchStyle}
                      />
                    </Link>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      title={v.color}
                      onClick={e => { e.preventDefault(); setActiveVariant(i); }}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${activeVariant === i ? 'border-[#E8232A] scale-110' : 'border-[#333]'}`}
                      style={swatchStyle}
                    />
                  );
                })}
              </div>
            );
          })()}

          {/* Brand badge */}
          <BrandLogo brand={product.brand} />

          {/* Title — up to 4 lines on mobile, 3 on desktop; fixed min-height keeps buttons aligned */}
          <h3
            className="gi-card-title"
            style={{
              color: 'rgba(255,255,255,0.90)',
            }}
          >
            {cardTitle}
          </h3>

          {/* Meta zone — fit + benefit. On desktop: fixed min-height so cards without badges stay aligned */}
          <div className="sm:min-h-[28px]">
            {/* Fit label */}
            {fitKind && (() => {
              const fitName  = fitKind === 'slim' ? 'Slim Fit' : fitKind === 'women' ? 'Women' : 'Regular';
              const fitDescr = fitKind === 'slim' ? 'приталений крій' : fitKind === 'women' ? 'жіночий крій' : 'стандартний крій';
              return (
                <div style={{ marginTop: '6px', marginBottom: '1px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#E8232A', letterSpacing: '0.01em', lineHeight: 1.3 }}>
                    {fitName}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em', lineHeight: 1.3 }}>
                    {' · '}{fitDescr}
                  </span>
                </div>
              );
            })()}

            {/* Benefit chip */}
            {benefitKind && (
              <div style={{ marginTop: fitKind ? '4px' : '6px' }}>
                <span
                  className="font-inter"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 7px 3px 5px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    fontSize: '10.5px',
                    lineHeight: '1',
                    color: 'rgba(255,255,255,0.70)',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {benefitKind === 'ijf' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8232A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  )}
                  {(benefitKind === 'belt' || benefitKind === 'belt_backpack') && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8232A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="20 12 20 22 4 22 4 12" />
                      <rect x="2" y="7" width="20" height="5" />
                      <path d="M12 22V7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {benefitKind === 'ijf'          && 'Сертифіковано IJF'}
                    {benefitKind === 'belt_backpack' && 'Пояс + рюкзак-мішок'}
                    {benefitKind === 'belt'          && 'Пояс у комплекті'}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Spacer — mobile only: pushes price to bottom of card */}
          <div className="flex-1 min-h-[6px] sm:hidden" />

          {/* Price — on desktop: mt-auto pushes it to bottom of flex-1 info panel */}
          <div className="flex items-baseline gap-1.5 mt-2 sm:mt-auto sm:pt-3 mb-2">
            <span
              className="font-unbounded font-bold leading-none"
              style={{ fontSize: '13px', color: '#FFFFFF' }}
            >
              {priceStr}
            </span>
            {oldPriceStr && (
              <span className="font-inter line-through leading-none" style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.22)' }}>
                {oldPriceStr}
              </span>
            )}
          </div>

          {/* CTA button */}
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-1.5 text-white font-bold font-inter transition-all duration-200 active:scale-[0.98]"
            style={added ? {
              fontSize: '11px',
              padding: '8px 0',
              borderRadius: '7px',
              background: '#16a34a',
              border: '1px solid rgba(255,255,255,0.10)',
            } : {
              fontSize: '11px',
              padding: '8px 0',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              border: '1px solid rgba(220,38,38,0.30)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
            onMouseEnter={e => {
              if (!added) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, #C41E1E 0%, #991B1B 100%)';
              }
            }}
            onMouseLeave={e => {
              if (!added) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)';
              }
            }}
          >
            {added
              ? <><Check size={13} />Додано</>
              : <><ShoppingBag size={13} />В кошик</>
            }
          </button>

        </div>
      </div>
    </Link>
  );
}

export default memo(ProductCard);
