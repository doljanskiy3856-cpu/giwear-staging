import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ChevronRight,
  Zap,
  Truck,
  RotateCcw,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Product, ProductType } from '../data/products';
import ProductCard from '../components/ProductCard';
import CrossSellBlock from '../components/CrossSellBlock';

import { PRODUCT_TYPE_LABELS, SIZE_DIMENSION_LABELS } from '../../lib/categories';

/* ══════════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════════ */
type CategoryKey = 'karate' | 'judo' | 'bjj' | 'sambo' | 'aikido' | 'children' | 'dytiachy' | 'accessories' | 'bags' | 'trainers';

/** Categories where cross-sell "Додай до тренування" block is shown */
const CROSS_SELL_CATEGORIES = new Set<CategoryKey>(['karate', 'judo', 'bjj', 'sambo', 'aikido', 'children', 'dytiachy']);
const EXTRA_TYPES = new Set<ProductType>(['bags', 'belts', 'trainers']);
type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'available';

/** Normalize raw density strings like "335 гр/м.кв." → "335 г/м²" */
function normalizeDensity(raw: string): string {
  if (!raw) return '';
  const n = parseInt(raw, 10);
  if (!n) return raw;
  return `${n} г/м²`;
}

/* ══════════════════════════════════════════════════════════
   Belt size helpers
   Raw sizes for belts are stored as recommended height values
   (e.g. "130", "140") that map to actual belt lengths in cm.
══════════════════════════════════════════════════════════ */

/** Map: raw height value (as stored in product.sizes) → belt length in cm */
const BELT_HEIGHT_TO_LENGTH: Record<string, number> = {
  '120': 200,
  '130': 220,
  '140': 220,
  '150': 240,
  '160': 240,
  '170': 260,
  '180': 280,
  '190': 300,
};

/** All belt length groups, ordered by length */
const BELT_LENGTH_GROUPS: Array<{ lengthCm: number; rawSizes: string[]; label: string }> = [
  { lengthCm: 200, rawSizes: ['120'],        label: '200 см — на зріст 120 см' },
  { lengthCm: 220, rawSizes: ['130', '140'], label: '220 см — на зріст 130–140 см' },
  { lengthCm: 240, rawSizes: ['150', '160'], label: '240 см — на зріст 150–160 см' },
  { lengthCm: 260, rawSizes: ['170'],        label: '260 см — на зріст 170 см' },
  { lengthCm: 280, rawSizes: ['180'],        label: '280 см — на зріст 180 см' },
  { lengthCm: 300, rawSizes: ['190'],        label: '300 см — на зріст 190 см' },
  { lengthCm: 320, rawSizes: ['320'],        label: '320 см — на зріст 190+ см' },
];

/**
 * Normalize a raw belt size value to belt length cm string.
 * Accepts both raw height values ("130") and direct cm values ("220", "220cm", "220 см").
 * Returns e.g. "220" or "" if unknown.
 */
function normalizeBeltSize(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // Direct cm value — only accept actual belt lengths (≥200 cm), not height values like 180/190
  const directCm = parseInt(trimmed, 10);
  if (directCm >= 200 && directCm <= 400) return String(directCm);
  // Height-based lookup
  const mapped = BELT_HEIGHT_TO_LENGTH[trimmed];
  if (mapped) return String(mapped);
  return '';
}

/**
 * Get display label for a belt length cm value (e.g. "220" → "220 см — на зріст 130–140 см").
 * Falls back to "{n} см" if not in predefined groups.
 */
function formatBeltLengthLabel(lengthCmStr: string): string {
  const n = parseInt(lengthCmStr, 10);
  const group = BELT_LENGTH_GROUPS.find((g) => g.lengthCm === n);
  return group ? group.label : `${n} см`;
}

/**
 * Given a selected belt length (e.g. "220"), return all raw size values that map to it.
 * Used to match product.sizes against selected belt lengths.
 */
function beltLengthToRawSizes(lengthCmStr: string): string[] {
  const n = parseInt(lengthCmStr, 10);
  const group = BELT_LENGTH_GROUPS.find((g) => g.lengthCm === n);
  if (group) return [...group.rawSizes, lengthCmStr]; // also accept direct cm value
  return [lengthCmStr];
}

/** Sidebar filters */
interface FilterState {
  productTypes: ProductType[];
  brands: string[];
  sizes: string[];
  colors: string[];
  densities: string[]; // kimono/uniform only
}

/** Product types that can have density filter */
const DENSITY_TYPES: ProductType[] = ['kimono', 'uniform'];

// Trainers have no size filter; bags get their own bag-size filter
const NO_SIZE_TYPES: ProductType[] = ['trainers'];

const TYPE_ORDER: ProductType[] = [
  'kimono', 'uniform', 'belts', 'footwear',
  'tshirts', 'sauna_suit', 'bags', 'trainers', 'other', 'uncategorized',
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'popular',    label: 'Популярні' },
  { key: 'price_asc',  label: 'Спочатку дешевші' },
  { key: 'price_desc', label: 'Спочатку дорожчі' },
  { key: 'available',  label: 'В наявності' },
];

/* ══════════════════════════════════════════════════════════
   Category configs
══════════════════════════════════════════════════════════ */
type CategoryConfig = {
  title: string;
  h1: string;
  description: string;
  seoDesc: string;
  hero: string;
  heroMobile?: string;
  query: Record<string, string>;
};

const configs: Record<CategoryKey, CategoryConfig> = {
  karate: {
    title: 'Кімоно для карате',
    h1: 'Кімоно для карате',
    description: 'Тренувальні та змагальні кімоно для карате.',
    seoDesc: 'WKF-сумісні моделі, дитячі та дорослі.',
    hero: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80',
    query: { sportSlug: 'karate' },
  },
  judo: {
    title: 'Кімоно для дзюдо',
    h1: 'Кімоно для дзюдо',
    description: 'Тренувальні та змагальні кімоно для дзюдо.',
    seoDesc: 'IJF-сумісні моделі, дитячі та дорослі.',
    hero: '/hero-judo.jpg',
    heroMobile: '/hero-judo-mobile.webp',
    query: { sportSlug: 'judo' },
  },
  bjj: {
    title: 'BJJ / Джиу-джитсу / Грепплінг',
    h1: 'BJJ / Джиу-джитсу / Грепплінг',
    description: 'Гі для BJJ та grappling.',
    seoDesc: 'Всі розміри та кольори.',
    hero: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    query: { sportSlug: 'bjj,grappling' },
  },
  sambo: {
    title: 'Самбо',
    h1: 'Самбо — екіпірування та форма',
    description: 'Самбовки, форма та взуття для самбо.',
    seoDesc: 'Дитячі та дорослі моделі, всі розміри.',
    hero: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    query: { sportSlug: 'sambo' },
  },
  aikido: {
    title: 'Айкідо',
    h1: 'Айкідо — кімоно та екіпірування',
    description: 'Кімоно та екіпірування для айкідо.',
    seoDesc: 'Дитячі та дорослі моделі, всі розміри.',
    hero: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&q=80',
    query: { sportSlug: 'aikido' },
  },
  children: {
    title: 'Дитячі',
    h1: 'Дитячі товари',
    description: 'Дитячі товари з різних видів спорту.',
    seoDesc: 'Кімоно, пояси, взуття для дітей.',
    hero: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80',
    query: { isChildren: 'true' },
  },
  dytiachy: {
    title: 'Дитячі',
    h1: 'Дитячі товари',
    description: 'Дитячі товари з різних видів спорту.',
    seoDesc: 'Кімоно, пояси, взуття для дітей.',
    hero: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80',
    query: { isChildren: 'true' },
  },
  accessories: {
    title: 'Аксесуари',
    h1: 'Аксесуари для єдиноборств',
    description: 'Пояси, захист, сумки та корисне спорядження.',
    seoDesc: 'Пояси, захист, сумки та корисне спорядження для тренувань і змагань.',
    hero: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80',
    query: { productType: 'belts,bags,trainers,footwear,tshirts,sauna_suit,other' },
  },
  bags: {
    title: 'Сумки та рюкзаки',
    h1: 'Сумки та рюкзаки',
    description: 'Сумки, рюкзаки та валізи для тренувань і поїздок.',
    seoDesc: 'Широкий вибір спортивних сумок, рюкзаків та валіз для єдиноборств.',
    hero: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80',
    query: { productType: 'bags' },
  },
  trainers: {
    title: 'Тренажери',
    h1: 'Тренажери та інвентар',
    description: 'Снаряди та обладнання для тренувань.',
    seoDesc: 'Тренажери, канати, резини, захвати та інший спортивний інвентар.',
    hero: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
    query: { productType: 'trainers' },
  },
};

