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

import { SIZE_DIMENSION_LABELS } from '../../lib/categories';

/* ══════════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════════ */
type CategoryKey = 'karate' | 'judo' | 'bjj' | 'sambo' | 'aikido' | 'children' | 'dytiachy' | 'accessories' | 'bags' | 'trainers' | 'brand';

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
type AudienceLevel = 'children' | 'teens_adults' | 'professional';

interface FilterState {
  typeFilters: string[];       // FilterableTypeDef ids — replaces raw productTypes
  audiences: AudienceLevel[]; // Для кого / рівень
  brands: string[];
  series: string[];           // Серія / модель
  sizes: string[];
  colors: string[];
  densities: string[]; // kimono/uniform only
  /** @deprecated legacy compat — kept so old URLs don't crash; mapped to typeFilters on read */
  productTypes?: ProductType[];
}

/** Which audience levels to show per category, with match logic */
interface AudienceDef {
  id: AudienceLevel;
  label: string;
  match: (p: Product) => boolean;
}

const AUDIENCE_LEVELS: Partial<Record<CategoryKey, AudienceDef[]>> = {
  judo: [
    {
      id: 'children',
      label: 'Діти',
      match: (p) =>
        (p as any).judoLevel === 'children' ||
        (!(p as any).judoLevel && p.isChildren === true),
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      match: (p) => (p as any).judoLevel === 'teens_adults',
    },
    {
      id: 'professional',
      label: 'Професійні / IJF',
      // LEGEND 2 IJF (certified) + ULTRALIGHT (pro positioning, NOT IJF approved) — both judoLevel='professional'
      match: (p) => (p as any).judoLevel === 'professional',
    },
  ],
  karate: [
    {
      id: 'children',
      label: 'Діти',
      match: (p) => p.isChildren === true,
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      match: (p) => !p.isChildren,
    },
  ],
  bjj: [
    {
      id: 'children',
      label: 'Діти',
      match: (p) => p.isChildren === true,
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      match: (p) => !p.isChildren,
    },
  ],
  aikido: [
    {
      id: 'children',
      label: 'Діти',
      match: (p) => p.isChildren === true,
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      match: (p) => !p.isChildren,
    },
  ],
  sambo: [
    {
      id: 'children',
      label: 'Діти',
      match: (p) => p.isChildren === true,
    },
    {
      id: 'teens_adults',
      label: 'Підлітки та дорослі',
      match: (p) => !p.isChildren,
    },
  ],
};

/** Product types that can have density filter */
const DENSITY_TYPES: ProductType[] = ['kimono', 'uniform'];

/**
 * Product types where the "Для кого / рівень" (audience) filter is NOT applicable.
 * When user selects one of these types, any active audience filter is automatically cleared.
 * This prevents the "Діти + Пояси → 0 товарів" UX bug.
 */
const TYPES_WITHOUT_AUDIENCE = new Set<ProductType>(['belts', 'bags', 'trainers', 'other']);

// Trainers have no size filter; bags get their own bag-size filter
const NO_SIZE_TYPES: ProductType[] = ['trainers'];

const TYPE_ORDER: ProductType[] = [
  'kimono', 'uniform', 'belts', 'footwear',
  'tshirts', 'sauna_suit', 'bags', 'trainers', 'other', 'uncategorized',
];

/* ── FilterableType — virtual type chips that combine productType + sportSlug ── */
interface FilterableTypeDef {
  id: string;
  label: string;
  /** Real ProductType(s) this maps to — used to derive size context, density, audience compat */
  productTypes: ProductType[];
  match: (p: Product) => boolean;
}

