/**
 * fit-utils.ts
 *
 * Utilities for detecting cut/fit variants (Regular, Slim Fit, Women)
 * from IPPON GEAR product names, grouping siblings, and providing UI labels.
 */

import type { Product } from '../data/products';

// ─── Fit detection ────────────────────────────────────────────────────────────

export type FitKind = 'slim' | 'regular' | 'women';

/** Map FitKind → display label shown in the selector */
export const FIT_LABEL: Record<FitKind, string> = {
  regular: 'Regular',
  slim:    'Slim Fit',
  women:   'Women',
};

/** Map FitKind → label for the "Крій" characteristics row */
export const FIT_CHAR_LABEL: Record<FitKind, string> = {
  regular: 'Regular Fit',
  slim:    'Slim Fit',
  women:   'Women Fit',
};

/**
 * Detect the fit kind from a product name.
 * Returns null if the name has no explicit fit indicator.
 */
export function detectFit(name: string): FitKind | null {
  const n = name.toUpperCase();
  if (n.includes('WOMEN') || n.includes('WOMAN')) return 'women';
  if (n.includes('SLIM'))    return 'slim';
  if (n.includes('REGULAR')) return 'regular';
  return null;
}

/**
 * True if this product participates in fit-variant grouping
 * (currently: IPPON GEAR kimono whose name contains an explicit fit indicator).
 */
export function isFitVariantProduct(product: Product): boolean {
  if (product.brand !== 'IPPON GEAR' && product.brand !== 'IPPONGEAR') return false;
  if (product.productType !== 'kimono') return false;
  return detectFit(product.name) !== null;
}

// ─── Model fingerprint (groups fit siblings) ──────────────────────────────────

/**
 * Tokens stripped when computing a model fingerprint.
 * Goal: two products that are only different in fit/size/color should
 * produce the same fingerprint.
 */
const STRIP_RE = new RegExp([
  // Product-type / qualification words
  'КІМОНО\\s+ДЛЯ\\s+ДЗЮДО',
  'КІМОНО',
  'ЛІЦЕНЗІЙНЕ',
  // IJF certification fragments
  '\\(APPROVED\\s+IJF\\)',
  ',?\\s*IJF\\s*\\(approved\\s+\\d+\\)',
  ',?\\s*IJF',
  'APPROVED',
  // Gender / audience words
  '\\(ДЛЯ\\s+ЖІНОК\\)',
  'ДЛЯ\\s+ЖІНОК',
  // Fit indicators (we strip these so fit doesn't affect grouping)
  'SLIM\\s+FIT',
  'SLIM',
  'REGULAR',
  'WOMEN',
  'WOMAN',
  '\\bFIT\\b',
  // Sizes with Ukrainian «см»: 140см, 160 см
  '\\d+\\s*[СсCc][МмMm]',
  // Remaining 3-digit+ standalone numbers (sizes like 140, 195, 2023)
  '\\b[1-9]\\d{2,}\\b',
  // Ukrainian colour adjectives
  'БІЛЕ',
  'СИНЄ',
  'БІЛА',
  'СИНЯ',
  // Punctuation artefacts
  '!',
].join('|'), 'gi');

/**
 * Compute a model fingerprint used to detect fit siblings.
 * Two products with the same fingerprint are considered fit variants
 * of the same model.
 *
 * Examples:
 *   "Біле кімоно для дзюдо IPPON GEAR ULTRALIGHT 140см Slim Fit"
 *     → "IPPON GEAR||judo||kimono||ULTRALIGHT"
 *   "БІЛЕ ЛІЦЕНЗІЙНЕ КІМОНО ДЛЯ ДЗЮДО IPPON GEAR LEGEND 2 (APPROVED IJF) 160 Regular"
 *     → "IPPON GEAR||judo||kimono||LEGEND 2"
 */
export function modelFingerprint(product: Product): string {
  const brand = product.brand.trim().toUpperCase();
  let n = product.name
    .toUpperCase()
    .replace(STRIP_RE, ' ')
    .replace(/[,().]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Everything before (and including) the brand prefix is noise
  const idx = n.indexOf(brand);
  if (idx >= 0) n = n.slice(idx + brand.length).trim();
  n = n.replace(/\s{2,}/g, ' ').trim();

  return `${brand}||${product.sportSlug}||${product.productType}||${n}`;
}

// ─── Sibling lookup ───────────────────────────────────────────────────────────

export interface FitSibling {
  /** Product id to navigate to */
  productId: string;
  fit: FitKind;
  /** Display label (Regular / Slim Fit / Women) */
  label: string;
}

/**
 * Find ALL products (including _adult duplicates) that share the same
 * model fingerprint AND the same fit as the given product.
 *
 * Use this to merge offers across split products (e.g. 1310 + 1310_adult
 * are both Slim Fit ULTRALIGHT — they should show combined sizes).
 *
 * Returns at least [product] itself (never empty).
 */
export function findAllFitProducts(product: Product, allProducts: Product[]): Product[] {
  if (!isFitVariantProduct(product)) return [product];

  const myFp  = modelFingerprint(product);
  const myFit = detectFit(product.name);
  if (!myFit) return [product];

  return allProducts.filter(p => {
    if (!isFitVariantProduct(p)) return false;
    if (modelFingerprint(p) !== myFp) return false;
    return detectFit(p.name) === myFit;
  });
}

/**
 * Find all fit siblings for a given product within allProducts.
 *
 * - Returns [] if this product is not a fit-variant model.
 * - Returns [] if only one fit variant exists (no selector needed).
 * - Deduplicates by fit kind (e.g. 1310 and 1310_adult both = Slim Fit → one entry).
 * - For deduplication: prefer the product whose id doesn't end with `_adult`
 *   (cleaner canonical URL), and prefer the one with more available offers.
 * - Sorted: regular → slim → women.
 */
export function findFitSiblings(product: Product, allProducts: Product[]): FitSibling[] {
  if (!isFitVariantProduct(product)) return [];

  const myFp = modelFingerprint(product);

  // Collect candidates keyed by fit kind
  const best = new Map<FitKind, { productId: string; score: number }>();

  for (const p of allProducts) {
    if (!isFitVariantProduct(p)) continue;
    if (modelFingerprint(p) !== myFp) continue;
    const fit = detectFit(p.name);
    if (!fit) continue;

    // Score: prefer non-_adult id, prefer more available offers
    const isAdult = p.id.endsWith('_adult');
    const availCount = (p.variants ?? []).flatMap(v => v.offers ?? []).filter(o => o.available).length;
    const score = (isAdult ? 0 : 1000) + availCount;

    const cur = best.get(fit);
    if (!cur || score > cur.score) {
      best.set(fit, { productId: p.id, score });
    }
  }

  if (best.size < 2) return [];

  const ORDER: FitKind[] = ['regular', 'slim', 'women'];
  return ORDER
    .filter(f => best.has(f))
    .map(f => ({ productId: best.get(f)!.productId, fit: f, label: FIT_LABEL[f] }));
}