/* ══════════════════════════════════════════════════════════
   Quick Select — fast UX shortcuts above the catalog
══════════════════════════════════════════════════════════ */

/** A predicate that, given a product, returns true if it matches this quick filter */
type QuickFilterPredicate = (p: Product) => boolean;

interface QuickFilterDef {
  id: string;
  label: string;
  match: QuickFilterPredicate;
}

const QUICK_FILTERS: Record<CategoryKey, QuickFilterDef[]> = {
  judo: [
    {
      id: 'kimono',
      label: 'Кімоно для дзюдо',
      match: (p) => p.productType === 'kimono',
    },
    {
      id: 'children',
      label: 'Діти',
      // Model-based: judoLevel='children' is set explicitly per series (NXT, FUTURE 2, Koka, BEGINNER…)
      // Fallback: isChildren=true for products without judoLevel (e.g. legacy entries)
      match: (p) => p.productType === 'kimono' && (
        (p as any).judoLevel === 'children' ||
        (!(p as any).judoLevel && p.isChildren === true)
      ),
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      // BASIC 2, ULTRALIGHT, BUDOGI ADVANCED/PRO, Kintayo Wazari/Yuko adult…
      match: (p) => p.productType === 'kimono' && (p as any).judoLevel === 'teens_adults',
    },
    {
      id: 'professional',
      label: 'Професійні / IJF',
      // LEGEND 2 IJF (certified) + ULTRALIGHT (professional positioning, not IJF approved)
      match: (p) => p.productType === 'kimono' && (
        (p as any).judoLevel === 'professional' ||
        /ULTRALIGHT/i.test(p.name)
      ),
    },
    {
      id: 'belts',
      label: 'Пояси для дзюдо',
      match: (p) => p.productType === 'belts',
    },
    {
      id: 'bags',
      label: 'Сумки та рюкзаки',
      match: (p) => p.productType === 'bags',
    },
    {
      id: 'trainers',
      label: 'Тренажери',
      match: (p) => p.productType === 'trainers',
    },
    {
      id: 'tshirts',
      label: 'Футболки',
      match: (p) => p.productType === 'tshirts',
    },
  ],
  karate: [
    {
      id: 'kimono',
      label: 'Кімоно для карате',
      match: (p) => p.productType === 'kimono',
    },
    {
      id: 'children',
      label: 'Діти',
      match: (p) => p.productType === 'kimono' && p.isChildren === true,
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      match: (p) => p.productType === 'kimono' && !p.isChildren,
    },
    {
      id: 'belts',
      label: 'Пояси / аксесуари',
      match: (p) => p.productType === 'belts',
    },
    {
      id: 'bags',
      label: 'Сумки та рюкзаки',
      match: (p) => p.productType === 'bags',
    },
    {
      id: 'tshirts',
      label: 'Футболки',
      match: (p) => p.productType === 'tshirts',
    },
    {
      id: 'trainers',
      label: 'Тренажери',
      match: (p) => p.productType === 'trainers',
    },
  ],
  bjj: [
    {
      id: 'kimono',
      label: 'Кімоно BJJ / Gi',
      match: (p) => p.productType === 'kimono' && p.sportSlug === 'bjj',
    },
    {
      id: 'children',
      label: 'Діти',
      match: (p) => p.productType === 'kimono' && p.sportSlug === 'bjj' && p.isChildren === true,
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      match: (p) => p.productType === 'kimono' && p.sportSlug === 'bjj' && !p.isChildren,
    },
    {
      id: 'grappling',
      label: 'Грепплінг',
      match: (p) => p.sportSlug === 'grappling',
    },
    {
      id: 'belts',
      label: 'Пояси BJJ',
      match: (p) => p.productType === 'belts',
    },
    {
      id: 'bags',
      label: 'Сумки та рюкзаки',
      match: (p) => p.productType === 'bags',
    },
    {
      id: 'tshirts',
      label: 'Футболки',
      match: (p) => p.productType === 'tshirts',
    },
    {
      id: 'trainers',
      label: 'Тренажери',
      match: (p) => p.productType === 'trainers',
    },
  ],
  sambo: [
    // Sambo has only 3 products total — QuickSelectBar is suppressed via threshold (< 2 visible cards)
    // Keeping type-only cards in case inventory grows; age-split cards removed (pointless with 3 items)
    {
      id: 'uniform',
      label: 'Самбовки / форма',
      match: (p) => p.productType === 'kimono' || p.productType === 'uniform',
    },
    {
      id: 'footwear',
      label: 'Взуття для самбо',
      match: (p) => p.productType === 'footwear',
    },
    {
      id: 'belts',
      label: 'Пояси',
      match: (p) => p.productType === 'belts',
    },
    {
      id: 'bags',
      label: 'Сумки та рюкзаки',
      match: (p) => p.productType === 'bags',
    },
  ],
  aikido: [
    {
      id: 'kimono',
      label: 'Кімоно для айкідо',
      match: (p) => p.productType === 'kimono' || p.productType === 'uniform',
    },
    {
      id: 'children',
      label: 'Діти',
      match: (p) => (p.productType === 'kimono' || p.productType === 'uniform') && p.isChildren === true,
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      match: (p) => (p.productType === 'kimono' || p.productType === 'uniform') && !p.isChildren,
    },
    {
      id: 'belts',
      label: 'Пояси',
      match: (p) => p.productType === 'belts',
    },
    {
      id: 'bags',
      label: 'Сумки та рюкзаки',
      match: (p) => p.productType === 'bags',
    },
  ],
  children: [
    {
      id: 'karate',
      label: 'Дитяче карате',
      match: (p) => p.sportSlug === 'karate',
    },
    {
      id: 'judo',
      label: 'Дитяче дзюдо',
      match: (p) => p.sportSlug === 'judo',
    },
    {
      id: 'bjj',
      label: 'Дитяче BJJ / Грепплінг',
      match: (p) => p.sportSlug === 'bjj' || p.sportSlug === 'grappling',
    },
    {
      id: 'sambo',
      label: 'Дитяче самбо',
      match: (p) => p.sportSlug === 'sambo',
    },
    {
      id: 'aikido',
      label: 'Дитяче айкідо',
      match: (p) => p.sportSlug === 'aikido',
    },
    {
      id: 'kimono',
      label: 'Кімоно',
      match: (p) => p.productType === 'kimono',
    },
    {
      id: 'belts',
      label: 'Пояси',
      match: (p) => p.productType === 'belts',
    },
    {
      id: 'footwear',
      label: 'Взуття',
      match: (p) => p.productType === 'footwear',
    },
  ],
  dytiachy: [
    {
      id: 'karate',
      label: 'Дитяче карате',
      match: (p) => p.sportSlug === 'karate',
    },
    {
      id: 'judo',
      label: 'Дитяче дзюдо',
      match: (p) => p.sportSlug === 'judo',
    },
    {
      id: 'bjj',
      label: 'Дитяче BJJ / Грепплінг',
      match: (p) => p.sportSlug === 'bjj' || p.sportSlug === 'grappling',
    },
    {
      id: 'sambo',
      label: 'Дитяче самбо',
      match: (p) => p.sportSlug === 'sambo',
    },
    {
      id: 'aikido',
      label: 'Дитяче айкідо',
      match: (p) => p.sportSlug === 'aikido',
    },
    {
      id: 'kimono',
      label: 'Кімоно',
      match: (p) => p.productType === 'kimono',
    },
    {
      id: 'belts',
      label: 'Пояси',
      match: (p) => p.productType === 'belts',
    },
    {
      id: 'footwear',
      label: 'Взуття',
      match: (p) => p.productType === 'footwear',
    },
  ],
  accessories: [
    {
      id: 'belts',
      label: 'Пояси',
      match: (p) => p.productType === 'belts',
    },
    {
      id: 'bags',
      label: 'Сумки та рюкзаки',
      match: (p) => p.productType === 'bags',
    },
    {
      id: 'trainers',
      label: 'Тренажери',
      match: (p) => p.productType === 'trainers',
    },
    {
      id: 'footwear',
      label: 'Взуття',
      match: (p) => p.productType === 'footwear',
    },
    {
      id: 'tshirts',
      label: 'Футболки',
      match: (p) => p.productType === 'tshirts',
    },
  ],
  bags: [
    {
      id: 'backpack',
      label: 'Рюкзаки',
      match: (p) => p.productType === 'bags' && /рюкзак|backpack/i.test(p.name),
    },
    {
      id: 'bag',
      label: 'Сумки',
      match: (p) => p.productType === 'bags' && /сумка|bag/i.test(p.name),
    },
    {
      id: 'suitcase',
      label: 'Валізи',
      match: (p) => p.productType === 'bags' && /валіза|suitcase|travell|wheel/i.test(p.name),
    },
  ],
  trainers: [
    {
      id: 'all',
      label: 'Всі тренажери',
      match: () => true,
    },
    {
      id: 'rope',
      label: 'Канати',
      match: (p) => /канат/i.test(p.name),
    },
    {
      id: 'grip',
      label: 'Тренажери захвату',
      match: (p) => /захват|grip/i.test(p.name),
    },
    {
      id: 'uchi',
      label: 'Учі-комі',
      match: (p) => /uchi.kom|учі.ком/i.test(p.name),
    },
  ],
};

