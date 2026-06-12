import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import {
  Star, Check, MessageCircle, Package, RefreshCw, Truck,
  ChevronDown, ChevronUp, ShoppingBag, Thermometer, Ban, Wind, Gauge, ZoomIn, MinusCircle, Ruler,
  Clock, Bell,
} from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { VisaSVG, MastercardSVG, GooglePaySVG, ApplePaySVG, LiqPaySVG } from '../components/PaymentIcons';
import { useCart } from '../context/CartContext';
import type { Product, ProductType, SportSlug, OfferEntry } from '../data/products';
import ProductCard from '../components/ProductCard';
import ImageLightbox from '../components/ImageLightbox';
import SizeChartModal from '../components/SizeChartModal';
import { PRODUCT_TYPE_LABELS } from '../../lib/categories';
import { getKitResult } from '../lib/belt-rules';
import { getProductOverride } from '../data/product-overrides';
import { findFitSiblings, findAllFitProducts, detectFit, FIT_CHAR_LABEL, FIT_DESCR } from '../lib/fit-utils';
import NotifyModal from '../components/NotifyModal';

/* ══════════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════════ */

const SPORT_LABELS: Record<SportSlug, string> = {
  karate:          'Карате',
  judo:            'Дзюдо',
  bjj:             'Джиу-джитсу / BJJ',
  grappling:       'Грепплінг',
  sambo:           'Самбо',
  aikido:          'Айкідо',
  rukopashnyy_biy: 'Рукопашний бій',
  boyovyi_khortyng:'Бойовий хортинг',
  uncategorized:   'Інше',
};

const TYPE_LABEL: Record<ProductType, string> = {
  kimono:       'Кімоно',
  belts:        'Пояс',
  footwear:     'Взуття',
  tshirts:      'Футболка',
  bags:         'Сумка / рюкзак',
  trainers:     'Тренажер',
  sauna_suit:   'Костюм-сауна',
  uniform:      'Форма / самбовка',
  other:        'Аксесуар',
  uncategorized:'Товар',
};

/* ── Clothing size sort order ── */
const CLOTHING_SIZE_ORDER: Record<string, number> = {
  XS: 0, S: 1, M: 2, L: 3, XL: 4,
  '2XL': 5, 'XXL': 5,
  '3XL': 6, 'XXXL': 6,
  '4XL': 7, 'XXXXL': 7,
};
function sortClothingSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ua = a.toUpperCase(), ub = b.toUpperCase();
    const oa = CLOTHING_SIZE_ORDER[ua] ?? 99;
    const ob = CLOTHING_SIZE_ORDER[ub] ?? 99;
    if (oa !== ob) return oa - ob;
    const na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
}

/** Strip HTML entities & tags, collapse whitespace, trim, and remove label prefixes like "ОПИС:" */
function cleanText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&ndash;/gi, '—')
    .replace(/&mdash;/gi, '—')
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&#[0-9]+;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/(\r?\n){3,}/g, '\n\n')
    .trim()
    .replace(/^(ОПИС|ОПИСАНИЕ|DESCRIPTION)\s*:?\s*/i, '');
}

function shortDesc(raw: string, maxChars = 260): string {
  const text = cleanText(raw);
  if (!text) return '';
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  let result = '';
  for (const s of sentences) {
    if ((result + s).length > maxChars) break;
    result += s;
  }
  return result.trim() || text.slice(0, maxChars).trim();
}

function washTemp(raw: string): string {
  const text = cleanText(raw);
  const m = text.match(/(\d{2,3})\s*°[Cc]/);
  if (m) return `Прати при ${m[1]}°C`;
  return 'Прати при 30–40°C';
}

function fallbackDesc(p: Product): string {
  const sport = SPORT_LABELS[p.sportSlug] ?? '';
  const type  = TYPE_LABEL[p.productType] ?? 'Товар';
  const parts: string[] = [];
  if (type && sport) parts.push(`${type} для ${sport.toLowerCase()}`);
  if (p.brand)       parts.push(`від бренду ${p.brand}`);
  if (p.density)     parts.push(`щільність ${p.density}`);
  if (p.fabric)      parts.push(`матеріал: ${p.fabric}`);
  if (parts.length)  return parts.join('. ') + '.';
  return `${p.brand} — якісна екіпіровка для єдиноборств.`;
}

function buildCare(p: Product): string[] {
  if (p.care && p.care.length > 0) return p.care;
  const hasTextile = ['kimono', 'uniform', 'tshirts', 'sauna_suit', 'belts'].includes(p.productType);
  if (!hasTextile) return [];
  return [washTemp(p.description ?? ''), 'Не відбілювати', 'Сушити природним способом'];
}

// ─── Multi-value field formatters ─────────────────────────────────────────────

/**
 * Splits a semicolon-separated string, trims parts, capitalises the first token,
 * and joins with ", ".  Safe to call on plain strings (no semicolons) — just
 * capitalises the first letter.
 *
 * "дитячі;підліткові;дорослі" → "Дитячі, підліткові, дорослі"
 * "білий"                     → "Білий"
 */
function formatMultiValue(raw: string): string {
  const parts = raw
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
  if (!parts.length) return raw;
  parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return parts.join(', ');
}

/** Mapping from raw YML token → human-friendly Ukrainian noun */
const AGE_GROUP_MAP: Record<string, string> = {
  'дитячі':    'Діти',
  'дитяч':     'Діти',
  'підліткові':'Підлітки',
  'підліток':  'Підлітки',
  'дорослі':   'Дорослі',
  'доросл':    'Дорослі',
};

/** Mapping for "Для кого" → grammatically correct phrase fragment */
const FOR_WHOM_MAP: Record<string, string> = {
  'дитячі':    'дітей',
  'дитяч':     'дітей',
  'підліткові':'підлітків',
  'підліток':  'підлітків',
  'дорослі':   'дорослих',
  'доросл':    'дорослих',
};

function lookupToken<T extends Record<string, string>>(token: string, map: T): string {
  const key = token.toLowerCase().trim();
  for (const [k, v] of Object.entries(map)) {
    if (key.startsWith(k)) return v;
  }
  return token.charAt(0).toUpperCase() + token.slice(1);
}

/**
 * "дитячі;підліткові;дорослі" → "Діти, підлітки, дорослі"
 */
function formatAgeGroup(raw: string): string {
  const parts = raw.split(';').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return raw;
  const mapped = parts.map(p => lookupToken(p, AGE_GROUP_MAP));
  return mapped.join(', ');
}

