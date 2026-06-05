/**
 * belt-rules.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for belt-in-kit determination.
 *
 * Rules:
 *  KARATE (any brand)          → belt always included
 *  AIKIDO (any brand)          → belt always included
 *  GRAPPLING (any brand)       → belt included, color matches kimono color
 *
 *  KINTAYO JUDO                → white 350/450 g/m² → included; else excluded
 *  KINTAYO BJJ                 → all except red → included; red → excluded
 *
 *  BUDOGI BJJ                  → belt included + backpack-bag gift
 *  BUDOGI JUDO/AIKIDO/other    → white/blue 350 g/m² → included; else excluded
 *
 *  IPPON GEAR                  → white/blue 335 g/m² → included; else excluded
 *
 *  Unknown brand               → null (no negative text shown)
 */

import type { SportSlug } from '../data/products';

export type BeltStatus = 'included' | 'excluded' | null;

/** Full kit result — includes kit items list + optional extras (gifts) */
export interface KitResult {
  /** Items always in kit: Куртка, Штани, maybe Пояс */
  items: string[];
  /** Extra gifts shown separately: e.g. "Рюкзак-мішок" */
  gifts: string[];
  /** Whether belt is included */
  beltStatus: BeltStatus;
  /** Whether belt badge should be shown on card */
  showBadge: boolean;
  /** Text shown below kit list when belt is excluded */
  footnote: string;
}

