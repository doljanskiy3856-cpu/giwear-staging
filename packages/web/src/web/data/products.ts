/**
 * Product types — shared between API and frontend.
 * The actual product data is loaded from the YML catalog via /api/products.
 */

/** One specific offer: a particular color+size combination */
export type OfferEntry = {
  offerId: string;
  size: string;
  price: number;
  oldPrice?: number;
  name: string;
  vendorCode: string;
  available: boolean;
  /** ISO date string or human-readable UA date, e.g. "10 липня" or "2024-07-10" */
  restockDate?: string;
};

export type ProductVariant = {
  color: string;
  colorHex: string;
  /** Optional CSS linear-gradient string for split/dual-color swatches (e.g. belt combos) */
  colorGradient?: string;
  images: string[];
  /** Representative name for this color (smallest size offer) */
  name?: string;
  /** Min price across all sizes of this color */
  price?: number;
  oldPrice?: number;
  /** Representative vendorCode (first offer of this color) */
  vendorCode?: string;
  /** All size-specific offers for this color, sorted by size */
  offers?: OfferEntry[];
  linkedProductId?: string;
};

export type ProductType = 'kimono' | 'belts' | 'footwear' | 'tshirts' | 'bags' | 'trainers' | 'sauna_suit' | 'uniform' | 'other' | 'uncategorized';
export type SportSlug = 'karate' | 'judo' | 'bjj' | 'grappling' | 'sambo' | 'aikido' | 'rukopashnyy_biy' | 'boyovyi_khortyng' | 'uncategorized';
export type CategorySlug = 'karate' | 'judo' | 'bjj' | 'dytiachy' | 'uncategorized';

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  productType: ProductType;
  sportSlug: SportSlug;
  categorySlug: CategorySlug;
  ageGroup?: string;
  isChildren: boolean;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  variants?: ProductVariant[];
  sizes: string[];
  size: string;
  color: string;
  available: boolean;
  forWhom: string;
  sport: string;
  type: 'training' | 'competition' | 'both';
  fabric: string;
  density: string;
  includes: string[];
  care: string[];
  description: string;
  /**
   * Belt status extracted from YML description комплектація block:
   * - 'included'  → белый/белий пояс is listed as part of комплект (В комплекті: куртка, штани, білий пояс)
   * - 'gift'      → belt offered as a separate gift (пояс у подарунок / синій пояс та рюкзак-мішок в подарунок)
   * - 'excluded'  → explicitly stated belt NOT included
   * - null        → no info in YML (don't show negative text)
   */
  beltStatus?: 'included' | 'gift' | 'excluded' | null;
  /**
   * judoLevel — audience/level classification for judo kimono filters.
   * - 'children'      → дитячі/юніорські моделі (NXT, FUTURE 2, Koka, BEGINNER)
   * - 'teens_adults'  → підлітки та дорослі, тренувальні (BASIC 2, ULTRALIGHT, Wazari, ADVANCED, PRO)
   * - 'professional'  → ліцензійні/pro моделі (LEGEND 2 IJF, ULTRALIGHT also matches via filter)
   * Only set for judo kimono; undefined for belts, bags, other sports.
   */
  judoLevel?: 'children' | 'teens_adults' | 'professional';
  /**
   * modelSeries — normalized series/model name for "Серія / модель" filter.
   * Extracted from brand + product name. Undefined when series can't be determined.
   * Examples: "FUTURE 2", "NXT Red", "LEGEND 2 IJF", "ULTRALIGHT", "BEGINNER", "Koka"
   */
  modelSeries?: string;
  isHit?: boolean;
  isNew?: boolean;
  relatedIds: string[];
  vendorCode?: string;
};
