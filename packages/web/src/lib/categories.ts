export type CategorySlug = 'karate' | 'judo' | 'bjj' | 'dytiachy' | 'uncategorized';
export type ProductType =
  | 'kimono'
  | 'belts'
  | 'footwear'
  | 'tshirts'
  | 'bags'
  | 'trainers'
  | 'sauna_suit'
  | 'uniform'
  | 'other'
  | 'uncategorized';
export type SportSlug =
  | 'karate'
  | 'judo'
  | 'bjj'
  | 'grappling'
  | 'sambo'
  | 'aikido'
  | 'rukopashnyy_biy'
  | 'boyovyi_khortyng'
  | 'uncategorized';

export type NormalizedProductMeta = {
  brand: string;
  productType: ProductType;
  sportSlug: SportSlug;
  ageGroup: string;
  isChildren: boolean;
  categorySlug: CategorySlug;
  size: string;
  color: string;
  available: boolean;
  price: number;
};

const SPORT_LABELS: Record<SportSlug, string> = {
  karate: 'Карате',
  judo: 'Дзюдо',
  bjj: 'Джиу-джитсу / BJJ',
  grappling: 'Грепплінг',
  sambo: 'Самбо',
  aikido: 'Айкідо',
  rukopashnyy_biy: 'Рукопашний бій',
  boyovyi_khortyng: 'Бойовий хортинг',
  uncategorized: 'Інше',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  kimono: 'Кімоно',
  belts: 'Пояси',
  footwear: 'Взуття',
  tshirts: 'Футболки',
  bags: 'Сумки та рюкзаки',
  trainers: 'Тренажери',
  sauna_suit: 'Костюм-сауна',
  uniform: 'Форма',
  other: 'Інше',
  uncategorized: 'Інше',
};

export const SIZE_DIMENSION_LABELS: Record<ProductType, string | null> = {
  kimono: 'Зріст (см)',
  belts: 'Довжина',
  footwear: 'Розмір взуття',
  tshirts: 'Розмір',
  bags: null,
  trainers: 'Розмір',
  sauna_suit: 'Розмір',
  uniform: 'Зріст (см)',
  other: 'Розмір',
  uncategorized: 'Розмір',
};

const SPORT_PATTERNS: Array<{ slug: Exclude<SportSlug, 'uncategorized'>; patterns: RegExp[] }> = [
  { slug: 'karate', patterns: [/\bkarate\b/i, /карате/i] },
  { slug: 'judo', patterns: [/\bjudo\b/i, /дзюдо/i] },
  // grappling MUST come before bjj — "грепплінг" is more specific
  {
    slug: 'grappling',
    patterns: [/грепплінг/i, /grappl/i],
  },
  {
    slug: 'bjj',
    patterns: [/\bbjj\b/i, /jiu/i, /jitsu/i, /джиу/i],
  },
  { slug: 'sambo', patterns: [/\bsambo\b/i, /самбо/i] },
  { slug: 'aikido', patterns: [/\baikido\b/i, /айкідо/i] },
  { slug: 'rukopashnyy_biy', patterns: [/рукопаш/i] },
  { slug: 'boyovyi_khortyng', patterns: [/хортинг/i] },
];

const CHILD_PATTERNS = [/children/i, /kids?/i, /дитяч/i, /детск/i];

/**
 * Order matters: more specific patterns first.
 * Each entry: patterns matched against the full product text.
 * We check from first to last and return on first match.
 */
const PRODUCT_TYPE_PATTERNS: Array<{ type: ProductType; patterns: RegExp[] }> = [
  // sauna suit — very specific, check before others
  { type: 'sauna_suit', patterns: [/сауна[- ]?костюм/i, /костюм[- ]?саун/i, /sauna.?suit/i] },
  // footwear — shoes/boots/sambo shoes (самбовка = uniform, NOT here)
  {
    type: 'footwear',
    patterns: [/\bfootwear\b/i, /\bshoes?\b/i, /взутт/i, /самбетки/i, /борцовки/i, /тапки/i],
  },
  // bags — before belts to avoid sумка matching пояс
  {
    type: 'bags',
    patterns: [/\bbag\b/i, /рюкзак/i, /сумка/i, /сумки/i, /валіза/i, /мішок/i],
  },
  // trainers / equipment
  {
    type: 'trainers',
    patterns: [/тренаж/i, /канат.рукав/i, /захват/i, /uchi.kom/i, /учі комі/i, /колесо/i],
  },
  // t-shirts
  { type: 'tshirts', patterns: [/t-?shirt/i, /футболк/i] },
  // belts — NOTE: \b doesn't work with Cyrillic in JS, use explicit non-word lookahead
  { type: 'belts', patterns: [/\bbelts?\b/i, /пояс/i] },
  // uniform — форма для самбо/хортингу/etc (NOT кімоно)
  // NOTE: \b doesn't work with Cyrillic — avoid it for all Cyrillic patterns
  {
    type: 'uniform',
    patterns: [/форма.*самбо/i, /самбо.*форма/i, /самбовка/i, /форма для.*(хортинг|бойов|единоборств)/i],
  },
  // kimono — must come after belts to avoid "пояс" in description matching kimono
  { type: 'kimono', patterns: [/кімоно/i, /\bkimono\b/i, /\bгі\b/i] },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&nbsp;/g, ' ')
    .replace(/[\s\-_/.,()\[\]{}|:+*?!"'`]+/g, ' ')
    .trim();
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((re) => re.test(text));
}

export function detectSportSlug(...values: Array<string | undefined | null>): SportSlug {
  for (const value of values) {
    if (!value) continue;
    const text = normalizeText(value);
    for (const entry of SPORT_PATTERNS) {
      if (matchesAny(text, entry.patterns)) return entry.slug;
    }
  }
  return 'uncategorized';
}

export function detectIsChildren(...values: Array<string | undefined | null>) {
  return values.some((value) => (value ? matchesAny(normalizeText(value), CHILD_PATTERNS) : false));
}

export function detectProductType(...values: Array<string | undefined | null>): ProductType {
  // First pass: match only on the first value (product name — most reliable signal)
  const name = values[0];
  if (name) {
    const nameText = normalizeText(name);
    for (const entry of PRODUCT_TYPE_PATTERNS) {
      if (matchesAny(nameText, entry.patterns)) return entry.type;
    }
  }
  // Second pass: match on all values combined (vendor, category path, params)
  // but EXCLUDE the description (last value) to avoid false positives from marketing copy
  const nonDesc = values.slice(0, -1).filter(Boolean).join(' | ');
  if (nonDesc) {
    const combinedText = normalizeText(nonDesc);
    for (const entry of PRODUCT_TYPE_PATTERNS) {
      if (matchesAny(combinedText, entry.patterns)) return entry.type;
    }
  }
  return 'uncategorized';
}

export function normalizeCategorySlugByMeta(
  sportSlug: SportSlug,
  isChildren: boolean,
): CategorySlug {
  if (isChildren) return 'dytiachy';
  if (sportSlug === 'karate') return 'karate';
  if (sportSlug === 'judo') return 'judo';
  if (sportSlug === 'bjj' || sportSlug === 'grappling') return 'bjj';
  return 'uncategorized';
}

export function getSportLabel(slug: SportSlug): string {
  return SPORT_LABELS[slug];
}
