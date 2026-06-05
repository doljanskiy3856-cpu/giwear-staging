import { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingBag, Check } from 'lucide-react';
import type { Product, SportSlug } from '../data/products';
import { useCart } from '../context/CartContext';
import { getKitResult } from '../lib/belt-rules';

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
    const m = name.match(/IPPON\s*GEAR\s+([A-Z][A-Z0-9.\s!PINK]+?)(?:\s+\d{2,3}(?:см|cm|\s|$)|\s*[,(]|\s+\d+\s*$|$)/i);
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
 * Build a clean, store-friendly product card title.
 *
 * Rules:
 * - Always includes: product type + sport + brand
 * - Always includes: series/model if present
 * - Always includes: density (гр/м²) if present — for all kimono brands
 * - Includes gender ("для хлопчиків" / "для дівчаток" / "для жінок" / "для чоловіків")
 * - Prepends "Дитяче" for children's products (kimono/uniform only)
 * - NEVER includes: specific size/height (110 см, 120 зріст, etc.)
 * - NEVER includes: raw YML junk
 */
export function getProductCardTitle(product: Product): string {
  const { productType, sportSlug, brand, density, isChildren, name } = product;
  const brandU = brand.toUpperCase();
  const series = extractSeries(name, brandU);
  const gender = extractGender(name);
  const dens = normDensity(density);

  // ── KIMONO / UNIFORM ──────────────────────────────────────────────────────
  if (productType === 'kimono' || productType === 'uniform') {
    const baseRaw = KIMONO_TYPE_PREFIX[sportSlug] || 'Кімоно';
    const lc = (s: string) => s[0].toLowerCase() + s.slice(1);
    const childPrefix = isChildren ? 'Дитяче ' : '';

    if (brandU === 'KINTAYO') {
      // "Дитяче кімоно для дзюдо KINTAYO серія KOKA 350 гр/м²"
      const base = childPrefix ? lc(baseRaw) : baseRaw;
      const parts = [`${childPrefix}${base} KINTAYO`];
      if (series) parts.push(`серія ${series}`);
      if (dens) parts.push(dens);
      return parts.join(' ');
    }

    if (brandU === 'BUDOGI') {
      // "Кімоно для дзюдо TM BUDOGI BEGINNER дитяче для дівчаток 350 гр/м²"
      const parts = [`${baseRaw} TM BUDOGI`];
      if (series) parts.push(series);
      if (isChildren) parts.push('дитяче');
      if (gender) parts.push(gender);
      if (dens) parts.push(dens);
      return parts.join(' ');
    }

    if (brandU === 'IPPON GEAR' || brandU === 'IPPONGEAR') {
      // "Дитяче кімоно для дзюдо IPPON GEAR FUTURE 2 335 гр/м²"
      // "Ліцензійне кімоно для дзюдо IPPON GEAR LEGEND 2 IJF 690 гр/м²"
      const licensed = /ліцензійн/i.test(name);
      const licPrefix = licensed ? 'Ліцензійне ' : '';
      const anyPrefix = licPrefix || childPrefix;
      const base = anyPrefix ? lc(baseRaw) : baseRaw;
      const parts = [`${licPrefix}${childPrefix}${base} IPPON GEAR`];
      if (series) parts.push(series);
      if (/ijf|approved/i.test(name)) parts.push('IJF');
      if (gender && !isChildren) parts.push(gender);
      if (dens) parts.push(dens);
      return parts.join(' ');
    }

    // Generic fallback
    const base = childPrefix ? lc(baseRaw) : baseRaw;
    const parts = [`${childPrefix}${base} ${brand}`];
    if (series) parts.push(series);
    if (gender) parts.push(gender);
    if (dens) parts.push(dens);
    return parts.join(' ');
  }

  // ── BELTS ─────────────────────────────────────────────────────────────────
  if (productType === 'belts') {
    const sportPart = sportSlug !== 'uncategorized' ? ` для ${SPORT_LABEL[sportSlug]}` : '';
    // Normalize color — handle ALL-CAPS YML names
    const colorMatch = name.match(/^(Білий|Синій|Чорний|Жовтий|Зелений|Червоний|Коричневий|Фіолетовий)/i);
    const color = colorMatch ? (colorMatch[1][0].toUpperCase() + colorMatch[1].slice(1).toLowerCase()) : '';
    // Series: BUDOGI already detected; IPPON GEAR series is in name as "серія X 2"
    let beltSeries = series;
    if (!beltSeries) {
      const sm = name.match(/серія\s+([A-Z][A-Z0-9\s]+?)(?:\s+\d{2,3}(?:см|cm)|,|$)/i);
      if (sm) beltSeries = sm[1].trim().toUpperCase();
    }
    const seriesPart = beltSeries ? ` серія ${beltSeries}` : '';
    return `${color ? color + ' п' : 'П'}ояс${sportPart} ${brand}${seriesPart}`;
  }

  // ── FOOTWEAR ──────────────────────────────────────────────────────────────
  if (productType === 'footwear') {
    const sportPart = sportSlug !== 'uncategorized' ? ` для ${SPORT_LABEL[sportSlug]}` : '';
    return `Взуття${sportPart} ${brand}`;
  }

  // ── BAGS ──────────────────────────────────────────────────────────────────
  if (productType === 'bags') {
    const n = name.toLowerCase();
    let bagType = 'Сумка';
    if (/рюкзак.?мішок/.test(n)) bagType = 'Рюкзак-мішок';
    else if (/рюкзак/.test(n)) bagType = 'Рюкзак';
    else if (/валіза/.test(n)) bagType = 'Валіза';

    // Extract series/model from name
    const seriesMatch = name.match(/серія\s+([A-Z][A-Z0-9\s]+?)(?:\s+(?:Medium|Large|XL|M|L|S)|,|$)/i)
      || name.match(/IPPON\s*GEAR\s+(.+?)(?:\s+(?:Medium|Large|XL|M|L|S)\s*$|,|$)/i);
    const bagModel = series || (seriesMatch ? seriesMatch[1].trim() : '');
    const parts: string[] = [`${bagType} ${brand}`];
    if (bagModel) parts.push(bagModel.toUpperCase());
    return parts.join(' ');
  }

  // ── TRAINERS ──────────────────────────────────────────────────────────────
  if (productType === 'trainers') {
    const uchiMatch = name.match(/[Uu]chi\s*[Kk]omi|учі\s*комі|учи\s*коми/i);
    if (uchiMatch) return `Тренажер Uchi Komi ${brand}`;
    // Match trainer subtypes with Cyrillic suffixes (genitive etc.)
    const subtypeMatch = name.match(/(?:Канат|Комір|Захват)[а-яґєіїА-ЯҐЄІЇa-zA-Z-]*/i);
    if (subtypeMatch) {
      // Normalize to nominative display form
      const raw = subtypeMatch[0];
      const normalized = raw
        .replace(/захват[уіи]/i, 'Захват')
        .replace(/захват/i, 'Захват')
        .replace(/захвати/i, 'Захвати');
      return `Тренажер ${normalized} ${brand}`;
    }
    return `Тренажер ${brand}`;
  }

  // ── T-SHIRTS ──────────────────────────────────────────────────────────────
  if (productType === 'tshirts') {
    const colorMatch = name.match(/^([А-ЯҐЄІЇа-яґєіїa-zA-Z\-]+(?:\s+[А-ЯҐЄІЇа-яґєіїa-zA-Z\-]+)?)\s+футболка/i);
    const color = colorMatch ? colorMatch[1] + ' ' : '';
    if (series) return `${color}Футболка ${brand} ${series}`.trim();
    return `${color}Футболка ${brand}`.trim();
  }

  // ── SAUNA SUIT ────────────────────────────────────────────────────────────
  if (productType === 'sauna_suit') {
    return `Костюм-сауна ${brand}`;
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
  return cleaned || name;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductCard({ product }: Props) {
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

  const cardTitle = getProductCardTitle(product);

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
    <Link href={`/product/${product.id}`}>
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

          {/* Title — 3 lines clamped, fixed min-height for row alignment */}
          <h3
            className="font-unbounded font-bold line-clamp-3 flex-shrink-0"
            style={{
              fontSize: '11.5px',
              lineHeight: '1.35',
              minHeight: 'calc(1.35em * 3)',
              color: 'rgba(255,255,255,0.90)',
            }}
          >
            {cardTitle}
          </h3>

          {/* Benefit chip */}
          {benefitKind && (
            <div style={{ marginTop: '5px' }}>
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
                {/* Icon */}
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
                {/* Label */}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {benefitKind === 'ijf'          && 'Сертифіковано IJF'}
                  {benefitKind === 'belt_backpack' && 'Пояс + рюкзак-мішок'}
                  {benefitKind === 'belt'          && 'Пояс у комплекті'}
                </span>
              </span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1 min-h-[6px]" />

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-2.5 mb-2.5">
            <span
              className="font-unbounded font-black leading-none"
              style={{ fontSize: '14px', color: '#FFFFFF' }}
            >
              {priceStr}
            </span>
            {oldPriceStr && (
              <span className="font-inter line-through leading-none" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                {oldPriceStr}
              </span>
            )}
          </div>

          {/* CTA button */}
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-1.5 text-white font-bold font-inter transition-all duration-200 active:scale-[0.98]"
            style={added ? {
              fontSize: '11.5px',
              padding: '9px 0',
              borderRadius: '8px',
              background: '#16a34a',
              border: '1px solid rgba(255,255,255,0.10)',
            } : {
              fontSize: '11.5px',
              padding: '9px 0',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(158,20,26,0.92) 0%, rgba(220,34,40,0.88) 55%, rgba(175,24,30,0.90) 100%)',
              border: '1px solid rgba(239,68,68,0.22)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => {
              if (!added) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, rgba(175,24,30,0.96) 0%, rgba(232,35,42,0.94) 55%, rgba(190,28,34,0.96) 100%)';
              }
            }}
            onMouseLeave={e => {
              if (!added) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, rgba(158,20,26,0.92) 0%, rgba(220,34,40,0.88) 55%, rgba(175,24,30,0.90) 100%)';
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
