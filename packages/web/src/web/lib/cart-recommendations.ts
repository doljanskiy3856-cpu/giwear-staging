/**
 * cart-recommendations.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Smart "Доповніть комплект" logic for CartDrawer.
 *
 * Key principles:
 *  - Belt: same brand as kimono, matching length by size; score penalizes wrong brand
 *  - Bag:  KINTAYO → KINTAYO рюкзак-мішок first; IPPON GEAR → IPPON GEAR bags first
 *  - Children: never recommend suitcase; prefer backpack/small bag
 *  - Licensed/professional: suitcase & large bag allowed
 *  - BJJ: no trainers/grips/resistance bands as upsell
 *  - Sambo: footwear first if missing
 *  - BUDOGI BJJ: belt+backpack already gifted → don't recommend backpack-bag as paid
 *  - Never duplicate what's already in cart
 */

import type { CartItem } from '../context/CartContext';
import type { Product } from '../data/products';
import { getKitResult } from './belt-rules';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoredRec {
  product: Product;
  hint: string;
  score: number;
}

// ─── Belt size table ──────────────────────────────────────────────────────────
// Maps kimono height (cm) → recommended belt length (cm)
// Each entry: [maxHeight, beltLength]
const BELT_SIZE_TABLE: [number, number][] = [
  [120, 200],
  [140, 220],
  [160, 240],
  [170, 260],
  [180, 280],
  [190, 300],
  [Infinity, 320],
];

function extractHeight(size: string): number | null {
  const m = size.match(/(\d{2,3})/);
  const n = m ? parseInt(m[1], 10) : null;
  // ignore sizes that look like price or weight (< 90 or > 300)
  if (n === null || n < 90 || n > 300) return null;
  return n;
}

export function recommendedBeltLength(kimonoSize: string): number | null {
  const h = extractHeight(kimonoSize);
  if (!h) return null;
  for (const [max, belt] of BELT_SIZE_TABLE) {
    if (h <= max) return belt;
  }
  return 320;
}

export function beltLengthHint(kimonoSize: string): string {
  const h = extractHeight(kimonoSize);
  if (!h) return 'Рекомендована довжина до цього кімоно';
  const idx = BELT_SIZE_TABLE.findIndex(([max]) => h <= max);
  if (idx < 0) return `Підходить для зросту 190+ см`;
  const prevMax = idx > 0 ? BELT_SIZE_TABLE[idx - 1][0] + 1 : 1;
  const thisMax = BELT_SIZE_TABLE[idx][0];
  if (thisMax === Infinity) return `Підходить для зросту ${prevMax}+ см`;
  return `Підходить для зросту ${prevMax}–${thisMax} см`;
}

// ─── Product type helpers ─────────────────────────────────────────────────────

const normB = (s: string) => s.toUpperCase().trim().replace(/\s+/g, ' ');

const isKimono   = (p: Product) => p.productType === 'kimono' || p.productType === 'uniform';
const isBelt     = (p: Product) => p.productType === 'belts';
const isBag      = (p: Product) => p.productType === 'bags';
const isFootwear = (p: Product) => p.productType === 'footwear';
const isTrainer  = (p: Product) => p.productType === 'trainers';

const isSuitcase = (p: Product) =>
  isBag(p) && /валіза|suitcase|travell|wheel/i.test(p.name);

const isBackpackBag = (p: Product) =>
  isBag(p) && /рюкзак/i.test(p.name);

// "Рюкзак-мішок" (drawstring/gym bag) — specifically the small sport drawstring
const isDrawstringBag = (p: Product) =>
  isBag(p) && /рюкзак.?мішок/i.test(p.name);

// Large / premium bag (Fighter, Wheel, XL, Large, Traveller)
const isLargeBag = (p: Product) =>
  isBag(p) && /fighter|travell|wheel|xl\b/i.test(p.name);

// Licensed or professional kimono
const isLicensed = (p: Product) =>
  /ліцензійн|ліценз|ijf|approved/i.test(p.name);
const isProfessional = (p: Product) =>
  /\bpro\b|professional|ліцензійн|ijf/i.test(p.name);
const isLicensedOrPro = (p: Product) => isLicensed(p) || isProfessional(p);

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Returns up to `limit` scored recommendations for the current cart.
 */