export interface BeltParams {
  brand: string;
  sportSlug: SportSlug;
  /** Active color name in Ukrainian (any case) */
  color: string;
  /** Density string e.g. "350 гр/м²" or "335 гр/м.кв." */
  density?: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function normBrand(raw: string): string {
  return raw.toUpperCase().trim().replace(/\s+/g, ' ');
}

function densityNum(raw?: string): number {
  if (!raw) return 0;
  const m = raw.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function colorLC(color: string): string {
  return color.toLowerCase();
}

function isWhiteColor(color: string): boolean {
  return colorLC(color).includes('біл');
}
function isBlueColor(color: string): boolean {
  return colorLC(color).includes('син');
}
function isRedColor(color: string): boolean {
  return colorLC(color).includes('червон');
}

/**
 * Returns the color adjective in Ukrainian for a belt matching the kimono color.
 * Falls back to empty string (→ just "Пояс").
 */
function beltColorLabel(color: string): string {
  const lc = colorLC(color);
  if (lc.includes('біл'))     return 'Білий пояс';
  if (lc.includes('чорн'))    return 'Чорний пояс';
  if (lc.includes('синій') || lc.includes('синє') || lc.includes('синя') || lc.includes('синіх') || lc.includes('cин')) return 'Синій пояс';
  if (lc.includes('червон'))  return 'Червоний пояс';
  if (lc.includes('зелен'))   return 'Зелений пояс';
  if (lc.includes('жовт'))    return 'Жовтий пояс';
  if (lc.includes('сір'))     return 'Сірий пояс';
  if (lc.includes('помаранч') || lc.includes('оранж')) return 'Помаранчевий пояс';
  if (lc.includes('коричн'))  return 'Коричневий пояс';
  if (lc.includes('рожев'))   return 'Рожевий пояс';
  return 'Пояс';
}

// ─── core logic ──────────────────────────────────────────────────────────────

function resolveKit(params: BeltParams): { beltStatus: BeltStatus; beltLabel: string; gifts: string[] } {
  const brand = normBrand(params.brand);
  const sport = params.sportSlug;
  const dens  = densityNum(params.density);
  const color = params.color;

  // ── Universal sport rules (apply to any brand) ────────────────────────────

  // KARATE → belt always included
  if (sport === 'karate') {
    return { beltStatus: 'included', beltLabel: 'Пояс', gifts: [] };
  }

  // AIKIDO → belt always included
  if (sport === 'aikido') {
    return { beltStatus: 'included', beltLabel: 'Пояс', gifts: [] };
  }

  // GRAPPLING → belt in kimono color (handled per-brand below, fallthrough for unknowns)

  // ── KINTAYO ───────────────────────────────────────────────────────────────
  if (brand === 'KINTAYO') {
    if (sport === 'bjj' || sport === 'grappling') {
      if (isRedColor(color)) return { beltStatus: 'excluded', beltLabel: '', gifts: [] };
      return { beltStatus: 'included', beltLabel: beltColorLabel(color), gifts: [] };
    }
    if (sport === 'judo') {
      if (isWhiteColor(color) && (dens === 350 || dens === 450)) {
        return { beltStatus: 'included', beltLabel: 'Білий пояс', gifts: [] };
      }
      return { beltStatus: 'excluded', beltLabel: '', gifts: [] };
    }
    // Other KINTAYO sports → unknown
    return { beltStatus: null, beltLabel: '', gifts: [] };
  }

  // ── BUDOGI ────────────────────────────────────────────────────────────────
  if (brand === 'BUDOGI') {
    if (sport === 'bjj' || sport === 'grappling') {
      // Belt included + backpack gift for all BUDOGI BJJ/grappling
      return {
        beltStatus: 'included',
        beltLabel: beltColorLabel(color),
        gifts: ['Рюкзак-мішок'],
      };
    }
    // Judo / Aikido / other BUDOGI — пояс завжди білий, незалежно від кольору кімоно
    if (dens === 350 && (isWhiteColor(color) || isBlueColor(color))) {
      return { beltStatus: 'included', beltLabel: 'Білий пояс', gifts: [] };
    }
    return { beltStatus: 'excluded', beltLabel: '', gifts: [] };
  }

  // ── IPPON GEAR ────────────────────────────────────────────────────────────
  if (brand === 'IPPON GEAR' || brand === 'IPPONGEAR') {
    if (dens === 335 && (isWhiteColor(color) || isBlueColor(color))) {
      return { beltStatus: 'included', beltLabel: 'Пояс', gifts: [] };
    }
    return { beltStatus: 'excluded', beltLabel: '', gifts: [] };
  }

  // ── bjj / grappling for unknown brands → belt in kimono color ──────────────
  if (sport === 'bjj' || sport === 'grappling') {
    return { beltStatus: 'included', beltLabel: beltColorLabel(color), gifts: [] };
  }

  // ── Unknown brand + sport → no rule ──────────────────────────────────────
  return { beltStatus: null, beltLabel: '', gifts: [] };
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Returns the full kit result for a kimono/uniform product.
 * Pass the ACTIVE color and density (from selected variant).
 */
export function getKitResult(params: BeltParams): KitResult {
  const { beltStatus, beltLabel, gifts } = resolveKit(params);

  const items = ['Куртка', 'Штани'];
  if (beltStatus === 'included' && beltLabel) items.push(beltLabel);

  const showBadge = beltStatus === 'included';
  const footnote  = beltStatus === 'excluded' ? 'Пояс не входить у комплект' : '';

  return { items, gifts, beltStatus, showBadge, footnote };
}

/**
 * Shorthand: just the beltStatus (for ProductCard badge logic).
 */
export function determineBeltStatus(params: BeltParams): BeltStatus {
  return resolveKit(params).beltStatus;
}

/**
 * Whether to show belt badge on card.
 */
export function showBeltBadge(status: BeltStatus): boolean {
  return status === 'included';
}

/**
 * Belt footnote text (empty when not excluded).
 */
export function beltFootnote(status: BeltStatus): string {
  return status === 'excluded' ? 'Пояс не входить у комплект' : '';
}

/**
 * Build basic kit list (backward compat for places that don't need gifts).
 */
export function buildKitList(status: BeltStatus, beltLabel = 'Пояс'): string[] {
  const list = ['Куртка', 'Штани'];
  if (status === 'included') list.push(beltLabel);
  return list;
}