/**
 * "дитячі;підліткові;дорослі" → "Для дітей, підлітків і дорослих"
 * "дитячі"                    → "Для дітей"
 */
function formatForWhom(raw: string): string {
  const parts = raw.split(';').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return raw;
  const mapped = parts.map(p => lookupToken(p, FOR_WHOM_MAP));
  if (mapped.length === 1) return `Для ${mapped[0]}`;
  const last = mapped.pop()!;
  return `Для ${mapped.join(', ')} і ${last}`;
}

const sizeTableKintayoJudo = [
  { size: '110', slim: '1,03–1,12m', regular: '0,99–1,08m' },
  { size: '120', slim: '1,13–1,22m', regular: '1,09–1,18m' },
  { size: '130', slim: '1,23–1,32m', regular: '1,19–1,28m' },
  { size: '140', slim: '1,33–1,42m', regular: '1,29–1,38m' },
  { size: '150', slim: '1,43–1,52m', regular: '1,39–1,48m' },
  { size: '160', slim: '1,53–1,62m', regular: '1,49–1,58m' },
  { size: '170', slim: '1,63–1,72m', regular: '1,59–1,68m' },
  { size: '180', slim: '1,73–1,82m', regular: '1,69–1,78m' },
  { size: '190', slim: '1,83–1,92m', regular: '1,79–1,88m' },
  { size: '200', slim: '1,93–2,02m', regular: '1,89–1,98m' },
];

interface Props { id: string; }

function AvailabilityBadge({ available }: { available: boolean }) {
  if (available) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1F0F] border border-green-900/50 text-green-400 text-xs font-inter font-medium">
        <span
          className="availability-dot inline-block w-2 h-2 rounded-full bg-green-400 shrink-0"
          style={{ color: '#4ade80' }}
        />
        В наявності
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F0F0F] border border-red-900/50 text-red-400 text-xs font-inter font-medium">
      <span
        className="availability-dot inline-block w-2 h-2 rounded-full bg-red-400 shrink-0"
        style={{ color: '#f87171' }}
      />
      Немає в наявності
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   UnavailableCard — shown instead of "В кошик" when variant is unavailable
══════════════════════════════════════════════════════════ */
interface UnavailableCardProps {
  restockDate?: string;
  onNotify: () => void;
}

function UnavailableCard({ restockDate, onNotify }: UnavailableCardProps) {
  return (
    <div
      className="w-full rounded-2xl mb-2"
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderLeft: '3px solid rgba(217,119,6,0.70)',
        padding: '14px 16px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5 mb-2.5">
        <span
          className="shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(217,119,6,0.12)' }}
        >
          <Clock size={14} style={{ color: '#D97706' }} />
        </span>
        <div>
          <p className="font-inter text-white text-sm font-semibold leading-snug">
            Обраний розмір тимчасово недоступний
          </p>
          {restockDate ? (
            <p className="font-inter text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Очікуємо поставку:&nbsp;
              <span style={{ color: '#D97706', fontWeight: 500 }}>{restockDate}</span>
            </p>
          ) : (
            <p className="font-inter text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Можемо повідомити вас, коли товар зʼявиться.
            </p>
          )}
        </div>
      </div>

      {/* Notify CTA */}
      <button
        onClick={onNotify}
        className="w-full flex items-center justify-center gap-2 font-inter font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
        style={{
          padding: '10px 16px',
          borderRadius: '10px',
          background: 'transparent',
          border: '1.5px solid rgba(217,119,6,0.55)',
          color: '#F59E0B',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(217,119,6,0.10)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(217,119,6,0.80)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(217,119,6,0.55)';
        }}
      >
        <Bell size={15} />
        Повідомити про наявність
      </button>
    </div>
  );
}