/* ══════════════════════════════════════════════════════════
   Sort
══════════════════════════════════════════════════════════ */
function applySort(products: Product[], sort: SortKey): Product[] {
  const arr = [...products];
  switch (sort) {
    case 'price_asc':  return arr.sort((a, b) => a.price - b.price);
    case 'price_desc': return arr.sort((a, b) => b.price - a.price);
    case 'available':  return arr.sort((a, b) => Number(b.available) - Number(a.available));
    default:
      return arr.sort(
        (a, b) =>
          Number(b.available) - Number(a.available) ||
          Number((b.sizes?.length ?? 0) > 0) - Number((a.sizes?.length ?? 0) > 0) ||
          a.name.localeCompare(b.name, 'uk'),
      );
  }
}

/* ══════════════════════════════════════════════════════════
   Filter helpers
══════════════════════════════════════════════════════════ */
const EMPTY: FilterState = {
  productTypes: [],
  brands: [],
  sizes: [],
  colors: [],
  densities: [],
};

function filtersEqual(a: FilterState, b: FilterState) {
  return (
    a.productTypes.join() === b.productTypes.join() &&
    a.brands.join()       === b.brands.join() &&
    a.sizes.join()        === b.sizes.join() &&
    a.colors.join()       === b.colors.join() &&
    a.densities.join()    === b.densities.join()
  );
}

function activeFilterCount(f: FilterState): number {
  return f.productTypes.length + f.brands.length + f.sizes.length + f.colors.length + f.densities.length;
}

function applyFilters(
  prods: Product[],
  f: FilterState,
  quickMatch?: QuickFilterPredicate | null,
): Product[] {
  return prods.filter((p) => {
    if (quickMatch && !quickMatch(p)) return false;
    if (f.productTypes.length && !f.productTypes.includes(p.productType)) return false;
    if (f.brands.length       && !f.brands.includes(p.brand))            return false;
    if (f.sizes.length) {
      if (p.productType === 'belts') {
        // f.sizes contains belt length cm values (e.g. "220")
        // match if any of the product's raw sizes maps to a selected belt length
        const matches = p.sizes.some((s) => {
          const normalized = normalizeBeltSize(s);
          return normalized && f.sizes.includes(normalized);
        });
        if (!matches) return false;
      } else {
        if (!p.sizes.some((s) => f.sizes.includes(s))) return false;
      }
    }
    if (f.colors.length       && !f.colors.includes(p.color))            return false;
    if (f.densities.length    && !f.densities.includes(normalizeDensity(p.density))) return false;
    return true;
  });
}

/**
 * Resolve which size label + types to show.
 * When multiple types are selected and they share the same label → show it.
 * When types mix different size labels → hide size filter (confusing).
 * When no type selected → use all present types.
 */
function resolveSizeContext(
  selectedTypes: ProductType[],
  allTypes: ProductType[],
): { label: string; types: ProductType[]; isBelt: boolean; isBag: boolean } | null {
  const scope = selectedTypes.length > 0 ? selectedTypes : allTypes;
  const sizedTypes = scope.filter((t) => !NO_SIZE_TYPES.includes(t));
  if (sizedTypes.length === 0) return null;

  const isBelt = sizedTypes.every((t) => t === 'belts');
  const isBag  = sizedTypes.every((t) => t === 'bags');

  // For bags: always show the size filter with its own label
  if (isBag) return { label: 'Розмір / об\'єм', types: sizedTypes, isBelt: false, isBag: true };

  const labels = Array.from(
    new Set(sizedTypes.map((t) => SIZE_DIMENSION_LABELS[t]).filter(Boolean)),
  ) as string[];

  // Multiple different size dimensions → don't mix them
  if (labels.length === 0) return null;
  if (labels.length > 1) return null; // e.g. kimono + belts selected together → hide

  const label = isBelt ? 'Довжина пояса' : labels[0];
  return { label, types: sizedTypes, isBelt, isBag: false };
}