const FT_JUDO_KIMONO:      FilterableTypeDef = { id: 'kimono:judo',      label: 'Кімоно для дзюдо',      productTypes: ['kimono'],            match: (p) => p.productType === 'kimono'   && p.sportSlug === 'judo' };
const FT_BJJ_KIMONO:       FilterableTypeDef = { id: 'kimono:bjj',       label: 'Кімоно для BJJ',         productTypes: ['kimono'],            match: (p) => p.productType === 'kimono'   && p.sportSlug === 'bjj' };
const FT_KARATE_KIMONO:    FilterableTypeDef = { id: 'kimono:karate',     label: 'Кімоно для карате',      productTypes: ['kimono'],            match: (p) => p.productType === 'kimono'   && p.sportSlug === 'karate' };
const FT_AIKIDO_KIMONO:    FilterableTypeDef = { id: 'kimono:aikido',     label: 'Кімоно для айкідо',      productTypes: ['kimono'],            match: (p) => p.productType === 'kimono'   && p.sportSlug === 'aikido' };
const FT_SAMBO_UNIFORM:    FilterableTypeDef = { id: 'uniform:sambo',     label: 'Форма для самбо',        productTypes: ['uniform', 'kimono'], match: (p) => (p.productType === 'uniform' || p.productType === 'kimono') && p.sportSlug === 'sambo' };
const FT_GRAPPLING_UNIFORM:FilterableTypeDef = { id: 'uniform:grappling', label: 'Форма для греплінгу',   productTypes: ['uniform', 'kimono'], match: (p) => (p.productType === 'uniform' || p.productType === 'kimono') && p.sportSlug === 'grappling' };
const FT_BELTS:            FilterableTypeDef = { id: 'belts',             label: 'Пояси',                  productTypes: ['belts'],             match: (p) => p.productType === 'belts' };
const FT_BAGS:             FilterableTypeDef = { id: 'bags',              label: 'Сумки та рюкзаки',       productTypes: ['bags'],              match: (p) => p.productType === 'bags' };
const FT_TRAINERS:         FilterableTypeDef = { id: 'trainers',          label: 'Тренажери',              productTypes: ['trainers'],          match: (p) => p.productType === 'trainers' };
const FT_FOOTWEAR:         FilterableTypeDef = { id: 'footwear',          label: 'Взуття',                 productTypes: ['footwear'],          match: (p) => p.productType === 'footwear' };
const FT_TSHIRTS:          FilterableTypeDef = { id: 'tshirts',           label: 'Футболки',               productTypes: ['tshirts'],           match: (p) => p.productType === 'tshirts' };
const FT_SAUNA:            FilterableTypeDef = { id: 'sauna_suit',        label: 'Костюм-сауна',           productTypes: ['sauna_suit'],        match: (p) => p.productType === 'sauna_suit' };
const FT_OTHER:            FilterableTypeDef = { id: 'other',             label: 'Інше',                   productTypes: ['other'],             match: (p) => p.productType === 'other' || p.productType === 'uncategorized' };

/** All known FilterableTypeDefs — used for id→def lookup */
const ALL_FT_DEFS: FilterableTypeDef[] = [
  FT_JUDO_KIMONO, FT_BJJ_KIMONO, FT_KARATE_KIMONO, FT_AIKIDO_KIMONO,
  FT_SAMBO_UNIFORM, FT_GRAPPLING_UNIFORM,
  FT_BELTS, FT_BAGS, FT_TRAINERS, FT_FOOTWEAR, FT_TSHIRTS, FT_SAUNA, FT_OTHER,
];

/** Per-category ordered list of filterable types to show in drawer */
const FILTERABLE_TYPES: Partial<Record<CategoryKey, FilterableTypeDef[]>> = {
  judo:        [FT_JUDO_KIMONO, FT_BELTS, FT_BAGS, FT_TRAINERS, FT_TSHIRTS],
  karate:      [FT_KARATE_KIMONO, FT_BELTS, FT_BAGS, FT_TRAINERS, FT_TSHIRTS],
  bjj:         [FT_BJJ_KIMONO, FT_GRAPPLING_UNIFORM, FT_BELTS, FT_BAGS, FT_TRAINERS, FT_TSHIRTS],
  sambo:       [FT_SAMBO_UNIFORM, FT_FOOTWEAR, FT_BELTS, FT_BAGS],
  aikido:      [FT_AIKIDO_KIMONO, FT_BELTS, FT_BAGS],
  children:    [FT_JUDO_KIMONO, FT_KARATE_KIMONO, FT_BJJ_KIMONO, FT_AIKIDO_KIMONO, FT_SAMBO_UNIFORM, FT_BELTS, FT_FOOTWEAR],
  dytiachy:    [FT_JUDO_KIMONO, FT_KARATE_KIMONO, FT_BJJ_KIMONO, FT_AIKIDO_KIMONO, FT_SAMBO_UNIFORM, FT_BELTS, FT_FOOTWEAR],
  accessories: [FT_BELTS, FT_BAGS, FT_TRAINERS, FT_FOOTWEAR, FT_TSHIRTS, FT_SAUNA],
  bags:        [FT_BAGS],
  trainers:    [FT_TRAINERS],
  brand:       [FT_JUDO_KIMONO, FT_BJJ_KIMONO, FT_KARATE_KIMONO, FT_AIKIDO_KIMONO, FT_SAMBO_UNIFORM, FT_GRAPPLING_UNIFORM, FT_BELTS, FT_BAGS, FT_TRAINERS, FT_FOOTWEAR, FT_TSHIRTS, FT_SAUNA, FT_OTHER],
};