export function buildCartRecommendations(
  cartItems: CartItem[],
  catalog: Product[],
  limit = 3,
): ScoredRec[] {
  if (cartItems.length === 0) return [];

  const cartIds = new Set(cartItems.map(i => i.product.id));

  // ── Cart analysis ────────────────────────────────────────────────────────
  const kimonos      = cartItems.filter(i => isKimono(i.product));
  const hasBelt      = cartItems.some(i => isBelt(i.product));
  const hasBag       = cartItems.some(i => isBag(i.product));
  const hasBackpack  = cartItems.some(i => isBackpackBag(i.product));
  const hasFootwear  = cartItems.some(i => isFootwear(i.product));
  const hasOnlyBelts = cartItems.length > 0 && cartItems.every(i => isBelt(i.product));

  const primaryKimono     = kimonos[0]?.product ?? null;
  const primaryKimonoSize = kimonos[0]?.size ?? '';
  const primaryBrand      = primaryKimono ? normB(primaryKimono.brand) : '';

  // Does the primary kimono already have belt in its kit (gift/included)?
  const beltInKit = primaryKimono
    ? (() => {
        const r = getKitResult({
          brand: primaryKimono.brand,
          sportSlug: primaryKimono.sportSlug,
          color: primaryKimono.color,
          density: primaryKimono.density,
        });
        return r.beltStatus === 'included';
      })()
    : false;

  // BUDOGI BJJ has backpack as a gift — don't recommend drawstring bag as paid
  const budogiBackpackGift =
    (primaryKimono?.sportSlug === 'bjj' || primaryKimono?.sportSlug === 'grappling') &&
    primaryBrand === 'BUDOGI';

  // Available products not already in cart
  const available = catalog.filter(p => p.available && !cartIds.has(p.id));

  const scored: ScoredRec[] = [];

  for (const p of available) {
    let score = 0;
    let hint  = '';

    // ── Skip trainers for BJJ ──────────────────────────────────────────────
    if (isTrainer(p) && (primaryKimono?.sportSlug === 'bjj' || primaryKimono?.sportSlug === 'grappling')) continue;

    // ── 1. BELT ─────────────────────────────────────────────────────────────
    if (isBelt(p) && !hasBelt && primaryKimono) {
      if (beltInKit) {
        // belt already in kit → skip
        continue;
      }

      // Sport match
      if (p.sportSlug === primaryKimono.sportSlug) score += 30;
      else continue; // wrong sport belt → skip entirely

      // Brand match
      const sameBrand = normB(p.brand) === primaryBrand;
      if (sameBrand) {
        score += 50; // strongly prefer same-brand belt
      } else {
        score += 3;  // fallback only; will lose to same-brand
      }

      // Length match
      const beltLen = recommendedBeltLength(primaryKimonoSize);
      if (beltLen) {
        // Check if this product covers the target length
        // Sizes might be like ['220 см','240 см'] or ['120','130'...]
        const coversLen = p.sizes.some(s => {
          const n = extractHeight(s);
          // belt sizes are cm lengths (200-320), not heights — re-check
          const m = s.match(/(\d{2,3})/);
          if (!m) return false;
          const v = parseInt(m[1], 10);
          return v === beltLen;
        });
        // Also check product name for the length
        const nameHasLen = new RegExp(`\\b${beltLen}\\b`).test(p.name);
        if (coversLen || nameHasLen) {
          score += 20;
          hint = beltLengthHint(primaryKimonoSize);
        } else {
          hint = 'Пояс до вашого кімоно';
        }
      } else {
        hint = 'Пояс до вашого кімоно';
      }
    }

    // ── 2. BAGS ─────────────────────────────────────────────────────────────
    if (isBag(p) && primaryKimono) {
      const isChild = primaryKimono.isChildren;
      const isProf  = isLicensedOrPro(primaryKimono);
      const pBrand  = normB(p.brand);

      // Never recommend suitcase for children
      if (isSuitcase(p) && isChild) continue;
      // Suitcase only for professional/licensed kimono
      if (isSuitcase(p) && !isProf) continue;

      // --- Drawstring bag (рюкзак-мішок) e.g. KINTAYO JUDO ---
      if (isDrawstringBag(p)) {
        // BUDOGI BJJ already gets it free → skip as paid rec
        if (budogiBackpackGift) continue;

        if (!hasBag) {
          // KINTAYO drawstring bag → top priority for KINTAYO kimono
          if (pBrand === 'KINTAYO' && primaryBrand === 'KINTAYO') {
            score += 45;
            hint = 'До вашого кімоно';
          } else if (pBrand === primaryBrand) {
            score += 40;
            hint = 'До вашого кімоно';
          } else {
            score += 18;
            hint = 'Для кімоно та форми';
          }
        }
        // fall through to scored.push below (no continue here)
      }
      // --- Regular backpack (рюкзак, not drawstring) ---
      else if (isBackpackBag(p)) {
        if (!hasBackpack && !hasBag) {
          // Large backpack (e.g. FIGHTER 2): skip for children; adults get lower score
          if (isLargeBag(p)) {
            if (isChild) {
              // Large bags not appropriate for children
              // fall through with score=0 — filtered out below
            } else if (isProf) {
              score += pBrand === primaryBrand ? 30 : 20;
              hint = 'Великий рюкзак для екіпірування';
            } else {
              score += pBrand === primaryBrand ? 20 : 15;
              hint = 'Рюкзак для екіпірування';
            }
          } else {
            // Regular (non-large) backpack
            // IPPON GEAR kimono → prefer IPPON GEAR backpack
            if (primaryBrand === 'IPPON GEAR' && pBrand === 'IPPON GEAR') {
              score += 35;
              hint = 'Рюкзак IPPON GEAR до комплекту';
            } else if (pBrand === primaryBrand) {
              score += 32;
              hint = 'До вашого кімоно';
            } else {
              // Cross-brand regular backpack: solid secondary rec (after drawstring for KINTAYO)
              score += primaryBrand === 'KINTAYO' ? 22 : 24;
              hint = 'Для кімоно та екіпірування';
            }
            // Children: slightly prefer compact backpack
            if (isChild) score += 3;
          }
        }
        // fall through
      }
      // --- Suitcase ---
      else if (isSuitcase(p)) {
        // Already filtered non-prof/children above
        if (!hasBag) {
          score += 25;
          hint = 'Для поїздок на змагання';
        }
        // fall through
      }
      // --- Regular / large sport bag (no рюкзак in name) ---
      else if (!hasBag) {
        if (isLargeBag(p)) {
          if (isProf && !isChild) {
            if (pBrand === 'IPPON GEAR') {
              score += 40;
              hint = 'Велика сумка для екіпірування';
            } else {
              score += 28;
              hint = 'Велика сумка для екіпірування';
            }
          } else if (!isChild) {
            score += 15;
            hint = 'Велика спортивна сумка';
          }
          // Children → score stays 0, filtered out
        } else {
          // Medium regular bag (e.g. IPPON GEAR ESSENTIAL M)
          // For children with KINTAYO kimono: lower priority — drawstring + backpack come first
          if (primaryBrand === 'IPPON GEAR' && pBrand === 'IPPON GEAR') {
            score += isChild ? 14 : 38;
            hint = 'Сумка IPPON GEAR до комплекту';
          } else if (pBrand === primaryBrand) {
            score += isChild ? 14 : 32;
            hint = 'Сумка для спортивної форми';
          } else {
            // Cross-brand regular bag: only show for adults, low priority for children
            score += isChild ? 10 : 20;
            hint = 'Сумка для спортивної форми';
          }
        }
      }
    }

    // ── 3. FOOTWEAR — sambo footwear first ────────────────────────────────
    if (isFootwear(p) && primaryKimono?.sportSlug === 'sambo' && !hasFootwear) {
      score += 60;
      hint = 'Самбовки до вашої форми';
    }

    // ── 4. KIMONO — when cart has only belts ──────────────────────────────
    if (isKimono(p) && hasOnlyBelts) {
      const beltSport = cartItems[0]?.product.sportSlug;
      if (p.sportSlug === beltSport) {
        score += 25;
        hint = 'Кімоно до вашого пояса';
      }
    }

    if (score > 0) {
      scored.push({ product: p, hint, score });
    }
  }

  // ── Sort by score ────────────────────────────────────────────────────────
  scored.sort((a, b) => b.score - a.score);

  // ── Deduplicate: max 1 belt, max 2 bags (prefer variety) ─────────────────
  const taken: Record<string, number> = {};
  const MAX: Record<string, number> = {
    belts: 1,
    bags: 2,
    footwear: 1,
    kimono: 1,
    uniform: 1,
    trainers: 0, // never show trainers in cart recs
  };

  const result: ScoredRec[] = [];
  for (const rec of scored) {
    const t = rec.product.productType;
    const max = MAX[t] ?? 1;
    if (max === 0) continue;
    const cur = taken[t] ?? 0;
    if (cur < max) {
      result.push(rec);
      taken[t] = cur + 1;
    }
    if (result.length >= limit) break;
  }

  return result;
}

// ─── Belt-in-kit message ──────────────────────────────────────────────────────

/**
 * If any kimono in cart has belt included in kit,
 * return contextual message to show instead of default subtitle.
 */
export function beltInKitMessage(cartItems: CartItem[]): string | null {
  const found = cartItems.find(i => {
    if (!isKimono(i.product)) return false;
    const r = getKitResult({
      brand: i.product.brand,
      sportSlug: i.product.sportSlug,
      color: i.product.color,
      density: i.product.density,
    });
    return r.beltStatus === 'included';
  });
  if (!found) return null;
  return 'Пояс уже в комплекті — додайте сумку для екіпірування';
}