export default function ProductPage({ id }: Props) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize]       = useState('');
  const [activeImg, setActiveImg]             = useState(0);
  const [sizeModalOpen, setSizeModalOpen]     = useState(false);
  const [added, setAdded]                     = useState(false);
  const [sizeError, setSizeError]             = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [showFullDesc, setShowFullDesc]       = useState(false);

  const [showOverrideDetail, setShowOverrideDetail] = useState(false);
  const [lightboxOpen, setLightboxOpen]       = useState(false);
  const [notifyOpen, setNotifyOpen]           = useState(false);

  /* ── Scroll-protected tap on main photo ── */
  const imgTapRef = useRef({ startX: 0, startY: 0, moved: false });

  const handleImgTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    imgTapRef.current = { startX: t.clientX, startY: t.clientY, moved: false };
  };
  const handleImgTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - imgTapRef.current.startX);
    const dy = Math.abs(t.clientY - imgTapRef.current.startY);
    if (dx > 8 || dy > 8) imgTapRef.current.moved = true;
  };
  const handleImgTouchEnd = () => {
    if (!imgTapRef.current.moved) setLightboxOpen(true);
  };

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () =>
      fetch(`/api/products/${id}`).then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      }),
  });
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
    enabled: !!product,
  });

  /* ── Restore from URL query params ── */
  useEffect(() => {
    if (!product) return;
    const params = new URLSearchParams(window.location.search);
    const urlColor = params.get('color');
    const urlSize  = params.get('size');

    if (urlColor && product.variants) {
      const idx = product.variants.findIndex(v => v.color === urlColor);
      if (idx >= 0) setSelectedVariantIdx(idx);
    }
    if (urlSize) setSelectedSize(urlSize);
  }, [product?.id]);

  /* ── Active variant & size offer ── */
  const activeVariant = product?.variants?.[selectedVariantIdx] ?? null;

  /* Fit detection — must be before activeSizeMap (which uses them) */
  const currentFit = product ? detectFit(product.name) : null;

  /* All products sharing the same model + fit as current product.
     Needed to merge offers across split products (e.g. ULTRALIGHT 1310 + 1310_adult). */
  const fitProducts = useMemo(
    () => (product ? findAllFitProducts(product, allProducts) : []),
    [product, allProducts],
  );

  /* Unique sorted sizes for the active color.
     For each unique size: available = true if ANY offer for that size is available.
     For fit-variant products (e.g. ULTRALIGHT Slim Fit split across 1310 + 1310_adult):
     merge offers from all fitProducts with the same color so all sizes appear. */
  const activeSizeMap = useMemo((): Map<string, boolean> => {
    const map = new Map<string, boolean>();
    const activeColor = activeVariant?.color ?? product?.color ?? '';

    if (fitProducts.length > 1 && currentFit) {
      // Merge offers from all same-fit products, matching color
      for (const fp of fitProducts) {
        for (const v of (fp.variants ?? [])) {
          // Match by color — allow empty color (single-color products)
          if (activeColor && v.color && v.color !== activeColor) continue;
          for (const o of (v.offers ?? [])) {
            const s = o.size;
            if (!s) continue;
            map.set(s, (map.get(s) ?? false) || o.available);
          }
        }
      }
    } else {
      // Standard: use only activeVariant offers
      const offers = activeVariant?.offers ?? [];
      for (const o of offers) {
        const s = o.size;
        if (!s) continue;
        map.set(s, (map.get(s) ?? false) || o.available);
      }
    }
    return map;
  }, [activeVariant, fitProducts, currentFit, product]);

  /* Sorted unique size list */
  const activeSizes = useMemo((): string[] => {
    const isClothingType = product?.productType === 'tshirts' || product?.productType === 'sauna_suit';
    if (activeSizeMap.size > 0) {
      const keys = Array.from(activeSizeMap.keys());
      if (isClothingType) return sortClothingSizes(keys);
      return keys.sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
      });
    }
    if (product?.sizes) {
      return isClothingType ? sortClothingSizes(product.sizes) : product.sizes;
    }
    return [];
  }, [activeSizeMap, product]);

  /* When color changes, keep selected size if it exists for new color,
     otherwise pick first available size for new color */
  const handleColorChange = (idx: number) => {
    setSelectedVariantIdx(idx);
    setActiveImg(0);
    const newVariant = product?.variants?.[idx];
    if (newVariant?.offers?.length) {
      // Build unique sizes for the new color
      const newSizeMap = new Map<string, boolean>();
      for (const o of newVariant.offers) {
        if (!o.size) continue;
        newSizeMap.set(o.size, (newSizeMap.get(o.size) ?? false) || o.available);
      }
      const newSizes = Array.from(newSizeMap.keys());
      if (selectedSize && newSizes.includes(selectedSize)) {
        // Keep same size
        updateURL(newVariant.color, selectedSize);
      } else {
        // Pick first available, fallback to first in list
        const firstAvail = newVariant.offers.find(o => o.available && o.size)?.size
          ?? newSizes[0] ?? '';
        setSelectedSize(firstAvail);
        updateURL(newVariant.color, firstAvail);
      }
    } else {
      updateURL(newVariant?.color ?? '', selectedSize);
    }
  };

  const handleSizeChange = (size: string) => {
    const next = size === selectedSize ? '' : size;
    setSelectedSize(next);
    updateURL(activeVariant?.color ?? product?.color ?? '', next);
  };

  function updateURL(color: string, size: string) {
    const params = new URLSearchParams(window.location.search);
    if (color) params.set('color', color); else params.delete('color');
    if (size)  params.set('size', size);   else params.delete('size');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }

  /* Specific offer for selected color+size.
     Prefer the first available offer for that size; fallback to any offer with that size.
     For fit-split products (e.g. 1310 + 1310_adult): search across all fitProducts
     so adult sizes (160-190) resolve correctly even when current product only has 140-155. */
  const activeSizeOffer: OfferEntry | null = useMemo(() => {
    if (!selectedSize) return null;
    const activeColor = activeVariant?.color ?? product?.color ?? '';

    // Collect all candidate offers from fitProducts (merged) or just activeVariant
    const candidateOffers: OfferEntry[] = [];
    if (fitProducts.length > 1 && currentFit) {
      for (const fp of fitProducts) {
        for (const v of (fp.variants ?? [])) {
          if (activeColor && v.color && v.color !== activeColor) continue;
          for (const o of (v.offers ?? [])) {
            if (o.size === selectedSize) candidateOffers.push(o);
          }
        }
      }
    } else {
      const offers = activeVariant?.offers ?? [];
      for (const o of offers) {
        if (o.size === selectedSize) candidateOffers.push(o);
      }
    }

    return candidateOffers.find(o => o.available) ?? candidateOffers[0] ?? null;
  }, [selectedSize, activeVariant, fitProducts, currentFit, product]);

  /* ── Derived display fields — always from active offer ── */
  const displayName       = activeSizeOffer?.name ?? activeVariant?.name ?? product?.name ?? '';
  const displayPrice      = activeSizeOffer?.price ?? activeVariant?.price ?? product?.price ?? 0;
  const displayOldPrice   = activeSizeOffer?.oldPrice ?? activeVariant?.oldPrice ?? product?.oldPrice;
  const displayVendorCode = activeSizeOffer?.vendorCode ?? activeVariant?.vendorCode ?? product?.vendorCode ?? '';
  const displayColor      = activeVariant?.color ?? product?.color ?? '';
  const displayAvailable  = activeSizeOffer?.available ?? activeVariant?.offers?.some(o => o.available) ?? product?.available ?? true;

  const discount = displayOldPrice ? Math.round((1 - displayPrice / displayOldPrice) * 100) : null;

  // Compute override early so activeImages memo can use imagesBySizeGte
  // Guard against product being undefined during loading state
  const override = product
    ? getProductOverride(product.brand, product.name, product.sportSlug, product.productType, product.density ?? '', product.isChildren ?? false, product.id)
    : null;

  /* Images — size charts always last */
  const activeImages = useMemo(() => {
    const isChart = (url: string) =>
      /size.?chart|size.?hart|sze.?chart|size.?crt|size_1|size_2|Size-chart|Judojacke|Judo-Pant/i.test(url);

    // "Canonical" chart = one we uploaded manually to cloud storage (not raw YML filename)
    const isCanonicalChart = (url: string) =>
      isChart(url) && url.includes('cli-uploads');

    // Use variant images for product photos; always pull charts from product.images
    // (CHART_ONLY_OVERRIDES appends charts to product.images, not per-variant images)
    let rawBase = activeVariant?.images?.length ? activeVariant.images : product?.images ?? [];

    // imagesBySizeGte: when a size ≥ threshold is selected, swap to override images
    if (override?.imagesBySizeGte && selectedSize) {
      const sizeNum = parseInt(selectedSize, 10);
      if (!isNaN(sizeNum)) {
        // Find the highest threshold that is ≤ selectedSize
        const thresholds = Object.keys(override.imagesBySizeGte)
          .map(Number)
          .filter(t => sizeNum >= t)
          .sort((a, b) => b - a);
        if (thresholds.length > 0) {
          const colorMap = override.imagesBySizeGte[thresholds[0]];
          const activeColor = (activeVariant?.color ?? product?.color ?? '').toLowerCase();
          // Try exact color match first, then '' fallback
          const overrideImages =
            colorMap[activeVariant?.color ?? ''] ??
            colorMap[Object.keys(colorMap).find(k => k.toLowerCase() === activeColor) ?? ''] ??
            colorMap[''] ??
            null;
          if (overrideImages?.length) rawBase = overrideImages;
        }
      }
    }

    const raw     = rawBase;
    const main    = raw.filter(u => !isChart(u));

    // Collect ALL charts from both variant and product-level images
    const variantCharts = raw.filter(u => isChart(u));
    const productCharts = (product?.images ?? []).filter(u => isChart(u));

    // Merge, dedup by exact URL
    const chartSet = new Set(variantCharts);
    for (const c of productCharts) chartSet.add(c);
    const allCharts = Array.from(chartSet);

    // If any canonical (cli-uploads) chart exists, drop legacy YML chart filenames.
    // This prevents "Сітка 1 / Сітка 2" when the product has both an old YML size_chart
    // image and a new manually-uploaded chart covering the same product.
    const hasCanonical = allCharts.some(isCanonicalChart);
    const charts = hasCanonical
      ? allCharts.filter(isCanonicalChart)   // keep only canonical, drop legacy
      : allCharts;                            // no canonical → keep all (IPPON GEAR etc.)

    return [...main, ...charts];
  }, [product, activeVariant, override, selectedSize]);

  /* Size chart images extracted from activeImages (deduplicated) */
  const chartImages = useMemo(() => {
    const CHART_RE = /size.?chart|size.?hart|sze.?chart|size.?crt|size_1|size_2|Size-chart|Judojacke|Judo-Pant/i;
    return activeImages.filter(u => CHART_RE.test(u));
  }, [activeImages]);

  /* Fit siblings — must be before any early returns (Rules of Hooks) */
  const fitSiblings = useMemo(
    () => (product ? findFitSiblings(product, allProducts) : []),
    [product, allProducts],
  );

  /* Loading / error */
  if (isLoading) return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#E8232A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-inter text-[#A0A0A0]">Завантаження...</p>
      </div>
    </div>
  );
  if (!product) return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-unbounded text-white text-2xl font-black mb-4">Товар не знайдено</h1>
        <Link href="/" className="text-[#E8232A] font-bold font-inter">На головну</Link>
      </div>
    </div>
  );

  const related = allProducts.filter(p => p.id !== product.id && p.categorySlug === product.categorySlug).slice(0, 4);

  /* Telegram message with full active offer details */
  const telegramMsg = encodeURIComponent(
    [
      `Хочу замовити: ${displayName}`,
      displayColor ? `Колір: ${displayColor}` : '',
      selectedSize ? `Розмір: ${selectedSize}` : '',
      displayPrice ? `Ціна: ${displayPrice.toLocaleString('uk-UA')} грн` : '',
      displayVendorCode ? `Артикул: ${displayVendorCode}` : '',
    ].filter(Boolean).join('\n')
  );

  /* Telegram message for "notify when available" */
  const telegramNotifyMsg = encodeURIComponent(
    [
      `Добрий день! Повідомте, будь ласка, коли буде в наявності:`,
      `Товар: ${displayName}`,
      displayColor ? `Колір: ${displayColor}` : '',
      selectedSize ? `Розмір: ${selectedSize}` : '',
      currentFit   ? `Крій: ${currentFit}`    : '',
      displayVendorCode ? `Артикул: ${displayVendorCode}` : '',
    ].filter(Boolean).join('\n')
  );

  const rawDesc  = cleanText(product.description ?? '');
  const preview  = override?.shortDesc ?? (rawDesc ? shortDesc(rawDesc, 280) : fallbackDesc(product));
  const hasMore  = !override && rawDesc.length > preview.length + 10;

  // Kit result — driven by active color (from selected variant) + product density
  const kitResult = (product.productType === 'kimono' || product.productType === 'uniform')
    ? getKitResult({
        brand:    product.brand,
        sportSlug: product.sportSlug,
        color:    displayColor || product.color,
        density:  product.density,
      })
    : null;

  const includes: string[] = (override?.kitFixed && override.kit.length)
    ? override.kit
    : kitResult
      ? kitResult.items
      : product.productType === 'belts'
        ? ['Пояс']
        : product.productType === 'footwear'
          ? ['Пара взуття']
          : [];

  const kitGifts: string[]  = override?.kitFixed ? [] : (kitResult?.gifts ?? []);
  const beltNote: string    = override?.kitFixed ? '' : (kitResult?.footnote ?? '');
  const care                = override?.care?.length ? override.care : buildCare(product);

  /* Characteristics — from active offer/variant */
  const chars: { label: string; value: string }[] = [
    { label: 'Бренд',            value: product.brand },
    { label: 'Вид спорту',       value: SPORT_LABELS[product.sportSlug] ?? '' },
    { label: 'Щільність',        value: product.density ?? '' },
    { label: 'Крій',             value: currentFit ? FIT_CHAR_LABEL[currentFit] : '' },
    { label: 'Матеріал',         value: product.fabric ? formatMultiValue(product.fabric) : '' },
    { label: 'Вікова категорія', value: product.ageGroup ? formatAgeGroup(product.ageGroup) : '' },
    { label: 'Для кого',         value: product.forWhom ? formatForWhom(product.forWhom) : '' },
  ].filter(r => r.value && r.value.trim());

  const handleAddToCart = () => {
    if (activeSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    // Build cart item with active offer data
    const cartProduct: Product = {
      ...product,
      name:       displayName,
      price:      displayPrice,
      oldPrice:   displayOldPrice,
      color:      displayColor,
      vendorCode: displayVendorCode,
      image:      activeImages[0] ?? product.image,
    };
    addItem(cartProduct, selectedSize, displayColor, displayPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  /* Breadcrumb */
  // Build meaningful path — no product title, real category + subcategory links
  const breadcrumbCrumbs: { label: string; href?: string }[] = (() => {
    const { sportSlug, productType, isChildren, judoLevel } = product;

    // ── Belts ──────────────────────────────────────────────────────────────
    if (productType === 'belts') {
      if (sportSlug === 'bjj' || sportSlug === 'grappling')
        return [{ label: 'BJJ', href: '/category/bjj' }, { label: 'Пояси', href: '/category/bjj?quick=belts' }];
      if (sportSlug === 'judo')
        return [{ label: 'Дзюдо', href: '/category/judo' }, { label: 'Пояси', href: '/category/judo?quick=belts' }];
      if (sportSlug === 'karate')
        return [{ label: 'Карате', href: '/category/karate' }, { label: 'Пояси', href: '/category/karate?quick=belts' }];
      return [{ label: 'Пояси' }];
    }

    // ── Other non-kimono ───────────────────────────────────────────────────
    if (productType === 'bags')     return [{ label: 'Сумки та рюкзаки', href: '/category/accessories' }];
    if (productType === 'footwear') return [{ label: 'Взуття' }];
    if (productType === 'trainers') return [{ label: 'Тренажери', href: '/trenery' }];
    if (productType === 'tshirts')  return [{ label: 'Футболки' }];

    // ── Judo kimono ────────────────────────────────────────────────────────
    if (sportSlug === 'judo') {
      const base = { label: 'Дзюдо', href: '/category/judo' };
      if (judoLevel === 'professional')
        return [base, { label: 'Професійні IJF', href: '/category/judo?quick=professional' }];
      if (judoLevel === 'children' || isChildren)
        return [base, { label: 'Дитячі', href: '/category/judo?quick=children' }];
      if (judoLevel === 'teens_adults')
        return [base, { label: 'Підлітки та дорослі', href: '/category/judo?quick=teens_adults' }];
      return [base];
    }

    // ── BJJ / grappling ────────────────────────────────────────────────────
    if (sportSlug === 'bjj' || sportSlug === 'grappling') {
      const base = { label: 'BJJ', href: '/category/bjj' };
      if (isChildren)
        return [base, { label: 'Дитячі', href: '/category/bjj?quick=children' }];
      return [base, { label: 'Кімоно Gi', href: '/category/bjj?quick=teens_adults' }];
    }

    // ── Karate ─────────────────────────────────────────────────────────────
    if (sportSlug === 'karate') {
      const base = { label: 'Карате', href: '/category/karate' };
      if (isChildren)
        return [base, { label: 'Дитячі', href: '/category/karate?quick=children' }];
      return [base, { label: 'Підлітки та дорослі', href: '/category/karate?quick=teens_adults' }];
    }

    // ── Other sports ───────────────────────────────────────────────────────
    if (sportSlug === 'sambo')           return [{ label: 'Самбо', href: '/category/sambo' }];
    if (sportSlug === 'aikido')          return [{ label: 'Айкідо', href: '/category/aikido' }];
    if (sportSlug === 'rukopashnyy_biy') return [{ label: 'Рукопашний бій' }];

    if (isChildren) return [{ label: 'Дитячі', href: '/category/dytiachy' }];
    return [{ label: 'Каталог', href: '/' }];
  })();

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

        {/* Breadcrumb */}
        <div className="font-inter text-sm mb-6">
          {/* Mobile: ← Sport / Subcategory — all linked */}
          <div className="lg:hidden flex items-center gap-1.5 text-[#A0A0A0]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="15 18 9 12 15 6"/></svg>
            {breadcrumbCrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-40">/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={`hover:text-[#E8232A] transition-colors ${i === breadcrumbCrumbs.length - 1 ? 'text-white/70' : ''}`}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={i === breadcrumbCrumbs.length - 1 ? 'text-white/70' : ''}>{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
          {/* Desktop: Головна / Sport / Subcategory — all linked */}
          <div className="hidden lg:flex items-center gap-1.5 text-[#A0A0A0]">
            <Link href="/" className="hover:text-[#E8232A] transition-colors">Головна</Link>
            {breadcrumbCrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="opacity-40">/</span>
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={`hover:text-[#E8232A] transition-colors ${i === breadcrumbCrumbs.length - 1 ? 'text-white/70' : ''}`}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={i === breadcrumbCrumbs.length - 1 ? 'text-white/70' : ''}>{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* ── TOP: Images + Buy block ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-12 mb-8 lg:mb-10 items-start">

          {/* Images */}
          <div>
            <div
              className="w-full rounded-xl overflow-hidden mb-3 relative"
              style={{
                cursor: 'zoom-in',
                // ── VARIANT A: premium neutral bg (active) ──
                background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 35%, rgba(0,0,0,0.20) 100%), #161616',
                // ── VARIANT B: blurred photo bg (commented out — restore if needed) ──
                // background: '#1A1A1A',
              }}
              onClick={() => setLightboxOpen(true)}
              onTouchStart={handleImgTouchStart}
              onTouchMove={handleImgTouchMove}
              onTouchEnd={handleImgTouchEnd}
              role="button"
              tabIndex={0}
              aria-label="Відкрити фото на весь екран"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setLightboxOpen(true); }}
            >
              {/* VARIANT B: blurred background fill — disabled, uncomment to restore
              <img
                src={activeImages[activeImg] ?? activeImages[0]}
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                style={{ transform: 'scale(1.22)', filter: 'blur(26px)', opacity: 0.62, zIndex: 0, objectPosition: 'center' }}
              />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.22) 100%)', zIndex: 1 }} />
              */}
              {/* Main image */}
              <img
                src={activeImages[activeImg] ?? activeImages[0]}
                alt={displayName}
                loading="eager"
                // @ts-ignore — fetchpriority is valid HTML but not yet in all TS defs
                fetchpriority="high"
                decoding="sync"
                className="w-full object-contain block"
                style={{
                  maxHeight: 'min(480px, 63vw)', minHeight: '220px',
                  pointerEvents: 'none', position: 'relative', zIndex: 2,
                  filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.40))',
                }}
              />
              {discount && (
                <div
                  className="absolute top-4 left-4 bg-[#E8232A] text-white text-sm font-bold font-inter px-3 py-1 rounded"
                  style={{ pointerEvents: 'none', zIndex: 3 }}
                >
                  -{discount}%
                </div>
              )}
              {/* Expand icon hint — pointer-events none so tap reaches container */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', bottom: 10, right: 10, zIndex: 3,
                  background: 'rgba(0,0,0,0.52)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  padding: '6px 8px',
                  lineHeight: 0,
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  pointerEvents: 'none',
                }}
              >
                <ZoomIn size={14} color="#fff" />
              </div>
            </div>
            {activeImages.length > 1 && (
              <div className="flex gap-1 overflow-x-auto pb-1 mt-2 gallery-thumbs">
                {activeImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeImg ? 'border-[#E8232A]' : 'border-[#2E2E2E] hover:border-[#A0A0A0]'
                    }`}
                  >
                    <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buy block — sticky on desktop */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-inter text-[#E8232A] text-sm font-semibold mb-1">{product.brand}</p>
            <h1 className="font-unbounded text-white text-[0.92rem] lg:text-2xl font-bold mb-2.5 leading-[1.35] line-clamp-3 lg:line-clamp-none">
              {displayName}
            </h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < Math.round(product.rating) ? 'text-[#E8232A] fill-[#E8232A]' : 'text-[#2E2E2E]'} />
                  ))}
                </div>
                <span className="font-inter text-[#A0A0A0] text-sm">{product.rating} ({product.reviewCount} відгуків)</span>
              </div>
            )}

            {/* Price — from active offer */}
            <div className="flex items-center gap-3 mb-5">
              <span className="font-unbounded text-white text-[1.4rem] lg:text-3xl font-bold">
                {displayPrice.toLocaleString('uk-UA')} грн
              </span>
              {displayOldPrice && (
                <span className="font-inter text-[#A0A0A0] text-base lg:text-lg line-through">
                  {displayOldPrice.toLocaleString('uk-UA')} грн
                </span>
              )}
              <AvailabilityBadge available={displayAvailable} />
            </div>

            {/* Variant picker (color) */}
            {product.variants && product.variants.length > 1 && (() => {
              const isBeltSwatch = product.productType === 'belts' && (product.sportSlug === 'bjj' || product.sportSlug === 'grappling');
              return (
                <div className="mb-5">
                  <p className="font-inter text-white text-sm font-semibold mb-2">
                    Колір: <span className="text-[#A0A0A0] font-normal">{displayColor}</span>
                  </p>
                  <div className={`flex flex-wrap ${isBeltSwatch ? 'gap-1.5' : 'gap-2'}`}>
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
                        const isActive = i === selectedVariantIdx;
                        return (
                          <button
                            key={i}
                            onClick={() => handleColorChange(i)}
                            title={v.color}
                            style={{
                              ...swatchStyle,
                              width: 36,
                              height: 16,
                              borderRadius: 4,
                              border: `2px solid ${isActive ? '#E8232A' : '#2E2E2E'}`,
                              transform: isActive ? 'scaleY(1.15)' : undefined,
                              transition: 'border-color 0.15s, transform 0.15s',
                            }}
                          />
                        );
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => handleColorChange(i)}
                          title={v.color}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            i === selectedVariantIdx ? 'border-[#E8232A] scale-110' : 'border-[#2E2E2E] hover:border-[#A0A0A0]'
                          }`}
                          style={swatchStyle}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Fit selector — shown when ≥2 fit siblings detected */}
            {fitSiblings.length >= 2 && currentFit && (
              <div className="mb-5">
                <p className="font-inter text-white text-sm font-semibold mb-2.5">Крій</p>
                <div className="flex flex-wrap gap-1.5">
                  {fitSiblings.map(s => (
                    <button
                      key={s.fit}
                      onClick={() => { window.location.href = `/product/${s.productId}`; }}
                      className="font-inter font-medium transition-all duration-150 active:scale-95"
                      style={s.fit === currentFit ? {
                        fontSize: '12.5px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: '#E8232A',
                        border: '1px solid #E8232A',
                        color: '#fff',
                        whiteSpace: 'nowrap',
                      } : {
                        fontSize: '12.5px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: '#1A1A1A',
                        border: '1px solid #2E2E2E',
                        color: 'rgba(255,255,255,0.75)',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => {
                        if (s.fit !== currentFit)
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(232,35,42,0.55)';
                      }}
                      onMouseLeave={e => {
                        if (s.fit !== currentFit)
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#2E2E2E';
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {/* Active fit description */}
                <p
                  className="font-inter"
                  style={{
                    marginTop: '7px',
                    fontSize: '11.5px',
                    color: 'rgba(255,255,255,0.40)',
                    lineHeight: 1.4,
                  }}
                >
                  {FIT_DESCR[currentFit]}
                </p>
              </div>
            )}

            {/* Size picker — only sizes for active color */}
            {activeSizes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-inter text-white text-sm font-semibold">Розмір</p>
                  <button
                    onClick={() => setSizeModalOpen(true)}
                    className="
                      flex items-center gap-1.5
                      px-2.5 py-1 rounded-md
                      border border-[#E8232A]/40
                      text-[#E8232A] text-xs font-inter font-medium
                      hover:border-[#E8232A] hover:bg-[#E8232A]/8
                      active:scale-95
                      transition-all duration-150
                    "
                  >
                    <Ruler size={12} strokeWidth={2} className="shrink-0" />
                    Таблиця розмірів
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeSizes.map(s => {
                    // activeSizeMap already deduped: true = at least one offer available
                    const sizeAvailable = activeSizeMap.get(s) ?? true;
                    return (
                      <button
                        key={s}
                        onClick={() => handleSizeChange(s)}
                        className={`relative px-4 py-2 rounded border text-sm font-inter font-medium transition-all ${
                          selectedSize === s
                            ? 'bg-[#E8232A] border-[#E8232A] text-white'
                            : sizeAvailable
                              ? 'bg-[#1A1A1A] border-[#2E2E2E] text-white hover:border-[#E8232A]'
                              : 'bg-[#1A1A1A] border-[#2E2E2E] text-[#505050] cursor-pointer'
                        }`}
                      >
                        {s}
                        {!sizeAvailable && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="absolute w-full h-[1px] bg-[#505050] rotate-[-20deg]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>


              </div>
            )}

            {sizeError && (
              <p className="text-[#E8232A] font-inter text-sm mb-3">Оберіть розмір перед додаванням у кошик</p>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col gap-2 mb-6">
              {!displayAvailable ? (
                /* ── Unavailable variant card ── */
                <>
                  <UnavailableCard
                    restockDate={activeSizeOffer?.restockDate}
                    onNotify={() => setNotifyOpen(true)}
                  />
                  {/* Secondary Telegram link stays visible */}
                  <a
                    href={`https://t.me/gistore_ua?text=${telegramMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 font-inter font-medium transition-all duration-150 active:scale-[0.99]"
                    style={{
                      fontSize: '12.5px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid rgba(42,171,238,0.25)',
                      color: 'rgba(255,255,255,0.55)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(42,171,238,0.55)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.80)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(42,171,238,0.25)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)';
                    }}
                  >
                    <MessageCircle size={13} style={{ color: '#2AABEE', flexShrink: 0 }} />
                    Швидке замовлення в Telegram
                  </a>
                </>
              ) : (
                /* ── Available: standard CTA ── */
                <>
                  <button
                    onClick={handleAddToCart}
                    className={`w-full flex items-center justify-center gap-2 font-bold font-inter text-base py-4 rounded transition-all duration-300 ${
                      added ? 'bg-green-600 text-white' : 'text-white'
                    }`}
                    style={!added ? { background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' } : undefined}
                    onMouseEnter={e => {
                      if (!added)
                        (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #C41E1E 0%, #991B1B 100%)';
                    }}
                    onMouseLeave={e => {
                      if (!added)
                        (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)';
                    }}
                  >
                    {added
                      ? <><Check size={20} /> Додано в кошик</>
                      : <><ShoppingBag size={20} /> В кошик</>
                    }
                  </button>
                  {/* Telegram — secondary ghost action */}
                  <a
                    href={`https://t.me/gistore_ua?text=${telegramMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 font-inter font-medium transition-all duration-150 active:scale-[0.99]"
                    style={{
                      fontSize: '12.5px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid rgba(42,171,238,0.25)',
                      color: 'rgba(255,255,255,0.55)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(42,171,238,0.55)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.80)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(42,171,238,0.25)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)';
                    }}
                  >
                    <MessageCircle size={13} style={{ color: '#2AABEE', flexShrink: 0 }} />
                    Швидке замовлення в Telegram
                  </a>
                </>
              )}
            </div>

            {/* Trust chips */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, text: 'Доставка 1–2 дні' },
                { icon: RefreshCw, text: 'Обмін 14 днів' },
                { icon: Package, text: 'Оригінал' },
              ].map(item => (
                <div key={item.text} className="flex flex-col items-center gap-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-3 text-center">
                  <item.icon size={20} className="text-[#E8232A]" />
                  <span className="font-inter text-[#A0A0A0] text-xs">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Description + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8 mb-16">

          {/* Left column — info blocks */}
          <div className="lg:col-span-2 space-y-5">

            {/* Про товар */}
            <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6">
              <h2 className="font-unbounded text-white text-base font-bold mb-4">Про товар</h2>

              <p className="font-inter text-[#A0A0A0] text-sm leading-relaxed mb-5">
                {preview}
              </p>

              {/* Characteristics grid — all from active offer; hide if override has its own specs */}
              {chars.length > 0 && !(override?.specs && Object.keys(override.specs).length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {chars.map(row => (
                    <div key={row.label}>
                      <p className="font-inter text-[#606060] text-[11px] uppercase tracking-wide mb-0.5">{row.label}</p>
                      <p className="font-inter text-white text-sm font-medium leading-snug">{row.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Full description — single accordion for both mobile and desktop */}
              {override ? (() => {
                const hasUsage    = !!(override.usage && override.usage.length > 0);
                const hasWhoFor   = !!override.whoFor;
                const hasSpecs    = !!(override.specs && Object.keys(override.specs).length > 0);
                const hasFeats    = override.features.length > 0;
                const hasCare2    = !!override.care2;
                const hasExtended = hasUsage || hasWhoFor || hasSpecs || hasFeats || hasCare2;
                if (!hasExtended) return null;

                const filteredFeats = override.features.filter(
                  f => !/^(доступн|модель доступна|розміри?\s*:)/i.test(f.trim())
                );

                return (
                  <div className="mt-5 border-t border-[#2E2E2E] pt-4">
                    {showOverrideDetail && (
                      <div className="space-y-4 mb-4">
                        {hasUsage && (
                          <div>
                            <p className="font-inter text-[#888] text-xs uppercase tracking-widest mb-2">Для чого використовується</p>
                            <ul className="space-y-1.5">
                              {override.usage!.map(u => (
                                <li key={u} className="flex items-start gap-2 font-inter text-[#C0C0C0] text-sm leading-snug">
                                  <span className="text-[#E8232A] mt-0.5 shrink-0">—</span>
                                  {u}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {hasWhoFor && (
                          <div>
                            <p className="font-inter text-[#888] text-xs uppercase tracking-widest mb-2">Кому підійде</p>
                            <p className="font-inter text-[#C0C0C0] text-sm leading-snug">{override.whoFor}</p>
                          </div>
                        )}
                        {hasSpecs && (
                          <div>
                            <p className="font-inter text-[#888] text-xs uppercase tracking-widest mb-2">Характеристики</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                              {Object.entries(override.specs!).map(([key, val]) => (
                                <div key={key} className="flex items-baseline gap-1.5 font-inter text-sm leading-snug min-w-0">
                                  <span className="text-[#606060] shrink-0">{key}:</span>
                                  <span className="text-[#C0C0C0]">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {hasFeats && (
                          <div>
                            <p className="font-inter text-[#888] text-xs uppercase tracking-widest mb-2">Особливості</p>
                            <ul className="space-y-1.5">
                              {filteredFeats.map(f => (
                                <li key={f} className="flex items-start gap-2 font-inter text-[#C0C0C0] text-sm leading-snug">
                                  <span className="text-[#E8232A] mt-0.5 shrink-0">—</span>
                                  {f}
                                </li>
                              ))}
                              {override.audience && (
                                <li className="flex items-start gap-2 font-inter text-[#C0C0C0] text-sm leading-snug pt-1">
                                  <span className="text-[#E8232A] mt-0.5 shrink-0">—</span>
                                  {override.audience}
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        {hasCare2 && (
                          <div>
                            <p className="font-inter text-[#888] text-xs uppercase tracking-widest mb-2">Догляд та використання</p>
                            <p className="font-inter text-[#C0C0C0] text-sm leading-snug">{override.care2}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setShowOverrideDetail(v => !v)}
                      className="flex items-center gap-1.5 text-[#E8232A] text-sm font-inter font-medium hover:text-[#ff4a50] transition-colors"
                    >
                      {showOverrideDetail ? 'Згорнути опис' : 'Показати повний опис'}
                      {showOverrideDetail
                        ? <ChevronUp size={15} className="shrink-0" />
                        : <ChevronDown size={15} className="shrink-0" />
                      }
                    </button>
                  </div>
                );
              })() : hasMore && (
                <div className="mt-5 border-t border-[#2E2E2E] pt-4">
                  {showFullDesc && (
                    <p className="font-inter text-[#A0A0A0] text-sm leading-relaxed mb-3 whitespace-pre-line">
                      {rawDesc}
                    </p>
                  )}
                  <button
                    onClick={() => setShowFullDesc(v => !v)}
                    className="flex items-center gap-1.5 text-[#E8232A] text-sm font-inter font-medium"
                  >
                    {showFullDesc ? 'Згорнути' : 'Повний опис'}
                    {showFullDesc ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              )}
            </div>

            {/* Що входить у комплект */}
            {includes.length > 0 && (
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6">
                <h2 className="font-unbounded text-white text-base font-bold mb-4">Що входить у комплект</h2>
                <ul className="space-y-2.5">
                  {includes.map(item => (
                    <li key={item} className="flex items-center gap-3 font-inter text-[#C0C0C0] text-sm">
                      <Check size={16} className="text-[#E8232A] shrink-0" />
                      {item}
                    </li>
                  ))}
                  {override && !override.kitFixed && kitResult?.beltStatus === 'excluded' && (
                    <li className="flex items-center gap-3 font-inter text-[#808080] text-sm mt-1">
                      <MinusCircle size={16} className="text-[#606060] shrink-0" />
                      Пояс не входить у комплект
                    </li>
                  )}
                </ul>

                {/* Gifts (e.g. BUDOGI BJJ backpack) */}
                {kitGifts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#2E2E2E]">
                    <p className="font-inter text-[#808080] text-xs uppercase tracking-wider mb-2.5">У подарунок</p>
                    <ul className="space-y-2">
                      {kitGifts.map(gift => (
                        <li key={gift} className="flex items-center gap-2.5 font-inter text-[#C0C0C0] text-sm">
                          <span className="text-base leading-none">🎁</span>
                          {gift}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Belt excluded note */}
                {beltNote && !override && (
                  <p className="mt-3 font-inter text-[#808080] text-xs flex items-center gap-1.5">
                    <span className="text-[#E8232A]">✕</span>
                    {beltNote}
                  </p>
                )}
              </div>
            )}

            {/* Догляд за виробом */}
            {care.length > 0 && (
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6">
                <h2 className="font-unbounded text-white text-base font-bold mb-4">Догляд за виробом</h2>
                {care.length === 1 ? (
                  <p className="font-inter text-[#D0D0D0] text-sm leading-relaxed border-l-2 border-[#E8232A] pl-4">
                    {care[0]}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {care.map((item, i) => {
                      const careIcons = [Thermometer, Gauge, Ban, Wind];
                      const Icon = careIcons[i] ?? Wind;
                      return (
                        <li key={item} className="flex items-center gap-3 font-inter text-[#C0C0C0] text-sm">
                          <Icon size={15} className="text-[#E8232A] shrink-0" />
                          {item}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">

            {/* Доставка, оплата та обмін */}
            <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-5">
              <h3 className="font-unbounded text-white text-sm font-bold mb-4">Доставка, оплата та обмін</h3>
              <div className="space-y-0">

                {/* Доставка — Нова Пошта */}
                <div className="flex gap-3 pb-4">
                  <div className="shrink-0 w-8 h-8 bg-[#E8232A]/10 rounded-lg flex items-center justify-center mt-0.5">
                    <Truck size={16} className="text-[#E8232A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-inter text-white text-sm font-semibold leading-tight">Нова Пошта</p>
                    <p className="font-inter text-[#A0A0A0] text-xs mt-1 leading-relaxed">Відділення, поштомат або кур'єр — за тарифами перевізника</p>
                  </div>
                </div>

                <div className="border-t border-[#2E2E2E]" />

                {/* Оплата */}
                <div className="flex gap-3 py-4">
                  <div className="shrink-0 w-8 h-8 bg-[#E8232A]/10 rounded-lg flex items-center justify-center mt-0.5">
                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                      <rect x="1" y="3" width="14" height="10" rx="2" stroke="#E8232A" strokeWidth="1.4"/>
                      <path d="M1 6H15" stroke="#E8232A" strokeWidth="1.4"/>
                      <rect x="3" y="9" width="4" height="1.5" rx="0.75" fill="#E8232A"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-inter text-white text-sm font-semibold leading-tight">Оплата</p>
                    <p className="font-inter text-[#A0A0A0] text-xs mt-1.5 leading-relaxed">Оплата при отриманні</p>
                    <p className="font-inter text-[#A0A0A0] text-xs mt-0.5 leading-relaxed flex items-center gap-1.5">
                      Онлайн через <LiqPaySVG height={13} />
                    </p>
                    {/* Payment brand icons — unified dark badge style */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                        <VisaSVG width={34} />
                      </div>
                      <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                        <MastercardSVG size={28} />
                      </div>
                      <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                        <GooglePaySVG height={16} />
                      </div>
                      <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                        <ApplePaySVG height={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#2E2E2E]" />

                {/* Обмін */}
                <div className="flex gap-3 pt-4">
                  <div className="shrink-0 w-8 h-8 bg-[#E8232A]/10 rounded-lg flex items-center justify-center mt-0.5">
                    <RefreshCw size={15} className="text-[#E8232A]" />
                  </div>
                  <div>
                    <p className="font-inter text-white text-sm font-semibold leading-tight">Обмін або повернення</p>
                    <p className="font-inter text-[#A0A0A0] text-xs mt-1">14 днів без питань</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Не впевнені в розмірі */}
            <div className="bg-[#1F1215] border border-[#E8232A]/30 rounded-xl p-6">
              <h3 className="font-unbounded text-white text-sm font-bold mb-2">Не впевнені в розмірі?</h3>
              <p className="font-inter text-[#A0A0A0] text-xs mb-4 leading-relaxed">
                Напишіть нам зріст і вагу — підберемо ідеальний розмір.
              </p>
              <a
                href={`https://t.me/gistore_ua?text=${encodeURIComponent('Допоможіть підібрати розмір для: ' + displayName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#E8232A] hover:bg-[#C41E24] text-white font-bold font-inter text-sm py-3 rounded-lg transition-all"
              >
                <MessageCircle size={16} />
                Запитати в Telegram
              </a>
            </div>
          </div>
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <section>
            <div className="mb-6 lg:mb-8">
              <span className="section-label">Також купують</span>
              <h2 className="font-unbounded text-white text-xl lg:text-2xl font-black">Часто купують разом</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && activeImages.length > 0 && (
        <ImageLightbox
          images={activeImages}
          initialIndex={activeImg}
          alt={displayName}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Size chart modal */}
      <SizeChartModal
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        chartImages={chartImages}
        fallbackTable={chartImages.length === 0}
      />

      {/* Notify availability modal */}
      <NotifyModal
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        payload={{
          productName:   displayName,
          brand:         product?.brand ?? '',
          color:         displayColor,
          size:          selectedSize,
          fit:           currentFit ?? '',
          vendorCode:    displayVendorCode,
          restockDate:   activeSizeOffer?.restockDate,
          productUrl:    typeof window !== 'undefined' ? window.location.href : '',
        }}
      />
    </div>
  );
}