/** Resolve ProductType[] from active typeFilter ids — for sizeCtx, density, audience compat */
function resolveProductTypesFromTypeFilters(activeIds: string[]): ProductType[] {
  if (activeIds.length === 0) return [];
  const types = new Set<ProductType>();
  activeIds.forEach((id) => {
    const def = ALL_FT_DEFS.find((d) => d.id === id);
    def?.productTypes.forEach((t) => types.add(t));
  });
  return Array.from(types);
}

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
    description: 'Зручне спорядження для тренувань, змагань і поїздок. У них легко вмістити кімоно, пояс, захист і взуття — всі разом.',
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
  brand: {
    title: 'Бренд',
    h1: 'Усі товари бренду',
    description: 'Повний асортимент товарів обраного бренду.',
    seoDesc: 'Кімоно, гі, сумки, тренажери та аксесуари від обраного бренду.',
    hero: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    query: {},
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
      // BASIC 2, BUDOGI ADVANCED/PRO, Kintayo Wazari/Yuko adult…
      match: (p) => p.productType === 'kimono' && (p as any).judoLevel === 'teens_adults',
    },
    {
      id: 'professional',
      label: 'Професійні / IJF',
      // LEGEND 2 IJF (certified) + ULTRALIGHT (pro positioning, NOT IJF approved) — both judoLevel='professional'
      match: (p) => p.productType === 'kimono' && (p as any).judoLevel === 'professional',
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
  typeFilters: [],
  audiences: [],
  brands: [],
  series: [],
  sizes: [],
  colors: [],
  densities: [],
};

function filtersEqual(a: FilterState, b: FilterState) {
  return (
    a.typeFilters.join()  === b.typeFilters.join() &&
    a.audiences.join()    === b.audiences.join() &&
    a.brands.join()       === b.brands.join() &&
    a.series.join()       === b.series.join() &&
    a.sizes.join()        === b.sizes.join() &&
    a.colors.join()       === b.colors.join() &&
    a.densities.join()    === b.densities.join()
  );
}

function activeFilterCount(f: FilterState): number {
  return f.typeFilters.length + f.audiences.length + f.brands.length + f.series.length + f.sizes.length + f.colors.length + f.densities.length;
}