/* ══════════════════════════════════════════════════════════
   Pluralisation helper
══════════════════════════════════════════════════════════ */
function pluralItems(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} товар`;
  if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return `${n} товари`;
  return `${n} товарів`;
}

/* ══════════════════════════════════════════════════════════
   Background image map for QuickSelectBar cards
══════════════════════════════════════════════════════════ */
const CARD_IMAGES: Record<string, string> = {
  kimono:      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=75',
  tshirts:     'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=75',
  children:    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=75',
  teens_adults:'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=75',
  adult:       '/bjj-adult.jpg',
  professional:'https://images.unsplash.com/photo-1600267165477-6d4cc741b379?w=600&q=75',
  ijf:         'https://images.unsplash.com/photo-1600267165477-6d4cc741b379?w=600&q=75',
  belts:       'https://images.unsplash.com/photo-1620906763360-d0bd98fd7e6b?w=600&q=75',
  bags:        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=75',
  trainers:    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=75',
  karate:      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=75',
  judo:        'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&q=75',
  bjj:         'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=75',
  grappling:   'https://images.unsplash.com/photo-1562771379-eafdca7a02f8?w=600&q=75',
  sambo:       'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=75',
  aikido:      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=75',
  uniform:     'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=75',
  footwear:    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=75',
};

/* ══════════════════════════════════════════════════════════
   QuickSelectBar — premium photo cards above catalog
══════════════════════════════════════════════════════════ */
function QuickSelectBar({
  category,
  prods,
  activeId,
  onNavigate,
}: {
  category: CategoryKey;
  prods: Product[];
  activeId: string | null;
  onNavigate: (id: string | null) => void;
}) {
  const defs = QUICK_FILTERS[category] ?? [];

  const cards = useMemo(
    () =>
      defs
        .map((d) => ({ ...d, count: prods.filter(d.match).length }))
        .filter((d) => d.count > 0),
    [defs, prods],
  );

  // Suppress bar if too few meaningful cards — no point in a one-card "quick select"
  if (cards.length < 2) return null;

  return (
    <div className="pb-2">
      {/* header */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-unbounded text-base lg:text-lg font-black text-white leading-tight">
          Швидкий вибір
        </h2>
        <p className="text-[12px] text-white/35 font-inter mt-1">
          Оберіть тип товарів або рівень підготовки
        </p>
      </div>

      {/* card grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((card) => {
          const active = card.id === activeId;
          const img = CARD_IMAGES[card.id];
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(active ? null : card.id)}
              className={[
                'group relative overflow-hidden rounded-xl border cursor-pointer text-left w-full',
                'transition-all duration-300',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8232A]/60',
                active
                  ? 'border-[#E8232A] shadow-[0_0_0_1px_rgba(232,35,42,0.25),0_6px_32px_rgba(232,35,42,0.2)] -translate-y-0.5'
                  : 'border-[#2E2E2E] hover:border-[#E8232A]/70 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.5)]',
              ].join(' ')}
              style={{ height: 'clamp(160px, 22vw, 210px)' }}
            >
              {/* fallback gradient — always behind photo */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] via-[#161616] to-[#0e0e0e]" />

              {/* background photo */}
              {img ? (
                <img
                  src={img}
                  alt=""
                  aria-hidden="true"
                  className={[
                    'absolute inset-0 w-full h-full object-cover pointer-events-none',
                    'transition-all duration-500',
                    active
                      ? 'opacity-55 scale-105'
                      : 'opacity-35 group-hover:opacity-55 group-hover:scale-105',
                  ].join(' ')}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}

              {/* strong bottom overlay for text legibility on any photo */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.75) 40%, rgba(8,8,8,0.25) 70%, rgba(8,8,8,0.05) 100%)',
                }}
              />

              {/* subtle top vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 40%)',
                }}
              />

              {/* active red tint */}
              {active && (
                <div className="absolute inset-0 bg-[#E8232A]/12 pointer-events-none" />
              )}

              {/* active pill */}
              {active && (
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8232A] shadow-[0_0_10px_rgba(232,35,42,0.6)]">
                  <span className="text-[10px] font-inter font-bold text-white tracking-wide leading-none">Обрано</span>
                </div>
              )}

              {/* content pinned to bottom — consistent padding across all cards */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-4 sm:px-5 sm:py-4 lg:px-5 lg:py-4">
                <h3 className="font-unbounded text-white text-[12.5px] sm:text-[13px] lg:text-[14px] font-black leading-snug line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  {card.label}
                </h3>
                <p className={[
                  'mt-1.5 text-[11.5px] sm:text-[12px] font-inter font-medium transition-colors duration-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]',
                  active ? 'text-white/75' : 'text-white/50 group-hover:text-white/75',
                ].join(' ')}>
                  {pluralItems(card.count)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Accordion
══════════════════════════════════════════════════════════ */
function Accordion({
  title,
  badge,
  children,
  defaultOpen = true,
}: {
  title: string;
  badge?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#1E1E1E] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center w-full py-3 text-left gap-2 group"
      >
        <span className="flex-1 text-[11px] font-semibold text-[#888] group-hover:text-[#B0B0B0] transition-colors tracking-widest uppercase">
          {title}
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="min-w-[18px] h-[18px] rounded-full bg-[#E8232A] text-white text-[9px] font-bold flex items-center justify-center px-1">
            {badge}
          </span>
        )}
        {open
          ? <ChevronUp   size={12} className="text-[#444] group-hover:text-[#666] flex-shrink-0 transition-colors" />
          : <ChevronDown size={12} className="text-[#444] group-hover:text-[#666] flex-shrink-0 transition-colors" />}
      </button>
      {open && <div className="pb-3 -mt-0.5">{children}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CheckRow — [checkbox] label            count
══════════════════════════════════════════════════════════ */
function CheckRow({
  label,
  checked,
  count,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  count?: number;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  const isDisabled = disabled && !checked;
  return (
    <label
      className={`flex items-center gap-2.5 px-1 py-[6px] rounded-md cursor-pointer group transition-colors select-none
        ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.03]'}`}
    >
      {/* box */}
      <span
        className={`flex-shrink-0 w-4 h-4 rounded-[3px] border flex items-center justify-center transition-all
          ${checked
            ? 'bg-[#E8232A] border-[#E8232A]'
            : 'border-[#333] group-hover:border-[#555]'}`}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      {/* label */}
      <span className={`flex-1 text-[13px] leading-none transition-colors
        ${checked ? 'text-white' : 'text-[#A0A0A0] group-hover:text-[#C8C8C8]'}`}>
        {label}
      </span>
      {/* count */}
      {count !== undefined && (
        <span className={`text-[11px] tabular-nums flex-shrink-0 transition-colors
          ${checked ? 'text-[#666]' : 'text-[#404040]'}`}>
          {count}
        </span>
      )}
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