function applyFilters(
  prods: Product[],
  f: FilterState,
  quickMatch?: QuickFilterPredicate | null,
  audienceDefs?: AudienceDef[],
): Product[] {
  // Resolve active type predicates from typeFilter ids
  const activeTypeDefs = f.typeFilters.length
    ? f.typeFilters.map((id) => ALL_FT_DEFS.find((d) => d.id === id)).filter(Boolean) as FilterableTypeDef[]
    : [];

  // Derived product types for audience compat check
  const activeRealTypes = activeTypeDefs.flatMap((d) => d.productTypes);
  const allActiveAreAudienceIncompat = activeRealTypes.length > 0 && activeRealTypes.every((t) => TYPES_WITHOUT_AUDIENCE.has(t));

  return prods.filter((p) => {
    if (quickMatch && !quickMatch(p)) return false;
    // Type filter: product must match at least one selected FilterableTypeDef
    if (activeTypeDefs.length && !activeTypeDefs.some((d) => d.match(p))) return false;
    // Audience filter — only apply if:
    // 1. we have defs for this category, AND
    // 2. the product's type is audience-compatible (not belts/bags/trainers/other)
    if (f.audiences.length && audienceDefs?.length && !TYPES_WITHOUT_AUDIENCE.has(p.productType) && !allActiveAreAudienceIncompat) {
      const matchedDefs = audienceDefs.filter((d) => f.audiences.includes(d.id));
      if (matchedDefs.length > 0 && !matchedDefs.some((d) => d.match(p))) return false;
    }
    if (f.brands.length       && !f.brands.includes(p.brand))            return false;
    if (f.series.length       && !f.series.includes((p as any).modelSeries ?? '')) return false;
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
  activeProductTypes,
  filters,
  setFilters,
  category,
}: {
  prods: Product[];
  allProds: Product[];
  activeProductTypes: ProductType[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  category?: CategoryKey;
}) {
  const audienceDefs = category ? (AUDIENCE_LEVELS[category] ?? []) : [];

  /**
   * typeFilterPool — the product pool used for building categoryFtDefs and counting typeFilters.
   * On brand pages: scoped to the locked brand(s) so we only show types that brand actually has.
   * On other pages: full allProds (includes extras like bags/belts from any brand).
   */
  const typeFilterPool = useMemo(() => {
    if (category === 'brand' && filters.brands.length > 0) {
      return allProds.filter((p) => filters.brands.includes(p.brand));
    }
    return allProds;
  }, [category, allProds, filters.brands]);

  /** FilterableTypeDefs available for this category — shown in drawer "Тип товару" */
  const categoryFtDefs = useMemo(() => {
    const defs = category ? (FILTERABLE_TYPES[category] ?? []) : ALL_FT_DEFS;
    // Only show defs that have at least 1 product in typeFilterPool (brand-scoped on brand pages)
    return defs.filter((d) => typeFilterPool.some(d.match));
  }, [category, typeFilterPool]);

  /**
   * allProductTypes — derived from allProds (full pool including bags/belts/trainers).
   * Still used for density/audience compat checks.
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
    () => resolveSizeContext(activeProductTypes, allProductTypes),
    [activeProductTypes, allProductTypes],
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
              if (filters.typeFilters.length) {
                const defs = filters.typeFilters.map((id) => ALL_FT_DEFS.find((d) => d.id === id)).filter(Boolean) as FilterableTypeDef[];
                if (!defs.some((d) => d.match(p))) return false;
              }
              if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
              return true;
            })
            .map((p) => p.color)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'uk')),
    [prods, filters.typeFilters, filters.brands],
  );

  /* ── densities (kimono/uniform only) ── */
  const densityTypes = useMemo(
    () => allProductTypes.filter((t) => DENSITY_TYPES.includes(t)),
    [allProductTypes],
  );
  // Show density if: density products exist AND (no type filter active OR active types include kimono/uniform)
  const showDensity = densityTypes.length > 0 &&
    (activeProductTypes.length === 0 || activeProductTypes.some((t) => DENSITY_TYPES.includes(t)));

  const allDensities = useMemo(() => {
    if (!showDensity) return [];
    const base = prods.filter((p) => {
      if (!DENSITY_TYPES.includes(p.productType)) return false;
      if (filters.typeFilters.length) {
        const defs = filters.typeFilters.map((id) => ALL_FT_DEFS.find((d) => d.id === id)).filter(Boolean) as FilterableTypeDef[];
        if (!defs.some((d) => d.match(p))) return false;
      }
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.colors.length && !filters.colors.includes(p.color)) return false;
      return true;
    });
    return Array.from(new Set(base.map((p) => normalizeDensity(p.density)).filter(Boolean)))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [prods, showDensity, filters.typeFilters, filters.brands, filters.colors]);

  /* ── series ── */
  const allSeries = useMemo(() => {
    const base = prods.filter((p) => {
      if (filters.typeFilters.length) {
        const defs = filters.typeFilters.map((id) => ALL_FT_DEFS.find((d) => d.id === id)).filter(Boolean) as FilterableTypeDef[];
        if (!defs.some((d) => d.match(p))) return false;
      }
      if (filters.audiences.length && audienceDefs.length) {
        const matchedDefs = audienceDefs.filter((d) => filters.audiences.includes(d.id));
        if (matchedDefs.length > 0 && !matchedDefs.some((d) => d.match(p))) return false;
      }
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.colors.length && !filters.colors.includes(p.color)) return false;
      return true;
    });
    const seen = new Map<string, number>();
    for (const p of base) {
      const s = (p as any).modelSeries as string | undefined;
      if (s) seen.set(s, (seen.get(s) ?? 0) + 1);
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'uk'))
      .map(([s]) => s);
  }, [prods, filters.typeFilters, filters.audiences, filters.brands, filters.colors, audienceDefs]);

  /* ── count: how many products match all filters except this group ── */
  const countFor = useCallback(
    (group: 'typeFilters' | 'audiences' | 'brands' | 'series' | 'sizes' | 'colors' | 'densities', value: string): number => {
      // For typeFilter counting use typeFilterPool (brand-scoped on brand pages) so counts are accurate
      const pool = group === 'typeFilters' ? typeFilterPool : prods;
      return pool.filter((p) => {
        // Apply current typeFilters when counting other groups
        if (group !== 'typeFilters' && filters.typeFilters.length) {
          const defs = filters.typeFilters.map((id) => ALL_FT_DEFS.find((d) => d.id === id)).filter(Boolean) as FilterableTypeDef[];
          if (!defs.some((d) => d.match(p))) return false;
        }
        // Audience exclusion: when counting for other groups, apply current audience filter
        // but skip for audience-incompatible types (belts/bags/trainers/other)
        if (group !== 'audiences' && filters.audiences.length && audienceDefs.length && !TYPES_WITHOUT_AUDIENCE.has(p.productType)) {
          const matchedDefs = audienceDefs.filter((d) => filters.audiences.includes(d.id));
          if (matchedDefs.length > 0 && !matchedDefs.some((d) => d.match(p))) return false;
        }
        if (group !== 'brands'  && filters.brands.length  && !filters.brands.includes(p.brand))  return false;
        if (group !== 'series'  && filters.series.length  && !filters.series.includes((p as any).modelSeries ?? '')) return false;
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
        if (group !== 'colors'    && filters.colors.length    && !filters.colors.includes(p.color))                               return false;
        if (group !== 'densities' && filters.densities.length && !filters.densities.includes(normalizeDensity(p.density)))        return false;
        if (group === 'typeFilters') {
          const def = ALL_FT_DEFS.find((d) => d.id === value);
          return def ? def.match(p) : false;
        }
        if (group === 'audiences') {
          const def = audienceDefs.find((d) => d.id === value);
          return def ? def.match(p) : false;
        }
        if (group === 'brands')  return p.brand === value;
        if (group === 'series')  return ((p as any).modelSeries ?? '') === value;
        if (group === 'sizes') {
          if (p.productType === 'belts') {
            return p.sizes.some((s) => normalizeBeltSize(s) === value);
          }
          return p.sizes.includes(value);
        }
        if (group === 'colors')    return p.color === value;
        if (group === 'densities') return normalizeDensity(p.density) === value;
        return true;
      }).length;
    },
    [prods, typeFilterPool, filters, audienceDefs],
  );

  /* ── toggles ── */
  const toggle = <K extends 'brands' | 'sizes' | 'colors' | 'densities'>(key: K, val: string) => {
    const cur = filters[key] as string[];
    setFilters({
      ...filters,
      [key]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val],
    });
  };

  const toggleSeries = (s: string) => {
    const cur = filters.series;
    setFilters({ ...filters, series: cur.includes(s) ? cur.filter((v) => v !== s) : [...cur, s] });
  };

  const toggleAudience = (id: AudienceLevel) => {
    const cur = filters.audiences;
    setFilters({
      ...filters,
      audiences: cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id],
    });
  };

  const toggleTypeFilter = (ftId: string) => {
    const cur  = filters.typeFilters;
    const next = cur.includes(ftId) ? cur.filter((v) => v !== ftId) : [...cur, ftId];

    // Derive real product types from next selection for audience compat check
    const nextRealTypes = resolveProductTypesFromTypeFilters(next);
    const allIncompatible = nextRealTypes.length > 0 && nextRealTypes.every((pt) => TYPES_WITHOUT_AUDIENCE.has(pt));
    const audiences = allIncompatible ? [] : filters.audiences;

    setFilters({ ...filters, typeFilters: next, sizes: [], audiences });
  };

  return (
    <div>
      {/* ── Тип товару ── */}
      {categoryFtDefs.length > 1 && (
        <Accordion title="Тип товару" badge={filters.typeFilters.length || undefined}>
          {categoryFtDefs.map((ftDef) => {
            const cnt = countFor('typeFilters', ftDef.id);
            return (
              <CheckRow
                key={ftDef.id}
                label={ftDef.label}
                checked={filters.typeFilters.includes(ftDef.id)}
                count={cnt}
                disabled={cnt === 0}
                onChange={() => toggleTypeFilter(ftDef.id)}
              />
            );
          })}
        </Accordion>
      )}

      {/* ── Для кого / рівень ── */}
      {audienceDefs.length > 0 && (
        <Accordion title="Для кого / рівень" badge={filters.audiences.length || undefined}>
          {audienceDefs.map((def) => {
            const cnt = countFor('audiences', def.id);
            return (
              <CheckRow
                key={def.id}
                label={def.label}
                checked={filters.audiences.includes(def.id)}
                count={cnt}
                disabled={cnt === 0}
                onChange={() => toggleAudience(def.id)}
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

      {/* ── Серія / модель ── */}
      {allSeries.length >= 3 && (
        <Accordion title="Серія / модель" badge={filters.series.length || undefined} defaultOpen={false}>
          {allSeries.map((s) => {
            const cnt = countFor('series', s);
            return (
              <CheckRow
                key={s}
                label={s}
                checked={filters.series.includes(s)}
                count={cnt}
                disabled={cnt === 0}
                onChange={() => toggleSeries(s)}
              />
            );
          })}
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
  audienceDefs,
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  isBeltContext?: boolean;
  isBagContext?: boolean;
  audienceDefs?: AudienceDef[];
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  filters.typeFilters.forEach((id) => {
    const ftDef = ALL_FT_DEFS.find((d) => d.id === id);
    if (ftDef) chips.push({
      label: ftDef.label,
      onRemove: () =>
        setFilters({ ...filters, typeFilters: filters.typeFilters.filter((x) => x !== id), sizes: [] }),
    });
  });
  filters.audiences.forEach((id) => {
    const def = audienceDefs?.find((d) => d.id === id);
    if (def) {
      chips.push({
        label: def.label,
        onRemove: () => setFilters({ ...filters, audiences: filters.audiences.filter((x) => x !== id) }),
      });
    }
  });
  filters.series.forEach((s) =>
    chips.push({ label: `Серія: ${s}`, onRemove: () => setFilters({ ...filters, series: filters.series.filter((x) => x !== s) }) }),
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
  // For 'brand' category — read brand name from URL for dynamic title
  const _brandSearch = typeof window !== 'undefined' ? window.location.search : '';
  const _brandParam = new URLSearchParams(_brandSearch).get('brand') ?? '';
  const brandLabel = _brandParam || 'Бренд';

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

  const [filters, setFiltersRaw] = useState<FilterState>(EMPTY);
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

  /**
   * Smart setFilters wrapper.
   * When productTypes change to types incompatible with current quickId (audience-type quick),
   * auto-clear quickId to prevent "Діти quick" + "Пояси productType" → 0 товарів.
   */
  const QUICK_AUDIENCE_IDS_SET = new Set(['children', 'teens_adults', 'professional']);
  const setFilters = (next: FilterState) => {
    // If quickId is an audience-type quick AND new typeFilters are all incompatible → clear quickId
    // URL will be updated by the writeToUrl useEffect automatically
    if (quickId && QUICK_AUDIENCE_IDS_SET.has(quickId) && next.typeFilters.length > 0) {
      const nextRealTypes = resolveProductTypesFromTypeFilters(next.typeFilters);
      const allIncompatible = nextRealTypes.length > 0 && nextRealTypes.every((pt) => TYPES_WITHOUT_AUDIENCE.has(pt));
      if (allIncompatible) {
        setQuickId(null);
      }
    }
    setFiltersRaw(next);
  };

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
  /**
   * Quick IDs that represent audience/level groups (NOT product types).
   * These never conflict with productTypes filter — they filter by age/level within a type.
   */
  const QUICK_AUDIENCE_IDS = new Set(['children', 'teens_adults', 'professional']);

  /**
   * Quick IDs that represent product types incompatible with audience filters
   * (belts, bags, trainers have no age/level distinction that matters for filtering).
   */
  const QUICK_TYPE_INCOMPATIBLE_IDS = new Set([
    'belts', 'bags', 'trainers', 'tshirts', 'grappling',
    'backpack', 'bag', 'suitcase', 'rope', 'grip', 'uchi', 'all',
    'footwear', 'uniform',
  ]);

  const handleQuickNavigate = (id: string | null) => {
    setQuickId(id);

    // — Compatibility auto-reset —
    // When switching to a type-card that's incompatible with audience filters,
    // clear filters.productTypes (avoids quickMatch + productTypes double-filter)
    // AND clear filters.audiences (avoids "Діти" sidebar filter conflicting)
    let nextFilters = filters;
    if (id !== null) {
      if (QUICK_TYPE_INCOMPATIBLE_IDS.has(id)) {
        // e.g. clicked "Пояси" while "Діти" quick or audience was active
        // → clear audiences + typeFilters so only quickMatch applies
        nextFilters = { ...filters, audiences: [], typeFilters: [], sizes: [] };
      } else if (QUICK_AUDIENCE_IDS.has(id)) {
        // e.g. clicked "Діти" → clear typeFilters so audience quick works on all types
        nextFilters = { ...filters, typeFilters: [], sizes: [] };
      } else {
        // generic type card (kimono, uniform, etc.) — just clear sizes
        nextFilters = { ...filters, sizes: [] };
      }
      if (nextFilters !== filters) setFilters(nextFilters);
    }
    // URL is updated by writeToUrl useEffect — no manual replaceState needed here
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

  /* ─────────────────────────────────────────────────────────
     Data fetching — must be declared BEFORE scroll effects
     so `isLoading` is available when useEffects reference it.
  ───────────────────────────────────────────────────────── */
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

  /* ─────────────────────────────────────────────────────────
     Scroll position restore
     Save scroll position to sessionStorage when navigating away,
     restore it when returning to the same category URL.
  ───────────────────────────────────────────────────────── */
  const scrollKey = `catalog-scroll:${category}`;

  // Save scroll on unload / pagehide (before navigating to product page)
  useEffect(() => {
    const save = () => {
      sessionStorage.setItem(scrollKey, String(Math.round(window.scrollY)));
    };
    window.addEventListener('pagehide', save);
    // Also save on every scroll (throttled via rAF) so back button always has fresh value
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(save);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      save(); // save on unmount (SPA navigation to product page)
      window.removeEventListener('pagehide', save);
      window.removeEventListener('scroll', onScroll);
    };
  }, [scrollKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore scroll once products are loaded (if we have a saved position)
  useEffect(() => {
    if (isLoading) return;
    const saved = sessionStorage.getItem(scrollKey);
    if (!saved) return;
    const y = parseInt(saved, 10);
    if (!y) return;
    // Only restore if there are active filters (user is returning from a product page)
    const p = new URLSearchParams(search);
    const hasAny = p.has('type') || p.has('audience') || p.has('brand') || p.has('series') ||
                   p.has('size') || p.has('color') || p.has('density') || p.has('quick');
    if (!hasAny) return;
    // Small delay so the grid has rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: 'instant' });
        sessionStorage.removeItem(scrollKey); // consume once
      });
    });
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (filters.typeFilters.length === 0) return sportProds;
    return allProds;
  }, [filters.typeFilters, sportProds, allProds]);

  /** Real ProductType[] currently active (from typeFilters) — used in main component for size ctx, cross-sell, pageSizeCtx */
  const activeProductTypes = useMemo(
    () => resolveProductTypesFromTypeFilters(filters.typeFilters),
    [filters.typeFilters],
  );

  /* ─────────────────────────────────────────────────────────
     URL ↔ Filter state sync
     All filter params are stored in URL so that:
     - browser back from ProductPage restores the exact filter state
     - page refresh keeps filters
     - shareable links work

     URL params used:
       type      — productType  (multi)
       audience  — AudienceLevel (multi)
       brand     — brand        (multi)
       series    — modelSeries  (multi)
       size      — size         (multi)
       color     — color        (multi)
       density   — density      (multi)
       sort      — SortKey      (single)
       quick     — QuickFilter id (single)

     Reading: once, after products are loaded (so we can validate values).
     Writing: on every filter/sort/quickId change via replaceState (no re-render).
  ───────────────────────────────────────────────────────── */

  const filtersInitialized = useRef(false);

  // ── Category change: reset everything, clear URL, scroll top ──
  useEffect(() => {
    setFiltersRaw(EMPTY);
    setSort('popular');
    setQuickId(null);
    filtersInitialized.current = false;
    window.history.replaceState(null, '', location);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Read URL → state once after products load ──
  useEffect(() => {
    if (isLoading || filtersInitialized.current) return;
    filtersInitialized.current = true;

    const p          = new URLSearchParams(search);
    // New param: tf= (typeFilter ids). Legacy: type= mapped to equivalent tf ids for back-compat.
    const tfRaw      = p.getAll('tf');
    const legacyTypes = p.getAll('type') as ProductType[];
    // Map legacy 'type' param to FilterableType ids where possible
    const legacyMapped: string[] = [];
    legacyTypes.forEach((t) => {
      // map generic productType → most specific ft for this category context
      const match = ALL_FT_DEFS.find((d) => d.productTypes.includes(t) && d.productTypes.length === 1 && d.id === t);
      if (match) legacyMapped.push(match.id);
    });
    const typeFilters = [...new Set([...tfRaw, ...legacyMapped])].filter((id) => ALL_FT_DEFS.some((d) => d.id === id));

    const audiences  = p.getAll('audience') as AudienceLevel[];
    const brands     = p.getAll('brand');
    const series     = p.getAll('series');
    const sizes      = p.getAll('size');
    const colors     = p.getAll('color');
    const densities  = p.getAll('density');
    const sortParam  = p.get('sort') as SortKey | null;
    const quickParam = p.get('quick');

    const hasFilters = typeFilters.length || audiences.length || brands.length || series.length ||
                       sizes.length || colors.length || densities.length;

    if (hasFilters) {
      setFiltersRaw({ typeFilters, audiences, brands, series, sizes, colors, densities });
    }
    if (sortParam && SORT_OPTIONS.some((o) => o.key === sortParam)) {
      setSort(sortParam);
    }
    if (quickParam) {
      setQuickId(quickParam);
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Write state → URL on every change (replaceState, no history entry) ──
  const writeToUrl = useCallback((
    f: FilterState,
    s: SortKey,
    qid: string | null,
  ) => {
    const p = new URLSearchParams();
    f.typeFilters.forEach((id)  => p.append('tf',       id));
    f.audiences.forEach((a)     => p.append('audience', a));
    f.brands.forEach((b)        => p.append('brand',    b));
    f.series.forEach((sr)       => p.append('series',   sr));
    f.sizes.forEach((sz)        => p.append('size',     sz));
    f.colors.forEach((c)        => p.append('color',    c));
    f.densities.forEach((d)     => p.append('density',  d));
    if (s !== 'popular')          p.set('sort',    s);
    if (qid)                      p.set('quick',   qid);
    const qs = p.toString();
    window.history.replaceState(null, '', location + (qs ? '?' + qs : ''));
  }, [location]);

  useEffect(() => {
    if (!filtersInitialized.current) return; // don't write before we've read
    writeToUrl(filters, sort, quickId);
  }, [filters, sort, quickId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── After products load: scroll to right section ──
  useEffect(() => {
    if (isLoading) return;
    const p = new URLSearchParams(search);
    const hasAnyFilter = p.has('type') || p.has('audience') || p.has('brand') || p.has('series') ||
                         p.has('size') || p.has('color') || p.has('density') || p.has('quick');
    if (hasAnyFilter) {
      scrollToCatalog();
    } else {
      scrollToQuickChoice();
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const audienceDefs = AUDIENCE_LEVELS[category as CategoryKey] ?? [];

  const filtered = useMemo(
    () => applySort(applyFilters(prods, filters, quickMatch, audienceDefs), sort),
    [prods, filters, sort, quickMatch, audienceDefs],
  );

  const hasFilters  = !filtersEqual(filters, EMPTY);
  const filterCount = activeFilterCount(filters);

  /** Derive size context for ActiveChips labels */
  const pageSizeCtx = useMemo(() => {
    const scope = activeProductTypes.length > 0
      ? activeProductTypes
      : Array.from(new Set(prods.map((p) => p.productType)));
    const sizedTypes = scope.filter((t) => !NO_SIZE_TYPES.includes(t));
    if (sizedTypes.length === 0) return { isBelt: false, isBag: false };
    return {
      isBelt: sizedTypes.every((t) => t === 'belts'),
      isBag:  sizedTypes.every((t) => t === 'bags'),
    };
  }, [activeProductTypes, prods]);
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
            <span className="text-[#787878]">{category === 'brand' ? brandLabel : cfg.title}</span>
          </div>

          {/* Title + description */}
          <h1 className="font-unbounded text-2xl sm:text-3xl lg:text-[2rem] font-black text-white leading-tight mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {category === 'brand' ? brandLabel : cfg.h1}
          </h1>
          <p className="font-inter text-white/60 text-sm sm:text-[15px] max-w-md leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] mb-5">
            {category === 'bags' && quickId === 'backpack'
              ? 'Рюкзаки для щоденних тренувань — компактні, зручні, влізе все необхідне для залу.'
              : category === 'bags' && quickId === 'bag'
              ? 'Спортивні сумки для більшого комплекту: кімоно, захист, взуття та все інше — без компромісів.'
              : category === 'bags' && quickId === 'suitcase'
              ? 'Валізи на колесах для виїздів, зборів і змагань — все екіпірування завжди під рукою.'
              : category === 'brand'
              ? `Повний асортимент товарів бренду ${brandLabel} — кімоно, гі, сумки та аксесуари.`
              : cfg.description}
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
                {hasFilters && <ActiveChips filters={filters} setFilters={setFilters} isBeltContext={isBeltContext} isBagContext={isBagContext} audienceDefs={audienceDefs} />}
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
                  <FilterPanel prods={prods} allProds={allProds} activeProductTypes={activeProductTypes} filters={filters} setFilters={setFilters} category={category} />
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
                  {hasFilters && <ActiveChips filters={filters} setFilters={setFilters} isBeltContext={isBeltContext} isBagContext={isBagContext} audienceDefs={audienceDefs} />}
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
      {CROSS_SELL_CATEGORIES.has(category) && (activeProductTypes.length === 0 || activeProductTypes.every((t) => !EXTRA_TYPES.has(t))) && <CrossSellBlock />}


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
          <FilterPanel prods={prods} allProds={allProds} activeProductTypes={activeProductTypes} filters={filters} setFilters={setFilters} category={category} />
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