/* ══════════════════════════════════════════════════════════
   SizeChip
══════════════════════════════════════════════════════════ */
function SizeChip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled && !selected}
      onClick={onClick}
      className={`h-[30px] min-w-[36px] px-2.5 rounded text-[12px] font-medium border transition-colors
        ${selected
          ? 'bg-[#E8232A] border-[#E8232A] text-white'
          : disabled
            ? 'border-[#1A1A1A] text-[#2E2E2E] cursor-not-allowed'
            : 'border-[#2A2A2A] text-[#888] hover:border-[#E8232A] hover:text-white'
        }`}
    >
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   FilterPanel — used in both sidebar and mobile drawer
══════════════════════════════════════════════════════════ */
function FilterPanel({
  prods,
  allProds,
  filters,
  setFilters,
}: {
  prods: Product[];
  allProds: Product[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}) {
  /**
   * allProductTypes — derived from allProds (full pool including bags/belts/trainers).
   * This gives user all available type options in the filter.
   */
  const allProductTypes = useMemo(() => {
    const present = new Set(allProds.map((p) => p.productType));
    return TYPE_ORDER.filter((t) => present.has(t));
  }, [allProds]);

  /* ── brands ── */
  const allBrands = useMemo(
    () =>
      Array.from(new Set(prods.map((p) => p.brand).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'uk')),
    [prods],
  );

  /* ── size context — single dimension only ── */
  const sizeCtx = useMemo(
    () => resolveSizeContext(filters.productTypes, allProductTypes),
    [filters.productTypes, allProductTypes],
  );

  /**
   * Sizes are built from products that match the current filters
   * EXCEPT the size filter itself (so we always show all available sizes
   * for the current type/brand/color selection).
   */
  const allSizes = useMemo(() => {
    if (!sizeCtx) return [];
    // base: apply all filters except sizes, scoped to the size-context types
    const base = prods.filter((p) => {
      if (!sizeCtx.types.includes(p.productType)) return false;
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.colors.length && !filters.colors.includes(p.color)) return false;
      return true;
    });
    if (sizeCtx.isBelt) {
      // Map raw sizes → belt length cm keys, deduplicate, order by length
      const lengthSet = new Set(
        base.flatMap((p) => p.sizes).map((s) => normalizeBeltSize(s)).filter(Boolean),
      );
      return Array.from(lengthSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    }
    if (sizeCtx.isBag) {
      // Bag sizes come pre-normalized from server; sort: letter sizes first, then litres, then dims
      const bagSizeOrder: Record<string, number> = { XS:0, S:1, M:2, L:3, XL:4, XXL:5 };
      return Array.from(new Set(base.flatMap((p) => p.sizes)))
        .filter(Boolean)
        .sort((a, b) => {
          const oa = bagSizeOrder[a] ?? 99, ob = bagSizeOrder[b] ?? 99;
          if (oa !== ob) return oa - ob;
          const na = parseFloat(a), nb = parseFloat(b);
          return isNaN(na) || isNaN(nb) ? a.localeCompare(b, 'uk') : na - nb;
        });
    }
    return Array.from(new Set(base.flatMap((p) => p.sizes)))
      .filter(Boolean)
      .sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        return isNaN(na) || isNaN(nb) ? a.localeCompare(b, 'uk') : na - nb;
      });
  }, [prods, sizeCtx, filters.brands, filters.colors]);

  /* ── colors ── */
  const allColors = useMemo(
    () =>
      Array.from(
        new Set(
          prods
            .filter((p) => {
              if (filters.productTypes.length && !filters.productTypes.includes(p.productType)) return false;
              if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
              return true;
            })
            .map((p) => p.color)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'uk')),
    [prods, filters.productTypes, filters.brands],
  );

  /* ── densities (kimono/uniform only) ── */
  const densityTypes = useMemo(
    () => allProductTypes.filter((t) => DENSITY_TYPES.includes(t)),
    [allProductTypes],
  );
  const showDensity = densityTypes.length > 0 &&
    (filters.productTypes.length === 0 || filters.productTypes.some((t) => DENSITY_TYPES.includes(t)));

  const allDensities = useMemo(() => {
    if (!showDensity) return [];
    const base = prods.filter((p) => {
      if (!DENSITY_TYPES.includes(p.productType)) return false;
      if (filters.productTypes.length && !filters.productTypes.includes(p.productType)) return false;
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.colors.length && !filters.colors.includes(p.color)) return false;
      return true;
    });
    return Array.from(new Set(base.map((p) => normalizeDensity(p.density)).filter(Boolean)))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [prods, showDensity, filters.productTypes, filters.brands, filters.colors]);

  /* ── count: how many products match all filters except this group ── */
  const countFor = useCallback(
    (group: 'productTypes' | 'brands' | 'sizes' | 'colors' | 'densities', value: string): number => {
      // For productType counting use allProds so bags/belts/trainers show real counts even when not yet selected
      const pool = group === 'productTypes' ? allProds : prods;
      return pool.filter((p) => {
        if (group !== 'productTypes' && filters.productTypes.length && !filters.productTypes.includes(p.productType)) return false;
        if (group !== 'brands'       && filters.brands.length       && !filters.brands.includes(p.brand))             return false;
        if (group !== 'sizes' && filters.sizes.length) {
          if (p.productType === 'belts') {
            const matches = p.sizes.some((s) => {
              const normalized = normalizeBeltSize(s);
              return normalized && filters.sizes.includes(normalized);
            });
            if (!matches) return false;
          } else {
            if (!p.sizes.some((s) => filters.sizes.includes(s))) return false;
          }
        }
        if (group !== 'colors'       && filters.colors.length       && !filters.colors.includes(p.color))             return false;
        if (group !== 'densities'    && filters.densities.length    && !filters.densities.includes(normalizeDensity(p.density))) return false;
        if (group === 'productTypes') return p.productType === value;
        if (group === 'brands')       return p.brand === value;
        if (group === 'sizes') {
          if (p.productType === 'belts') {
            // value is a belt length cm string (e.g. "220")
            return p.sizes.some((s) => normalizeBeltSize(s) === value);
          }
          return p.sizes.includes(value);
        }
        if (group === 'colors')       return p.color === value;
        if (group === 'densities')    return normalizeDensity(p.density) === value;
        return true;
      }).length;
    },
    [prods, allProds, filters],
  );

  /* ── toggles ── */
  const toggle = <K extends 'brands' | 'sizes' | 'colors' | 'densities'>(key: K, val: string) => {
    const cur = filters[key] as string[];
    setFilters({
      ...filters,
      [key]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val],
    });
  };

  const toggleType = (t: ProductType) => {
    const cur  = filters.productTypes;
    const next = cur.includes(t) ? cur.filter((v) => v !== t) : [...cur, t];
    // clear sizes when type changes — they may no longer apply
    setFilters({ ...filters, productTypes: next, sizes: [] });
  };

  return (
    <div>
      {/* ── Тип товару ── */}
      {allProductTypes.length > 1 && (
        <Accordion title="Тип товару" badge={filters.productTypes.length || undefined}>
          {allProductTypes.map((t) => {
            const cnt = countFor('productTypes', t);
            return (
              <CheckRow
                key={t}
                label={PRODUCT_TYPE_LABELS[t]}
                checked={filters.productTypes.includes(t)}
                count={cnt}
                disabled={cnt === 0}
                onChange={() => toggleType(t)}
              />
            );
          })}
        </Accordion>
      )}

      {/* ── Бренд ── */}
      {allBrands.length > 0 && (
        <Accordion title="Бренд" badge={filters.brands.length || undefined}>
          {allBrands.map((b) => {
            const cnt = countFor('brands', b);
            return (
              <CheckRow
                key={b}
                label={b}
                checked={filters.brands.includes(b)}
                count={cnt}
                disabled={cnt === 0}
                onChange={() => toggle('brands', b)}
              />
            );
          })}
        </Accordion>
      )}

      {/* ── Зріст / Довжина пояса / Розмір взуття — context-aware ── */}
      {sizeCtx && allSizes.length > 0 && (
        <Accordion title={sizeCtx.label} badge={filters.sizes.length || undefined}>
          {sizeCtx.isBelt ? (
            /* Belt: show full label per entry, use checkbox row style for wider labels */
            <div className="flex flex-col gap-0.5 pt-0.5">
              {allSizes.map((s) => {
                const cnt = countFor('sizes', s);
                const label = formatBeltLengthLabel(s);
                return (
                  <CheckRow
                    key={s}
                    label={label}
                    checked={filters.sizes.includes(s)}
                    count={cnt}
                    disabled={cnt === 0}
                    onChange={() => toggle('sizes', s)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {allSizes.map((s) => {
                const cnt = countFor('sizes', s);
                return (
                  <SizeChip
                    key={s}
                    label={s}
                    selected={filters.sizes.includes(s)}
                    disabled={cnt === 0}
                    onClick={() => toggle('sizes', s)}
                  />
                );
              })}
            </div>
          )}
        </Accordion>
      )}

      {/* ── Колір ── */}
      {allColors.length > 0 && (
        <Accordion title="Колір" badge={filters.colors.length || undefined} defaultOpen={false}>
          {allColors.map((c) => {
            const cnt = countFor('colors', c);
            return (
              <CheckRow
                key={c}
                label={c}
                checked={filters.colors.includes(c)}
                count={cnt}
                disabled={cnt === 0}
                onChange={() => toggle('colors', c)}
              />
            );
          })}
        </Accordion>
      )}

      {/* ── Щільність (кімоно/форма) ── */}
      {showDensity && allDensities.length > 1 && (
        <Accordion title="Щільність" badge={filters.densities.length || undefined} defaultOpen={false}>
          {allDensities.map((d) => {
            const cnt = countFor('densities', d);
            return (
              <CheckRow
                key={d}
                label={d}
                checked={filters.densities.includes(d)}
                count={cnt}
                disabled={cnt === 0}
                onChange={() => toggle('densities', d)}
              />
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ActiveChips — shown above the product grid
══════════════════════════════════════════════════════════ */
function ActiveChips({
  filters,
  setFilters,
  isBeltContext,
  isBagContext,
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  isBeltContext?: boolean;
  isBagContext?: boolean;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  filters.productTypes.forEach((t) =>
    chips.push({
      label: PRODUCT_TYPE_LABELS[t],
      onRemove: () =>
        setFilters({ ...filters, productTypes: filters.productTypes.filter((x) => x !== t), sizes: [] }),
    }),
  );
  filters.brands.forEach((b) =>
    chips.push({ label: b, onRemove: () => setFilters({ ...filters, brands: filters.brands.filter((x) => x !== b) }) }),
  );
  filters.sizes.forEach((s) => {
    const chipLabel = isBeltContext
      ? `Довжина пояса: ${formatBeltLengthLabel(s)}`
      : isBagContext
        ? `Розмір / об'єм: ${s}`
        : s;
    chips.push({ label: chipLabel, onRemove: () => setFilters({ ...filters, sizes: filters.sizes.filter((x) => x !== s) }) });
  });
  filters.colors.forEach((c) =>
    chips.push({ label: c, onRemove: () => setFilters({ ...filters, colors: filters.colors.filter((x) => x !== c) }) }),
  );
  filters.densities.forEach((d) =>
    chips.push({ label: d, onRemove: () => setFilters({ ...filters, densities: filters.densities.filter((x) => x !== d) }) }),
  );

  if (!chips.length) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-shrink-0">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={chip.onRemove}
          className="flex items-center gap-1.5 px-2.5 h-7 bg-[#1A1A1A] border border-[#282828] rounded text-[12px] text-[#B0B0B0] whitespace-nowrap hover:border-[#E8232A] hover:text-white transition-colors flex-shrink-0"
        >
          {chip.label}
          <X size={9} className="opacity-50" />
        </button>
      ))}
      <button
        onClick={() => setFilters(EMPTY)}
        className="text-[#484848] text-[12px] whitespace-nowrap flex-shrink-0 hover:text-[#E8232A] transition-colors ml-0.5"
      >
        Скинути всі
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Skeleton
══════════════════════════════════════════════════════════ */
function Skeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-[#1A1A1A] border border-[#222] rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-[3/4] bg-[#202020]" />
          <div className="p-3 space-y-2">
            <div className="h-2.5 bg-[#202020] rounded w-1/3" />
            <div className="h-3.5 bg-[#202020] rounded w-3/4" />
            <div className="h-3.5 bg-[#202020] rounded w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════ */
export default function CategoryPage({ category }: { category: CategoryKey }) {
  const cfg = configs[category as CategoryKey];

  // Safety: unknown category — show friendly 404-like state
  if (!cfg) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center pt-20">
        <div className="text-center px-4">
          <p className="font-unbounded text-[#E8232A] text-6xl font-black mb-4">404</p>
          <h1 className="font-unbounded text-white text-xl font-black mb-4">Категорію не знайдено</h1>
          <Link href="/" className="bg-[#E8232A] text-white font-bold font-inter px-8 py-3 rounded inline-block">
            На головну
          </Link>
        </div>
      </div>
    );
  }

  const [filters, setFilters] = useState<FilterState>(EMPTY);
  const [sort, setSort]       = useState<SortKey>('popular');
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** Quick Select — local state, synced to URL via replaceState */
  const [location] = useLocation();
  const search = useSearch();

  // Read initial ?quick= from URL on first render for this category
  const initialQuick = new URLSearchParams(search).get('quick') ?? null;
  const [quickId, setQuickId] = useState<string | null>(initialQuick);

  const quickDef = quickId ? (QUICK_FILTERS[category] ?? []).find((d) => d.id === quickId) ?? null : null;
  const quickMatch: QuickFilterPredicate | null = quickDef ? quickDef.match : null;

  /** Refs for scroll anchors */
  const mobileCatalogRef  = useRef<HTMLDivElement>(null);
  const desktopCatalogRef = useRef<HTMLDivElement>(null);
  const quickChoiceRef    = useRef<HTMLDivElement>(null);

  const HEADER_H = 64 + 8; // h-16 fixed header + 8px gap

  /** Scroll to an element with double-rAF (after React commit + layout) */
  const scrollToRef = useCallback((ref: React.RefObject<HTMLDivElement | null>, instant = false) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!ref.current) return;
        const top = ref.current.getBoundingClientRect().top + window.scrollY - HEADER_H;
        window.scrollTo({ top, behavior: instant ? 'instant' : 'smooth' });
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Scroll to catalog (mobile or desktop) */
  const scrollToCatalog = useCallback(() => {
    const isMobile = window.innerWidth < 1024;
    scrollToRef(isMobile ? mobileCatalogRef : desktopCatalogRef);
  }, [scrollToRef]);

  /** Scroll to quick-choice section */
  const scrollToQuickChoice = useCallback(() => {
    scrollToRef(quickChoiceRef);
  }, [scrollToRef]);

  /** Set or clear ?quick= param using replaceState (no re-render loop) */
  const handleQuickNavigate = (id: string | null) => {
    setQuickId(id);
    const params = new URLSearchParams(search);
    if (id) {
      params.set('quick', id);
    } else {
      params.delete('quick');
    }
    const qs = params.toString();
    window.history.replaceState(null, '', location + (qs ? '?' + qs : ''));
    // Always scroll to catalog on quick card click (mobile + desktop)
    if (id) scrollToCatalog();
  };

  // lock body scroll when filter drawer open (iOS-safe: position:fixed trick)
  useEffect(() => {
    if (!drawerOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top      = `-${scrollY}px`;
    body.style.width    = '100%';
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top      = prev.top;
      body.style.width    = prev.width;
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    };
  }, [drawerOpen]);

  const queryString = new URLSearchParams(cfg.query).toString();

  // Primary products — sport/children specific
  const { data: sportProds = [], isLoading: isLoadingSport } = useQuery<Product[]>({
    queryKey: ['products', category],
    queryFn: () => fetch(`/api/products?${queryString}`).then((r) => r.json()),
  });

  // Extra products — bags, belts, trainers (no sport filter, universal)
  const { data: extraProds = [], isLoading: isLoadingExtra } = useQuery<Product[]>({
    queryKey: ['products-extra'],
    queryFn: () => fetch('/api/products/cross-sell?types=bags,belts,trainers&limit=999').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingSport || isLoadingExtra;

  // Merged pool — sport products first, then extras (de-duped by id)
  const allProds = useMemo(() => {
    const sportIds = new Set(sportProds.map((p) => p.id));
    const extras = extraProds.filter((p) => !sportIds.has(p.id));
    return [...sportProds, ...extras];
  }, [sportProds, extraProds]);

  /**
   * Default product types visible when NO type filter is selected:
   * only the types that appear in sportProds (i.e. the sport-specific items).
   * When user selects a type filter explicitly, we show from allProds.
   */
  const sportTypes = useMemo(
    () => Array.from(new Set(sportProds.map((p) => p.productType))) as ProductType[],
    [sportProds],
  );

  /**
   * The effective product pool used for filtering & display:
   * - no type filter selected → only sportProds (default view)
   * - type filter selected → allProds (user explicitly chose a type)
   */
  const prods = useMemo(() => {
    if (filters.productTypes.length === 0) return sportProds;
    return allProds;
  }, [filters.productTypes, sportProds, allProds]);

  /** Read filter state from URL params (runs once after products load per category) */
  const filtersInitialized = useRef(false);

  useEffect(() => {
    setFilters(EMPTY);
    setSort('popular');
    setQuickId(null);
    filtersInitialized.current = false; // reset so URL params are re-read for new category
    // Clean ?quick= from URL on category change
    window.history.replaceState(null, '', location);
    // Scroll to top instantly so hero is visible, quick-choice scroll happens after data loads
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isLoading || filtersInitialized.current) return;
    filtersInitialized.current = true;
    const p = new URLSearchParams(search);
    const brands    = p.getAll('brand');
    const sizes     = p.getAll('size');
    const colors    = p.getAll('color');
    const densities = p.getAll('density');
    const types     = p.getAll('type') as ProductType[];
    if (brands.length || sizes.length || colors.length || densities.length || types.length) {
      setFilters({ productTypes: types, brands, sizes, colors, densities });
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Write filters to URL params whenever they change */
  useEffect(() => {
    const p = new URLSearchParams(search);
    // Remove existing filter params
    ['brand', 'size', 'color', 'density', 'type'].forEach((k) => p.delete(k));
    filters.productTypes.forEach((t) => p.append('type', t));
    filters.brands.forEach((b) => p.append('brand', b));
    filters.sizes.forEach((s) => p.append('size', s));
    filters.colors.forEach((c) => p.append('color', c));
    filters.densities.forEach((d) => p.append('density', d));
    const qs = p.toString();
    window.history.replaceState(null, '', location + (qs ? '?' + qs : ''));
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // After products load: if no quick filter selected → scroll to quick-choice section
  // If a quick filter was pre-selected (from URL) → scroll to catalog
  useEffect(() => {
    if (isLoading) return;
    if (initialQuick) {
      // URL had ?quick= → go straight to catalog
      scrollToCatalog();
    } else {
      // Normal navigation (from home page) → show quick-choice section
      scrollToQuickChoice();
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () => applySort(applyFilters(prods, filters, quickMatch), sort),
    [prods, filters, sort, quickMatch],
  );

  const hasFilters  = !filtersEqual(filters, EMPTY);
  const filterCount = activeFilterCount(filters);

  /** Derive size context for ActiveChips labels */
  const pageSizeCtx = useMemo(() => {
    const scope = filters.productTypes.length > 0
      ? filters.productTypes
      : Array.from(new Set(prods.map((p) => p.productType)));
    const sizedTypes = scope.filter((t) => !NO_SIZE_TYPES.includes(t));
    if (sizedTypes.length === 0) return { isBelt: false, isBag: false };
    return {
      isBelt: sizedTypes.every((t) => t === 'belts'),
      isBag:  sizedTypes.every((t) => t === 'bags'),
    };
  }, [filters.productTypes, prods]);
  const isBeltContext = pageSizeCtx.isBelt;
  const isBagContext  = pageSizeCtx.isBag;

  return (
    <div className="min-h-screen bg-[#0F0F0F] overflow-x-hidden">

      {/* ── Hero ── */}
      <style>{`
        .cat-htrust-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }
        @media (min-width: 1024px) {
          .cat-htrust-grid {
            display: flex;
            flex-direction: row;
            gap: 10px;
          }
        }
        /* ── Benefit card pulse animation (same as homepage) ── */
        @keyframes cat-htrust-blink {
          0%, 100% { border-color: rgba(255,255,255,0.07); }
          8%        { border-color: rgba(232,35,42,0.45); }
          16%       { border-color: rgba(255,255,255,0.07); }
        }
        .cat-htrust-card--1 { animation: cat-htrust-blink ease-in-out 5.5s 0s    infinite; }
        .cat-htrust-card--2 { animation: cat-htrust-blink ease-in-out 5.5s 1.5s  infinite; }
        .cat-htrust-card--3 { animation: cat-htrust-blink ease-in-out 5.5s 3.0s  infinite; }
        .cat-htrust-card--4 { animation: cat-htrust-blink ease-in-out 5.5s 4.5s  infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cat-htrust-card--1,.cat-htrust-card--2,.cat-htrust-card--3,.cat-htrust-card--4 { animation: none !important; }
        }
        /* mobile card — compact */
        .cat-htrust-card {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-radius: 9px;
        }
        .cat-htrust-icon {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: rgba(232,35,42,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E8232A;
        }
        .cat-htrust-title {
          font-family: 'Inter', sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin: 0;
        }
        .cat-htrust-sub {
          font-family: 'Inter', sans-serif;
          font-size: 9.5px;
          color: rgba(255,255,255,0.42);
          line-height: 1.3;
          margin: 1px 0 0;
        }
        /* desktop card — larger */
        @media (min-width: 1024px) {
          .cat-htrust-card {
            gap: 10px;
            padding: 10px 12px;
            border-radius: 10px;
          }
          .cat-htrust-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
          }
          .cat-htrust-title { font-size: 11.5px; }
          .cat-htrust-sub   { font-size: 10px; margin: 2px 0 0; }
        }
        /* hero background position */
        .cat-hero-bg {
          background-position: 60% center;
          background-size: cover;
        }
        @media (min-width: 1024px) {
          .cat-hero-bg {
            background-size: 100% auto;
            background-position: 55% 25%;
          }
        }
        /* hero height — mobile larger */
        .cat-hero-section {
          height: clamp(360px, 90vw, 460px);
        }
        @media (min-width: 640px) {
          .cat-hero-section {
            height: clamp(340px, 55vw, 420px);
          }
        }
        @media (min-width: 1024px) {
          .cat-hero-section {
            height: clamp(280px, 32vw, 380px);
          }
        }
      `}</style>
      <section
        className="cat-hero-section relative overflow-hidden flex items-end"
      >
        {/* Mobile hero bg (< lg) */}
        {(cfg.heroMobile ?? cfg.hero) && (
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              backgroundImage: `url(${cfg.heroMobile ?? cfg.hero})`,
              backgroundSize: 'cover',
              backgroundPosition: '45% center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
        {/* Desktop hero bg (lg+) */}
        {cfg.hero && (
          <div
            className="absolute inset-0 hidden lg:block cat-hero-bg"
            style={{
              backgroundImage: `url(${cfg.hero})`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}

        {/* Dark base so even if photo fails we have something */}
        <div className="absolute inset-0 bg-[#0A0A0A]" style={{ opacity: cfg.hero ? 0 : 1 }} />

        {/* Gradient overlay — strong on left/bottom for text, lighter on right to show photo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              'linear-gradient(to right, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.65) 45%, rgba(8,8,8,0.25) 100%)',
              'linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.60) 40%, rgba(8,8,8,0.10) 100%)',
            ].join(', '),
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-24 sm:pt-0">
          {/* breadcrumb */}
          <div className="flex items-center gap-1.5 text-[#585858] text-[11px] font-inter mb-3">
            <Link href="/" className="hover:text-[#E8232A] transition-colors">Головна</Link>
            <ChevronRight size={10} className="text-[#383838]" />
            <span className="text-[#787878]">{cfg.title}</span>
          </div>

          {/* Title + description */}
          <h1 className="font-unbounded text-2xl sm:text-3xl lg:text-[2rem] font-black text-white leading-tight mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {cfg.h1}
          </h1>
          <p className="font-inter text-white/60 text-sm sm:text-[15px] max-w-md leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] mb-5">
            {cfg.description}
          </p>

          {/* ── Trust cards ── */}
          <div className="cat-htrust-grid max-w-2xl lg:max-w-none">
            <div className="cat-htrust-card cat-htrust-card--1">
              <div className="cat-htrust-icon"><Truck size={13} /></div>
              <div>
                <p className="cat-htrust-title">Доставка по Україні</p>
                <p className="cat-htrust-sub">Нова пошта за 1–2 дні</p>
              </div>
            </div>
            <div className="cat-htrust-card cat-htrust-card--2">
              <div className="cat-htrust-icon"><RotateCcw size={13} /></div>
              <div>
                <p className="cat-htrust-title">Обмін і повернення</p>
                <p className="cat-htrust-sub">14 днів без питань</p>
              </div>
            </div>
            <div className="cat-htrust-card cat-htrust-card--3">
              <div className="cat-htrust-icon"><Shield size={13} /></div>
              <div>
                <p className="cat-htrust-title">Гарантія якості</p>
                <p className="cat-htrust-sub">Тільки перевірені бренди</p>
              </div>
            </div>
            <div className="cat-htrust-card cat-htrust-card--4">
              <div className="cat-htrust-icon"><MessageCircle size={13} /></div>
              <div>
                <p className="cat-htrust-title">Консультація</p>
                <p className="cat-htrust-sub">Telegram або Viber</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CATALOG SECTION — quick select + filters + grid ══ */}
      <section className="pt-0 pb-10 sm:pb-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

          {/* ══ QUICK SELECT BAR ══ */}
          {!isLoading && prods.length > 0 && (
            <div ref={quickChoiceRef} style={{ scrollMarginTop: '80px' }} className="mt-10 sm:mt-12 lg:mt-14">
              <QuickSelectBar
                category={category}
                prods={prods}
                activeId={quickId}
                onNavigate={handleQuickNavigate}
              />
            </div>
          )}

          {/* ══ MOBILE topbar ══ */}
          <div ref={mobileCatalogRef} style={{ scrollMarginTop: '80px' }} className="lg:hidden mt-6 mb-4 space-y-2">
            <div className="flex items-center gap-2">
              {/* count */}
              <span className="flex-1 text-[#909090] text-[13px] font-inter font-medium">
                {isLoading ? 'Завантаження…' : `Знайдено: ${filtered.length} товарів`}
              </span>

              {/* filter button */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="relative flex items-center gap-1.5 h-9 px-3.5 bg-[#181818] border border-[#282828] rounded-lg text-[13px] font-inter text-[#C0C0C0] hover:border-[#3E3E3E] hover:text-white transition-colors"
              >
                <Filter size={13} className="text-[#888]" />
                Фільтр
                {filterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-[#E8232A] text-white text-[9px] font-bold flex items-center justify-center">
                    {filterCount}
                  </span>
                )}
              </button>

              {/* sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-9 appearance-none bg-[#181818] border border-[#282828] rounded-lg pl-3 pr-7 text-[13px] font-inter text-[#C0C0C0] focus:outline-none focus:border-[#3E3E3E] transition-colors"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#505050] pointer-events-none" />
              </div>
            </div>

            {/* active chips row — quick + sidebar filters */}
            {(quickId || hasFilters) && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {quickId && (
                  <button
                    onClick={() => handleQuickNavigate(null)}
                    className="flex items-center gap-1.5 px-3 h-7 bg-[#E8232A]/15 border border-[#E8232A]/40 rounded-full text-[12px] font-medium text-[#E8232A] whitespace-nowrap hover:bg-[#E8232A]/25 transition-colors flex-shrink-0"
                  >
                    <Zap size={9} />
                    {quickDef?.label ?? quickId}
                    <X size={9} className="opacity-70" />
                  </button>
                )}
                {hasFilters && <ActiveChips filters={filters} setFilters={setFilters} isBeltContext={isBeltContext} isBagContext={isBagContext} />}
              </div>
            )}
          </div>

          {/* ══ DESKTOP layout ══ */}
          <div className="hidden lg:grid grid-cols-[280px_1fr] gap-8 items-start">

            {/* Sidebar */}
            <aside className="sticky top-24">
              <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden">

                {/* header */}
                <div className="flex items-center justify-between px-5 h-14 border-b border-[#1E1E1E]">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-[#E8232A]" />
                    <span className="text-[14px] font-semibold text-white font-inter">Фільтри</span>
                    {filterCount > 0 && (
                      <span className="text-[#505050] text-[12px] font-inter">({filterCount})</span>
                    )}
                  </div>
                  {hasFilters && (
                    <button
                      onClick={() => setFilters(EMPTY)}
                      className="text-[#484848] text-[11px] font-inter hover:text-[#E8232A] transition-colors"
                    >
                      Скинути
                    </button>
                  )}
                </div>

                {/* filters */}
                <div className="px-4 py-1">
                  <FilterPanel prods={prods} allProds={allProds} filters={filters} setFilters={setFilters} />
                </div>
              </div>
            </aside>

            {/* Products area */}
            <div className="min-w-0">
              {/* topbar */}
              <div ref={desktopCatalogRef} style={{ scrollMarginTop: '80px' }} className="flex items-center gap-3 mb-5 h-9">
                {/* left: count + active chips */}
                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                  {/* always-visible count */}
                  <span className="text-[#909090] text-[13px] font-inter font-medium flex-shrink-0">
                    {isLoading ? '…' : `Знайдено: ${filtered.length} товарів`}
                  </span>
                  {/* active filter chips */}
                  {quickId && (
                    <button
                      onClick={() => handleQuickNavigate(null)}
                      className="flex items-center gap-1.5 px-3 h-7 bg-[#E8232A]/15 border border-[#E8232A]/40 rounded-full text-[12px] font-medium text-[#E8232A] whitespace-nowrap hover:bg-[#E8232A]/25 transition-colors flex-shrink-0"
                    >
                      <Zap size={9} />
                      {quickDef?.label ?? quickId}
                      <X size={9} className="opacity-70" />
                    </button>
                  )}
                  {hasFilters && <ActiveChips filters={filters} setFilters={setFilters} isBeltContext={isBeltContext} isBagContext={isBagContext} />}
                </div>
                {/* sort */}
                <div className="relative flex-shrink-0">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="h-9 appearance-none bg-[#141414] border border-[#1E1E1E] rounded-lg pl-3 pr-8 text-[13px] font-inter text-[#C0C0C0] focus:outline-none focus:border-[#333] transition-colors cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#505050] pointer-events-none" />
                </div>
              </div>

              {/* grid */}
              {isLoading ? (
                <Skeleton />
              ) : filtered.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                  {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center py-24 gap-4">
                  <p className="text-white/40 text-[15px] font-inter">Товари не знайдено</p>
                  <p className="text-[#505050] text-[13px] font-inter text-center max-w-xs">
                    Спробуйте змінити або скинути фільтри
                  </p>
                  <button
                    onClick={() => { setFilters(EMPTY); handleQuickNavigate(null); }}
                    className="bg-[#E8232A] hover:bg-[#C41E24] text-white font-semibold font-inter text-sm px-6 py-2.5 rounded-lg transition-colors"
                  >
                    Очистити фільтри
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ══ MOBILE grid ══ */}
          <div className="lg:hidden">
            {isLoading ? (
              <Skeleton />
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center py-16 gap-4">
                <p className="text-white/40 text-[15px] font-inter">Товари не знайдено</p>
                <p className="text-[#505050] text-[13px] font-inter text-center max-w-xs">
                  Спробуйте змінити або скинути фільтри
                </p>
                <button
                  onClick={() => { setFilters(EMPTY); handleQuickNavigate(null); }}
                  className="bg-[#E8232A] hover:bg-[#C41E24] text-white font-semibold font-inter text-sm px-6 py-2.5 rounded-lg transition-colors"
                >
                  Очистити фільтри
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ══ CROSS-SELL — "Додай до тренування" ══ */}
      {CROSS_SELL_CATEGORIES.has(category) && filters.productTypes.every((t) => !EXTRA_TYPES.has(t)) && <CrossSellBlock />}


      {/* ══════════════════════════════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════════════════════════════ */}
      {/* backdrop */}
      <div
        className={`fixed inset-0 bg-black/75 z-40 lg:hidden transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden flex flex-col bg-[#141414] border-t border-[#1E1E1E] rounded-t-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1.5 flex-shrink-0">
          <div className="w-8 h-[3px] bg-[#2E2E2E] rounded-full" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 h-12 border-b border-[#1E1E1E] flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#E8232A]" />
            <span className="text-[14px] font-semibold text-white font-inter">Фільтри</span>
            {filterCount > 0 && (
              <span className="text-[#505050] text-[12px] font-inter">({filterCount})</span>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-[#505050] hover:text-white transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-1 min-h-0">
          <FilterPanel prods={prods} allProds={allProds} filters={filters} setFilters={setFilters} />
        </div>

        {/* sticky footer */}
        <div className="flex-shrink-0 px-4 pt-3 pb-8 border-t border-[#1E1E1E] flex gap-2">
          {hasFilters && (
            <button
              onClick={() => setFilters(EMPTY)}
              className="flex-1 h-11 border border-[#282828] rounded-lg text-[13px] font-inter text-[#888] hover:border-[#3E3E3E] hover:text-white transition-colors"
            >
              Очистити
            </button>
          )}
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex-[2] h-11 bg-[#E8232A] hover:bg-[#C41E24] text-white font-semibold font-inter text-[13px] rounded-lg transition-colors"
          >
            Показати {filtered.length} товарів
          </button>
        </div>
      </div>
    </div>
  );
}
