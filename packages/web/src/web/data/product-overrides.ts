export interface ProductOverride {
  shortDesc: string;
  features: string[];
  /**
   * kit — used only when kitFixed = true (static kit regardless of active color).
   * When kitFixed is false/absent, belt-rules determines the kit dynamically.
   */
  kit: string[];
  /**
   * kitFixed = true  → override.kit is used directly, belt-rules ignored.
   * kitFixed = false → belt-rules determines kit based on active color.
   */
  kitFixed: boolean;
  audience: string;
  care: string[];
  /**
   * imagesBySizeGte — when a size ≥ threshold is selected, swap product images.
   * Key: minimum size (number). Value: map of color name → image URL array.
   * Colors are matched case-insensitively; use '' as fallback for all colors.
   *
   * Example: { 155: { 'Синій': [...], 'Червоний': [...] } }
   */
  imagesBySizeGte?: Record<number, Record<string, string[]>>;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function densityNum(raw?: string): number {
  if (!raw) return 0;
  const m = raw.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// ─── matchers ────────────────────────────────────────────────────────────────

function isBudogiBeginner(brand: string, name: string, sport: string, type: string): boolean {
  return brand === 'BUDOGI' && name.includes('BEGINNER') && sport === 'judo' && type === 'kimono';
}

function isBudogiAdvanced(brand: string, name: string, sport: string, type: string): boolean {
  return brand === 'BUDOGI' && name.includes('ADVANCED') && sport === 'judo' && type === 'kimono';
}

function isBudogiPro(brand: string, name: string, sport: string, type: string): boolean {
  return brand === 'BUDOGI' && name.includes('PRO') && sport === 'judo' && type === 'kimono';
}

function isKintayoKoka(brand: string, name: string, sport: string, type: string): boolean {
  return brand.toLowerCase() === 'kintayo' && name.includes('Koka') && sport === 'judo' && type === 'kimono';
}

function isKintayoYuko(brand: string, name: string, sport: string, type: string): boolean {
  return brand.toLowerCase() === 'kintayo' && name.includes('Yuko') && sport === 'judo' && type === 'kimono';
}

function isKintayoWazari(brand: string, name: string, sport: string, type: string): boolean {
  return brand.toLowerCase() === 'kintayo' && name.includes('Wazari') && sport === 'judo' && type === 'kimono';
}

function isIpponGearFuture2(brand: string, name: string, sport: string, type: string): boolean {
  // Match "FUTURE 2" but NOT "FUTURE 2.0" (that's a different pink kids model)
  const n = name.toUpperCase();
  return (brand === 'IPPON GEAR' || brand === 'IPPONGEAR')
    && n.includes('FUTURE 2')
    && !n.includes('FUTURE 2.0')
    && sport === 'judo'
    && type === 'kimono';
}

function isIppon(brand: string): boolean {
  return brand === 'IPPON GEAR' || brand === 'IPPONGEAR';
}

// NXT (хлопчики) — "NXT" в назві, без "red"/"Red"/"RED", без "FUTURE"
function isIpponGearNxtBoys(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('NXT')
    && !n.includes('RED')
    && !n.includes('FUTURE')
    && sport === 'judo'
    && type === 'kimono';
}

// NXT Red (дівчата) — "NXT" + "red"/"RED"/"Red"
function isIpponGearNxtRed(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('NXT')
    && n.includes('RED')
    && sport === 'judo'
    && type === 'kimono';
}

// FUTURE 2.0 PINK
function isIpponGearFuture20Pink(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('FUTURE 2.0')
    && sport === 'judo'
    && type === 'kimono';
}

// ULTRALIGHT Slim Fit — "ULTRALIGHT" + "SLIM"
function isIpponGearUltralightSlim(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('ULTRALIGHT')
    && n.includes('SLIM')
    && sport === 'judo'
    && type === 'kimono';
}

// ULTRALIGHT Regular — "ULTRALIGHT" без "SLIM"
function isIpponGearUltralightRegular(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('ULTRALIGHT')
    && !n.includes('SLIM')
    && sport === 'judo'
    && type === 'kimono';
}

// BASIC 2
function isIpponGearBasic2(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('BASIC 2')
    && sport === 'judo'
    && type === 'kimono';
}

// LEGEND 2 Women — перевіряємо раніше за Slim/Regular
function isIpponGearLegend2Women(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('LEGEND 2')
    && n.includes('WOMEN')
    && sport === 'judo'
    && type === 'kimono';
}

// LEGEND 2 Slim Fit — "LEGEND 2" + "SLIM"
function isIpponGearLegend2Slim(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('LEGEND 2')
    && n.includes('SLIM')
    && !n.includes('WOMEN')
    && sport === 'judo'
    && type === 'kimono';
}

// LEGEND 2 Regular — "LEGEND 2" без "SLIM" і без "WOMEN"
function isIpponGearLegend2Regular(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toUpperCase();
  return isIppon(brand)
    && n.includes('LEGEND 2')
    && !n.includes('SLIM')
    && !n.includes('WOMEN')
    && sport === 'judo'
    && type === 'kimono';
}

// ─── AIKIDO matchers ──────────────────────────────────────────────────────────

// BUDOGI AIKIDO 240 g/m² — діти хлопчики
function isBudogiAikido240Boys(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'aikido'
    && type === 'kimono'
    && n.includes('хлопч')
    && !n.includes('чолов')
    && !n.includes('парн')
    && (n.includes('240') || !n.includes('350') && !n.includes('500'));
}

// BUDOGI AIKIDO 240 g/m² — діти дівчатка
function isBudogiAikido240Girls(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'aikido'
    && type === 'kimono'
    && n.includes('дівч')
    && !n.includes('жінок')
    && !n.includes('хлопч')
    && (n.includes('240') || (!n.includes('350') && !n.includes('500')));
}

// BUDOGI AIKIDO 350 g/m² BEGINNER — діти хлопчики
function isBudogiAikido350Boys(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'aikido'
    && type === 'kimono'
    && n.includes('хлопч')
    && !n.includes('чолов')
    && !n.includes('парн')
    && n.includes('350');
}

// BUDOGI AIKIDO 350 g/m² BEGINNER — діти дівчатка
function isBudogiAikido350Girls(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'aikido'
    && type === 'kimono'
    && n.includes('дівч')
    && !n.includes('жінок')
    && n.includes('350');
}

// BUDOGI AIKIDO 240 g/m² — дорослі чоловіки / хлопці
function isBudogiAikido240Men(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'aikido'
    && type === 'kimono'
    && (n.includes('чолов') || n.includes('парн') || n.includes('хлопц'))
    && !n.includes('хлопч') // not boys
    && n.includes('240');
}

// BUDOGI AIKIDO 240 g/m² — дорослі жінки / дівчата
function isBudogiAikido240Women(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'aikido'
    && type === 'kimono'
    && (n.includes('жінок') || (n.includes('дівч') && !n.includes('дівчаток')))
    && n.includes('240');
}

// BUDOGI AIKIDO 500 g/m² — дорослі чоловіки / хлопці
function isBudogiAikido500Men(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'aikido'
    && type === 'kimono'
    && (n.includes('чолов') || n.includes('парн') || n.includes('хлопц'))
    && !n.includes('хлопч')
    && n.includes('500');
}

// BUDOGI AIKIDO 500 g/m² — дорослі жінки / дівчата
function isBudogiAikido500Women(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'aikido'
    && type === 'kimono'
    && (n.includes('жінок') || (n.includes('дівч') && !n.includes('дівчаток')))
    && n.includes('500');
}

// Catch-all: BUDOGI AIKIDO (any remaining)
function isBudogiAikidoAny(brand: string, sport: string, type: string): boolean {
  return brand === 'BUDOGI' && sport === 'aikido' && type === 'kimono';
}

// ─── KARATE matchers ──────────────────────────────────────────────────────────

// BUDOGI KARATE 240 g/m² — діти хлопчики
function isBudogiKarate240Boys(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'karate'
    && type === 'kimono'
    && n.includes('хлопч')
    && !n.includes('чолов') && !n.includes('парн');
}

// BUDOGI KARATE 240 g/m² — діти дівчатка
function isBudogiKarate240Girls(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'karate'
    && type === 'kimono'
    && n.includes('дівч')
    && !n.includes('жінок');
}

// BUDOGI KARATE 240 g/m² — дорослі чоловіки
function isBudogiKarate240Men(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'karate'
    && type === 'kimono'
    && (n.includes('чолов') || n.includes('парн') || n.includes('хлопц'))
    && !n.includes('хлопч');
}

// BUDOGI KARATE 240 g/m² — дорослі жінки
function isBudogiKarate240Women(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI'
    && sport === 'karate'
    && type === 'kimono'
    && (n.includes('жінок') || (n.includes('дівч') && !n.includes('дівчаток')));
}

// Kintayo KARATE — діти (id 261)
function isKintayoKarate(brand: string, sport: string, type: string, isChildren: boolean): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'karate' && type === 'kimono' && isChildren;
}

// Kintayo KARATE — дорослі (id 261_adult)
function isKintayoKarateAdult(brand: string, sport: string, type: string, isChildren: boolean): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'karate' && type === 'kimono' && !isChildren;
}

// ─── GRAPPLING matchers ───────────────────────────────────────────────────────

// BUDOGI GRAPPLING 350 г/м² — діти хлопчики (id 1583)
function isBudogiGrappling350Boys(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI' && sport === 'grappling' && type === 'kimono'
    && n.includes('хлопч')
    && !n.includes('чолов') && !n.includes('парн');
}

// BUDOGI GRAPPLING 350 г/м² — діти дівчатка (id 1587)
function isBudogiGrappling350Girls(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI' && sport === 'grappling' && type === 'kimono'
    && n.includes('дівч')
    && !n.includes('жінок');
}

// BUDOGI GRAPPLING 450 г/м² — дорослі чоловіки (id 1599)
function isBudogiGrappling450Men(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI' && sport === 'grappling' && type === 'kimono'
    && (n.includes('чолов') || n.includes('парн') || n.includes('хлопц'))
    && !n.includes('хлопч');
}

// BUDOGI GRAPPLING 450 г/м² — дорослі жінки (id 1603)
function isBudogiGrappling450Women(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI' && sport === 'grappling' && type === 'kimono'
    && (n.includes('жінок') || n.includes('дівч'));
}

// KINTAYO GRAPPLING 350 г/м² — діти (id 1401)
function isKintayoGrapplingKids(brand: string, sport: string, type: string, isChildren: boolean): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'grappling' && type === 'kimono' && isChildren;
}

// KINTAYO GRAPPLING 450 г/м² — дорослі (id 1405)
function isKintayoGrapplingAdult(brand: string, sport: string, type: string, isChildren: boolean): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'grappling' && type === 'kimono' && !isChildren;
}

// ─── SAMBO matchers ───────────────────────────────────────────────────────────

// KINTAYO САМБОВКА 550 г/м² (id 1040)
function isKintayoSamboUniform(brand: string, sport: string, type: string): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'sambo' && type === 'uniform';
}

// KINTAYO САМБЕТКИ (id 1066)
function isKintayoSamboShoes(brand: string, sport: string, type: string): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'sambo' && type === 'footwear';
}

// ─── BJJ matchers ─────────────────────────────────────────────────────────────

// BUDOGI BJJ 350 г/м² — діти хлопчики (id 1500)
function isBudogiBjj350Boys(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI' && sport === 'bjj' && type === 'kimono'
    && n.includes('хлопч')
    && !n.includes('чолов') && !n.includes('парн');
}

// BUDOGI BJJ 350 г/м² — діти дівчатка (id 1520)
function isBudogiBjj350Girls(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI' && sport === 'bjj' && type === 'kimono'
    && n.includes('дівч')
    && !n.includes('жінок');
}

// BUDOGI BJJ 450 г/м² — дорослі чоловіки (id 1524)
function isBudogiBjj450Men(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI' && sport === 'bjj' && type === 'kimono'
    && (n.includes('чолов') || n.includes('парн') || n.includes('хлопц'))
    && !n.includes('хлопч');
}

// BUDOGI BJJ 450 г/м² — дорослі жінки (id 1540)
function isBudogiBjj450Women(brand: string, name: string, sport: string, type: string): boolean {
  const n = name.toLowerCase();
  return brand === 'BUDOGI' && sport === 'bjj' && type === 'kimono'
    && (n.includes('жінок') || n.includes('дівч'));
}

// KINTAYO BJJ 350 г/м² — діти (id 244)
function isKintayoBjjKids(brand: string, sport: string, type: string, isChildren: boolean): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'bjj' && type === 'kimono' && isChildren;
}

// KINTAYO BJJ 450 г/м² — дорослі (id 181)
function isKintayoBjjAdult(brand: string, sport: string, type: string, isChildren: boolean): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'bjj' && type === 'kimono' && !isChildren;
}

export function getProductOverride(
  brand: string,
  name: string,
  sportSlug: string,
  productType: string,
  density?: string,
  isChildren?: boolean,
): ProductOverride | null {
  // ── JUDO ─────────────────────────────────────────────────────────
  if (isBudogiBeginner(brand, name, sportSlug, productType))        return BUDOGI_BEGINNER_JUDO;
  if (isBudogiAdvanced(brand, name, sportSlug, productType))        return BUDOGI_ADVANCED_JUDO;
  if (isBudogiPro(brand, name, sportSlug, productType))             return BUDOGI_PRO_JUDO;
  if (isKintayoKoka(brand, name, sportSlug, productType))           return KINTAYO_KOKA_JUDO;
  if (isKintayoYuko(brand, name, sportSlug, productType))           return KINTAYO_YUKO_JUDO;
  if (isKintayoWazari(brand, name, sportSlug, productType)) {
    return densityNum(density) >= 600 ? KINTAYO_WAZARI_650_JUDO : KINTAYO_WAZARI_550_JUDO;
  }
  if (isIpponGearFuture2(brand, name, sportSlug, productType))      return IPPON_GEAR_FUTURE2_JUDO;
  if (isIpponGearNxtBoys(brand, name, sportSlug, productType))      return IPPON_GEAR_NXT_BOYS_JUDO;
  if (isIpponGearNxtRed(brand, name, sportSlug, productType))       return IPPON_GEAR_NXT_RED_JUDO;
  if (isIpponGearFuture20Pink(brand, name, sportSlug, productType)) return IPPON_GEAR_FUTURE20_PINK_JUDO;
  if (isIpponGearUltralightSlim(brand, name, sportSlug, productType))    return IPPON_GEAR_ULTRALIGHT_SLIM_JUDO;
  if (isIpponGearUltralightRegular(brand, name, sportSlug, productType)) return IPPON_GEAR_ULTRALIGHT_REGULAR_JUDO;
  if (isIpponGearBasic2(brand, name, sportSlug, productType))       return IPPON_GEAR_BASIC2_JUDO;
  if (isIpponGearLegend2Women(brand, name, sportSlug, productType)) return IPPON_GEAR_LEGEND2_WOMEN_JUDO;
  if (isIpponGearLegend2Slim(brand, name, sportSlug, productType))  return IPPON_GEAR_LEGEND2_SLIM_JUDO;
  if (isIpponGearLegend2Regular(brand, name, sportSlug, productType)) return IPPON_GEAR_LEGEND2_REGULAR_JUDO;

  // ── AIKIDO ───────────────────────────────────────────────────────
  // Order: specific density+gender first, catch-all last
  if (isBudogiAikido500Men(brand, name, sportSlug, productType))    return BUDOGI_AIKIDO_500_MEN;
  if (isBudogiAikido500Women(brand, name, sportSlug, productType))  return BUDOGI_AIKIDO_500_WOMEN;
  if (isBudogiAikido350Boys(brand, name, sportSlug, productType))   return BUDOGI_AIKIDO_350_BOYS;
  if (isBudogiAikido350Girls(brand, name, sportSlug, productType))  return BUDOGI_AIKIDO_350_GIRLS;
  if (isBudogiAikido240Men(brand, name, sportSlug, productType))    return BUDOGI_AIKIDO_240_MEN;
  if (isBudogiAikido240Women(brand, name, sportSlug, productType))  return BUDOGI_AIKIDO_240_WOMEN;
  if (isBudogiAikido240Boys(brand, name, sportSlug, productType))   return BUDOGI_AIKIDO_240_BOYS;
  if (isBudogiAikido240Girls(brand, name, sportSlug, productType))  return BUDOGI_AIKIDO_240_GIRLS;
  if (isBudogiAikidoAny(brand, sportSlug, productType))             return BUDOGI_AIKIDO_240_BOYS; // safe fallback

  // ── KARATE ───────────────────────────────────────────────────────
  if (isBudogiKarate240Men(brand, name, sportSlug, productType))    return BUDOGI_KARATE_240_MEN;
  if (isBudogiKarate240Women(brand, name, sportSlug, productType))  return BUDOGI_KARATE_240_WOMEN;
  if (isBudogiKarate240Boys(brand, name, sportSlug, productType))   return BUDOGI_KARATE_240_BOYS;
  if (isBudogiKarate240Girls(brand, name, sportSlug, productType))  return BUDOGI_KARATE_240_GIRLS;
  if (isKintayoKarateAdult(brand, sportSlug, productType, isChildren ?? false)) return KINTAYO_KARATE_ADULT;
  if (isKintayoKarate(brand, sportSlug, productType, isChildren ?? true))       return KINTAYO_KARATE_KIDS;

  // ── BJJ / ДЖ­ИУ-ДЖИТСУ ───────────────────────────────────────────
  if (isBudogiBjj350Boys(brand, name, sportSlug, productType))   return BUDOGI_BJJ_350_BOYS;
  if (isBudogiBjj350Girls(brand, name, sportSlug, productType))  return BUDOGI_BJJ_350_GIRLS;
  if (isBudogiBjj450Men(brand, name, sportSlug, productType))    return BUDOGI_BJJ_450_MEN;
  if (isBudogiBjj450Women(brand, name, sportSlug, productType))  return BUDOGI_BJJ_450_WOMEN;
  if (isKintayoBjjAdult(brand, sportSlug, productType, isChildren ?? false)) return KINTAYO_BJJ_450_ADULT;
  if (isKintayoBjjKids(brand, sportSlug, productType, isChildren ?? true))   return KINTAYO_BJJ_350_KIDS;

  // ── GRAPPLING ────────────────────────────────────────────────────────────
  if (isBudogiGrappling350Boys(brand, name, sportSlug, productType))   return BUDOGI_GRAPPLING_350_BOYS;
  if (isBudogiGrappling350Girls(brand, name, sportSlug, productType))  return BUDOGI_GRAPPLING_350_GIRLS;
  if (isBudogiGrappling450Men(brand, name, sportSlug, productType))    return BUDOGI_GRAPPLING_450_MEN;
  if (isBudogiGrappling450Women(brand, name, sportSlug, productType))  return BUDOGI_GRAPPLING_450_WOMEN;
  if (isKintayoGrapplingAdult(brand, sportSlug, productType, isChildren ?? false)) return KINTAYO_GRAPPLING_450_ADULT;
  if (isKintayoGrapplingKids(brand, sportSlug, productType, isChildren ?? true))   return KINTAYO_GRAPPLING_350_KIDS;

  // ── САМБО ────────────────────────────────────────────────────────────────
  if (isKintayoSamboUniform(brand, sportSlug, productType)) return KINTAYO_SAMBO_UNIFORM;
  if (isKintayoSamboShoes(brand, sportSlug, productType))   return KINTAYO_SAMBO_SHOES;

  return null;
}

// ─── overrides ───────────────────────────────────────────────────────────────

const BUDOGI_BEGINNER_JUDO: ProductOverride = {
  shortDesc:
    'BUDOGI BEGINNER — дитяче кімоно для дзюдо початкового рівня. Підійде для перших тренувань, занять у секції та регулярного використання.',
  features: [
    'Куртка з комбінованої тканини: верх із Sashiko, нижня частина з легкої міцної тканини з ромбоподібним плетінням',
    'Посилені груди, плечі, пахвова зона та коліна',
    'Штани з резинкою та шнурком — дитині легше самостійно одягатися',
    'Щільність: 350 г/м²',
    'Орієнтовна усадка після прання: 2–3 см',
    'Всередині куртки є місце для підпису прізвища',
  ],
  // BUDOGI BEGINNER: білий пояс у комплекті для ОБОХ кольорів — фіксовано
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дітей, які починають займатися дзюдо або шукають зручне тренувальне кімоно для регулярних занять.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

const BUDOGI_ADVANCED_JUDO: ProductOverride = {
  shortDesc:
    'BUDOGI ADVANCED — кімоно для дзюдо щільністю 500 г/м² для підлітків і дорослих. Підійде для регулярних тренувань і спортсменів, яким потрібне щільніше дзюдогі.',
  features: [
    'Щільність тканини: 500 г/м²',
    'Підходить для регулярних тренувань з дзюдо',
    'Щільніша тканина краще тримає форму під час захватів',
    'Куртка має зручний крій для свободи рухів',
    'Розраховане на підлітків і дорослих спортсменів',
    'Штани підходять для активної роботи на тренуваннях',
    'Модель доступна у білому та синьому кольорі',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  // Пояс не входить — belt-rules вже повертає excluded для density 500
  kit: [],
  kitFixed: false,
  audience:
    'Для підлітків і дорослих, які регулярно займаються дзюдо та хочуть щільніше кімоно для тренувань. Підійде спортсменам, які вже переросли базові дитячі серії та шукають більш надійний варіант для постійних занять.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

const BUDOGI_PRO_JUDO: ProductOverride = {
  shortDesc:
    'BUDOGI PRO — щільне кімоно для дзюдо 650 г/м² для підлітків і дорослих спортсменів. Модель створена для інтенсивних тренувань і тих, кому потрібне міцне дзюдогі з кращим контролем під час захватів.',
  features: [
    'Щільність тканини: 650 г/м²',
    'Підходить для інтенсивних тренувань з дзюдо',
    'Щільна тканина краще тримає форму під час захватів',
    'Розраховане на підлітків і дорослих спортсменів',
    'Куртка має зручний крій для активної роботи на татамі',
    'Штани підходять для регулярних навантажень на тренуваннях',
    'Модель доступна у білому та синьому кольорі',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  // Пояс не входить — belt-rules повертає excluded для density 650
  kit: [],
  kitFixed: false,
  audience:
    'Для підлітків і дорослих спортсменів, які регулярно тренуються та хочуть щільніше кімоно для дзюдо. BUDOGI PRO підійде тим, кому потрібна більш міцна модель для активної роботи в захватах і стабільного використання на тренуваннях.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

const KINTAYO_KOKA_JUDO: ProductOverride = {
  shortDesc:
    'KINTAYO Koka — дитяче кімоно для дзюдо щільністю 350 г/м². Підходить для перших тренувань, занять у секції та регулярного використання дітьми.',
  features: [
    'Щільність тканини: 350 г/м²',
    'Підходить для перших тренувань з дзюдо',
    'Зручний крій для занять у секції',
    'Розраховане на дітей, які починають займатися дзюдо',
    'Підійде для регулярних тренувань',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі товару',
  ],
  // kitFixed = false → belt-rules визначає kit за activeColor:
  // білий 350 → Куртка + Штани + Білий пояс
  // синій 350 → Куртка + Штани
  kit: [],
  kitFixed: false,
  audience:
    'Для дітей, які починають займатися дзюдо або шукають зручне тренувальне кімоно для регулярних занять у секції.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

const KINTAYO_YUKO_JUDO: ProductOverride = {
  shortDesc:
    'KINTAYO Yuko — кімоно для дзюдо щільністю 450 г/м². Модель підходить для регулярних тренувань, занять у секції та спортсменів, яким потрібне щільніше кімоно для активної роботи на татамі.',
  features: [
    'Щільність тканини: 450 г/м²',
    'Підходить для регулярних тренувань з дзюдо',
    'Щільніша тканина краще тримає форму під час захватів',
    'Зручний крій для занять у секції',
    'Підійде дітям, підліткам і спортсменам, які регулярно займаються дзюдо',
    'Модель доступна у білому та синьому кольорі',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі товару',
    'Для тренувань у секції та регулярного використання на татамі',
  ],
  // kitFixed = false → belt-rules визначає kit за activeColor:
  // білий 450 → Куртка + Штани + Білий пояс
  // синій 450 → Куртка + Штани + Пояс не входить у комплект
  kit: [],
  kitFixed: false,
  audience:
    'Для дітей, підлітків і спортсменів, які регулярно займаються дзюдо та хочуть щільніше кімоно для тренувань. Модель підійде для занять у секції, відпрацювання техніки та активної роботи в захватах.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

const KINTAYO_WAZARI_550_JUDO: ProductOverride = {
  shortDesc:
    'KINTAYO Wazari — кімоно для дзюдо щільністю 550 г/м² для регулярних тренувань і спортсменів з досвідом. Модель має щільнішу куртку, добре тримає форму під час захватів і підходить для активної роботи на татамі.',
  features: [
    'Щільність куртки: 550 г/м²',
    'Підходить для регулярних тренувань з дзюдо',
    'Щільна тканина краще тримає форму під час захватів',
    'Куртка поєднує тканину типу "плетінка" та "ромб"',
    'Посилені зони в ділянці грудей, пахв і колін',
    'Штани на шнурку, без резинки',
    'Розраховане на спортсменів з досвідом',
    'Модель доступна у білому та синьому кольорі',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі товару',
  ],
  // kitFixed = false → belt-rules визначає kit за activeColor:
  // KINTAYO judo 550 → excluded для будь-якого кольору (не входить в умову 350/450)
  // результат: Куртка + Штани + рядок "Пояс не входить у комплект"
  kit: [],
  kitFixed: false,
  audience:
    'Для підлітків і дорослих спортсменів, які регулярно займаються дзюдо та хочуть щільніше кімоно для тренувань. KINTAYO Wazari підійде тим, кому потрібна більш міцна модель для активної роботи в захватах і стабільного використання на татамі.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

const KINTAYO_WAZARI_650_JUDO: ProductOverride = {
  shortDesc:
    'KINTAYO Wazari — щільне кімоно для дзюдо 650 г/м² для підлітків і дорослих спортсменів. Модель підходить для регулярних тренувань, активної роботи в захватах і тих, кому потрібне більш міцне дзюдогі.',
  features: [
    'Щільність тканини: 650 г/м²',
    'Підходить для регулярних та інтенсивних тренувань з дзюдо',
    'Щільна тканина краще тримає форму під час захватів',
    'Розраховане на підлітків і дорослих спортсменів',
    'Підійде спортсменам, яким потрібне більш міцне тренувальне кімоно',
    'Добре підходить для активної роботи на татамі',
    'Модель доступна у білому та синьому кольорі',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі товару',
  ],
  // kitFixed = false → belt-rules: KINTAYO judo 650 → excluded для будь-якого кольору
  // результат: Куртка + Штани + "Пояс не входить у комплект"
  kit: [],
  kitFixed: false,
  audience:
    'Для підлітків і дорослих спортсменів, які регулярно займаються дзюдо та хочуть щільне кімоно для тренувань. KINTAYO Wazari 650 г/м² підійде тим, кому потрібна більш міцна модель для активної роботи в захватах і стабільного використання на татамі.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

const IPPON_GEAR_FUTURE2_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR FUTURE 2 — дитяче кімоно для дзюдо щільністю 335 г/м². Модель створена для перших тренувань, занять у секції та регулярного використання юними спортсменами. У комплект входять куртка, штани та білий пояс.',
  features: [
    'Щільність тканини: 335 г/м²',
    'Підходить для перших тренувань з дзюдо',
    'Зручний крій для занять у секції',
    'Комплектується білим поясом',
    'Підійде для регулярних тренувань',
    'Модель доступна у білому та синьому кольорі',
    'Доступні розміри від 100 до 160 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі товару',
  ],
  // kitFixed = true → override.kit використовується напряму, belt-rules ігнорується.
  // Для FUTURE 2: пояс завжди "Білий пояс", незалежно від кольору кімоно.
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дітей і юних спортсменів, які починають займатися дзюдо або шукають зручне тренувальне кімоно для регулярних занять у секції.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR NXT (хлопчики) ───────────────────────────────────────────────
const IPPON_GEAR_NXT_BOYS_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR NXT — дитяче кімоно для дзюдо щільністю 335 г/м². Підходить для перших тренувань і регулярних занять у секції. У комплект входять куртка, штани та білий пояс.',
  features: [
    'Щільність тканини: 335 г/м²',
    'Підходить для перших тренувань і занять у секції',
    'Стандартний крій — зручний для активних рухів',
    'Штани з резинкою та шнурком — легко одягати самостійно',
    'Розміри: 110–160 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience: 'Для хлопчиків, які починають займатися дзюдо або регулярно тренуються у секції.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR NXT Red (дівчата) ────────────────────────────────────────────
const IPPON_GEAR_NXT_RED_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR NXT Red — дитяче кімоно для дзюдо щільністю 335 г/м² для дівчат. Підходить для перших тренувань і регулярних занять у секції. У комплект входять куртка, штани та білий пояс.',
  features: [
    'Щільність тканини: 335 г/м²',
    'Підходить для перших тренувань і занять у секції',
    'Стандартний крій — зручний для активних рухів',
    'Штани з резинкою та шнурком — легко одягати самостійно',
    'Розміри: 120–160 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience: 'Для дівчат, які починають займатися дзюдо або регулярно тренуються у секції.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR FUTURE 2.0 PINK ──────────────────────────────────────────────
const IPPON_GEAR_FUTURE20_PINK_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR FUTURE 2.0 Pink — дитяче кімоно для дзюдо щільністю 335 г/м² для дівчаток. Підходить для перших тренувань і занять у секції. У комплект входять куртка, штани та білий пояс.',
  features: [
    'Щільність тканини: 335 г/м²',
    'Підходить для перших тренувань і регулярних занять',
    'Стандартний крій — зручний для активних рухів',
    'Штани з резинкою та шнурком — легко одягати самостійно',
    'Розміри: 110–160 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience: 'Для дівчаток, які починають займатися дзюдо або регулярно тренуються у секції.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR ULTRALIGHT Slim Fit ──────────────────────────────────────────
const IPPON_GEAR_ULTRALIGHT_SLIM_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR Ultralight — легке кімоно для дзюдо приталеного крою. Куртка 600 г/м², штани з легкої тканини 275 г/м². Створене з урахуванням стандартів IJF. Підходить для досвідчених спортсменів, яким важливі мобільність і легкість.',
  features: [
    'Щільність куртки: 600 г/м², штани: 275 г/м²',
    'Приталений крій (Slim Fit) — більше свободи рухів',
    'Легша конструкція порівняно з класичними кімоно',
    'Відповідає стандартам IJF',
    'Розміри: 140–195 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для досвідчених спортсменів, які хочуть легше кімоно для тренувань і цінують приталений крій.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR ULTRALIGHT Regular ───────────────────────────────────────────
const IPPON_GEAR_ULTRALIGHT_REGULAR_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR Ultralight — легке кімоно для дзюдо стандартного крою. Куртка 600 г/м², штани з легкої тканини 275 г/м². Створене з урахуванням стандартів IJF. Підходить для досвідчених спортсменів, яким важливі мобільність і легкість.',
  features: [
    'Щільність куртки: 600 г/м², штани: 275 г/м²',
    'Стандартний крій (Regular Fit) — класична посадка',
    'Легша конструкція порівняно з класичними кімоно',
    'Відповідає стандартам IJF',
    'Розміри: 140–195 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для досвідчених спортсменів, які хочуть легше кімоно для тренувань зі стандартним кроєм.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR BASIC 2 ──────────────────────────────────────────────────────
const IPPON_GEAR_BASIC2_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR Basic 2 — кімоно для дзюдо щільністю 500 г/м². Підходить для підлітків і спортсменів-аматорів, які регулярно тренуються. Стандартний крій, щільна тканина, доступні у білому та синьому кольорі.',
  features: [
    'Щільність тканини: 500 г/м²',
    'Стандартний крій — зручна посадка для тренувань',
    'Щільна тканина добре тримає форму під час захватів',
    'Доступні у білому та синьому кольорі',
    'Розміри: 140–200 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для підлітків і спортсменів-аматорів, які регулярно займаються дзюдо і шукають надійне тренувальне кімоно.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR LEGEND 2 Slim Fit ────────────────────────────────────────────
const IPPON_GEAR_LEGEND2_SLIM_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR Legend 2 — ліцензійне кімоно для дзюдо приталеного крою. Куртка 690 г/м², штани 275 г/м². Сертифіковано IJF (approved 2023). Призначено для професійних спортсменів і змагань найвищого рівня.',
  features: [
    'Щільність куртки: 690 г/м², штани: 275 г/м²',
    'Приталений крій (Slim Fit) — більше свободи рухів',
    'Сертифіковано IJF (approved 2023) — допущено до офіційних змагань',
    'Щільна куртка витримує інтенсивну роботу в захватах',
    'Доступні у білому та синьому кольорі',
    'Розміри: 145–210 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для професійних спортсменів, які беруть участь у змаганнях за правилами IJF і шукають кімоно приталеного крою.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR LEGEND 2 Regular ─────────────────────────────────────────────
const IPPON_GEAR_LEGEND2_REGULAR_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR Legend 2 — ліцензійне кімоно для дзюдо стандартного крою. Куртка 690 г/м², штани 275 г/м². Сертифіковано IJF (approved 2023). Призначено для професійних спортсменів і змагань найвищого рівня.',
  features: [
    'Щільність куртки: 690 г/м², штани: 275 г/м²',
    'Стандартний крій (Regular Fit) — класична посадка',
    'Сертифіковано IJF (approved 2023) — допущено до офіційних змагань',
    'Щільна куртка витримує інтенсивну роботу в захватах',
    'Доступні у білому та синьому кольорі',
    'Розміри: 145–210 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для професійних спортсменів, які беруть участь у змаганнях за правилами IJF і шукають кімоно стандартного крою.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── IPPON GEAR LEGEND 2 Women ────────────────────────────────────────────────
const IPPON_GEAR_LEGEND2_WOMEN_JUDO: ProductOverride = {
  shortDesc:
    'IPPON GEAR Legend 2 Women — ліцензійне кімоно для дзюдо з жіночим кроєм. Куртка 690 г/м², штани 275 г/м². Сертифіковано IJF (approved 2023). Призначено для спортсменок, які беруть участь у змаганнях найвищого рівня.',
  features: [
    'Щільність куртки: 690 г/м², штани: 275 г/м²',
    'Жіночий крій (Women Fit) — адаптований для спортсменок',
    'Сертифіковано IJF (approved 2023) — допущено до офіційних змагань',
    'Щільна куртка витримує інтенсивну роботу в захватах',
    'Доступні у білому та синьому кольорі',
    'Розміри: 160–180 см',
    'Гарантія IPPON GEAR — 3 місяці з моменту купівлі',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для спортсменок, які беруть участь у змаганнях за правилами IJF і шукають кімоно з жіночим кроєм.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// AIKIDO
// ═══════════════════════════════════════════════════════════════════════════════

const CARE_BASE = [
  'Прати при 30°C',
  'Рекомендований віджим: 400–600 об/хв',
  'Не відбілювати',
  'Сушити природним способом',
];

// ─── BUDOGI AIKIDO 240 г/м² — діти хлопчики (ID 1692) ───────────────────────
const BUDOGI_AIKIDO_240_BOYS: ProductOverride = {
  shortDesc:
    'BUDOGI — дитяче кімоно для айкідо щільністю 240 г/м². Модель підходить для хлопчиків, які починають займатися айкідо або регулярно тренуються у секції.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для тренувань з айкідо — відпрацювання техніки, переміщень і кидків',
    'Штани з резинкою та шнурком — дитині легше одягатися самостійно',
    'Усадка після прання: 1–2 см',
    'Всередині куртки є місце для підпису прізвища',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для хлопчиків, які починають займатися айкідо або шукають зручне кімоно для регулярних тренувань у секції.',
  care: CARE_BASE,
};

// ─── BUDOGI AIKIDO 240 г/м² — діти дівчатка (ID 1697) ───────────────────────
const BUDOGI_AIKIDO_240_GIRLS: ProductOverride = {
  shortDesc:
    'BUDOGI — дитяче кімоно для айкідо щільністю 240 г/м². Модель підходить для дівчаток, які починають займатися айкідо або регулярно тренуються у секції.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для тренувань з айкідо — відпрацювання техніки, переміщень і кидків',
    'Штани з резинкою та шнурком — дитині легше одягатися самостійно',
    'Усадка після прання: 1–2 см',
    'Всередині куртки є місце для підпису прізвища',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дівчаток, які починають займатися айкідо або шукають зручне кімоно для регулярних тренувань у секції.',
  care: CARE_BASE,
};

// ─── BUDOGI AIKIDO 350 г/м² BEGINNER — діти хлопчики (ID 1702) ──────────────
const BUDOGI_AIKIDO_350_BOYS: ProductOverride = {
  shortDesc:
    'BUDOGI BEGINNER — дитяче кімоно для айкідо щільністю 350 г/м². Модель підходить для хлопчиків, які займаються айкідо та хочуть щільніше кімоно для регулярних тренувань.',
  features: [
    'Щільність тканини: 350 г/м²',
    'Підходить для тренувань з айкідо — відпрацювання техніки, переміщень і кидків',
    'Куртка складається з двох частин: верх Sashiko, низ з ромбоподібним плетінням',
    'Посилені зони в ділянці грудей, плечей, пахв і колін',
    'Штани з резинкою та шнурком — дитині легше одягатися самостійно',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для хлопчиків, які займаються айкідо та хочуть щільніше і міцніше кімоно для регулярних тренувань у секції.',
  care: CARE_BASE,
};

// ─── BUDOGI AIKIDO 350 г/м² BEGINNER — діти дівчатка (ID 1707) ──────────────
const BUDOGI_AIKIDO_350_GIRLS: ProductOverride = {
  shortDesc:
    'BUDOGI BEGINNER — дитяче кімоно для айкідо щільністю 350 г/м². Модель підходить для дівчаток, які займаються айкідо та хочуть щільніше кімоно для регулярних тренувань.',
  features: [
    'Щільність тканини: 350 г/м²',
    'Підходить для тренувань з айкідо — відпрацювання техніки, переміщень і кидків',
    'Куртка складається з двох частин: верх Sashiko, низ з ромбоподібним плетінням',
    'Посилені зони в ділянці грудей, плечей, пахв і колін',
    'Штани з резинкою та шнурком — дитині легше одягатися самостійно',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дівчаток, які займаються айкідо та хочуть щільніше і міцніше кімоно для регулярних тренувань у секції.',
  care: CARE_BASE,
};

// ─── BUDOGI AIKIDO 240 г/м² — дорослі чоловіки (ID 1712) ────────────────────
const BUDOGI_AIKIDO_240_MEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для айкідо щільністю 240 г/м². Модель підходить для підлітків і дорослих, які займаються айкідо та цінують свободу рухів і зручність на тренуваннях.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для регулярних тренувань з айкідо — техніка, переміщення, кидки',
    'Легкий матеріал забезпечує свободу рухів',
    'Штани з резинкою та шнурком',
    'Усадка після прання: 1–2 см',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для підлітків і дорослих, які займаються айкідо та хочуть зручне кімоно для відпрацювання техніки, переміщень і кидків.',
  care: CARE_BASE,
};

// ─── BUDOGI AIKIDO 240 г/м² — дорослі жінки (ID 1716) ───────────────────────
const BUDOGI_AIKIDO_240_WOMEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для айкідо щільністю 240 г/м². Модель підходить для дівчат і жінок, які займаються айкідо та цінують свободу рухів і зручність на тренуваннях.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для регулярних тренувань з айкідо — техніка, переміщення, кидки',
    'Легкий матеріал забезпечує свободу рухів',
    'Штани з резинкою та шнурком',
    'Усадка після прання: 1–2 см',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дівчат і жінок, які займаються айкідо та хочуть зручне кімоно для відпрацювання техніки, переміщень і кидків.',
  care: CARE_BASE,
};

// ─── BUDOGI AIKIDO 500 г/м² — дорослі чоловіки (ID 1721) ────────────────────
const BUDOGI_AIKIDO_500_MEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для айкідо щільністю 500 г/м². Модель підходить для підлітків і дорослих, які регулярно займаються айкідо та хочуть щільніше і міцніше кімоно для тренувань.',
  features: [
    'Щільність тканини: 500 г/м²',
    'Підходить для регулярних тренувань з айкідо — техніка, переміщення, кидки',
    'Куртка складається з двох частин: верх Sashiko, низ з ромбоподібним плетінням',
    'Посилені зони в ділянці грудей, плечей, пахв і колін',
    'Штани з резинкою та шнурком',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани'],
  kitFixed: true,
  audience:
    'Для підлітків і дорослих, які регулярно займаються айкідо та хочуть щільніше кімоно для тривалих тренувань і активної роботи на татамі.',
  care: CARE_BASE,
};

// ─── BUDOGI AIKIDO 500 г/м² — дорослі жінки (ID 1727) ───────────────────────
const BUDOGI_AIKIDO_500_WOMEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для айкідо щільністю 500 г/м². Модель підходить для дівчат і жінок, які регулярно займаються айкідо та хочуть щільніше і міцніше кімоно для тренувань.',
  features: [
    'Щільність тканини: 500 г/м²',
    'Підходить для регулярних тренувань з айкідо — техніка, переміщення, кидки',
    'Куртка складається з двох частин: верх Sashiko, низ з ромбоподібним плетінням',
    'Посилені зони в ділянці грудей, плечей, пахв і колін',
    'Штани з резинкою та шнурком',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани'],
  kitFixed: true,
  audience:
    'Для дівчат і жінок, які регулярно займаються айкідо та хочуть щільніше кімоно для тривалих тренувань і активної роботи на татамі.',
  care: CARE_BASE,
};

// ═══════════════════════════════════════════════════════════════════════════════
// KARATE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── BUDOGI KARATE 240 г/м² — діти хлопчики (ID 1556) ───────────────────────
const BUDOGI_KARATE_240_BOYS: ProductOverride = {
  shortDesc:
    'BUDOGI — дитяче кімоно для карате щільністю 240 г/м². Модель підходить для хлопчиків, які починають займатися карате або регулярно тренуються у секції.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для тренувань з карате — легке, зручне, не сковує рухів',
    'Штани з резинкою та шнурком — дитині легше одягатися самостійно',
    'Усадка після прання: 1–2 см',
    'Всередині куртки є місце для підпису прізвища',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дітей, які починають займатися карате або шукають зручне кімоно для регулярних тренувань у секції.',
  care: CARE_BASE,
};

// ─── BUDOGI KARATE 240 г/м² — діти дівчатка (ID 1561) ───────────────────────
const BUDOGI_KARATE_240_GIRLS: ProductOverride = {
  shortDesc:
    'BUDOGI — дитяче кімоно для карате щільністю 240 г/м². Модель підходить для дівчаток, які починають займатися карате або регулярно тренуються у секції.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для тренувань з карате — легке, зручне, не сковує рухів',
    'Штани з резинкою та шнурком — дитині легше одягатися самостійно',
    'Усадка після прання: 1–2 см',
    'Всередині куртки є місце для підпису прізвища',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дітей, які починають займатися карате або шукають зручне кімоно для регулярних тренувань у секції.',
  care: CARE_BASE,
};

// ─── BUDOGI KARATE 240 г/м² — дорослі чоловіки (ID 1567) ────────────────────
const BUDOGI_KARATE_240_MEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для карате щільністю 240 г/м². Модель підходить для підлітків і дорослих, які займаються карате та хочуть зручне кімоно для регулярних тренувань.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для регулярних тренувань з карате',
    'Легкий матеріал забезпечує свободу рухів',
    'Штани з резинкою та шнурком',
    'Усадка після прання: 1–2 см',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для підлітків і дорослих, які займаються карате та шукають зручне і надійне кімоно для регулярних тренувань.',
  care: CARE_BASE,
};

// ─── BUDOGI KARATE 240 г/м² — дорослі жінки (ID 1571) ───────────────────────
const BUDOGI_KARATE_240_WOMEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для карате щільністю 240 г/м². Модель підходить для дівчат і жінок, які займаються карате та хочуть зручне кімоно для регулярних тренувань.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для регулярних тренувань з карате',
    'Легкий матеріал забезпечує свободу рухів',
    'Штани з резинкою та шнурком',
    'Усадка після прання: 1–2 см',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дівчат і жінок, які займаються карате та шукають зручне і надійне кімоно для регулярних тренувань.',
  care: CARE_BASE,
};

// ─── Kintayo KARATE — діти (ID 261) ──────────────────────────────────────────
const KINTAYO_KARATE_KIDS: ProductOverride = {
  shortDesc:
    'KINTAYO — дитяче кімоно для карате щільністю 240 г/м². Модель підходить для дітей, які починають займатися карате або регулярно тренуються у секції.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для тренувань з карате — легке, зручне, не сковує рухів',
    'Штани з резинкою та шнурком — дитині легше одягатися самостійно',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі товару',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для дітей, які починають займатися карате або шукають зручне кімоно для регулярних занять у секції.',
  care: CARE_BASE,
};

// ─── Kintayo KARATE — дорослі (ID 261_adult) ─────────────────────────────────
const KINTAYO_KARATE_ADULT: ProductOverride = {
  shortDesc:
    'KINTAYO — кімоно для карате щільністю 240 г/м². Модель підходить для підлітків і дорослих, які займаються карате та хочуть зручне кімоно для регулярних тренувань.',
  features: [
    'Щільність тканини: 240 г/м²',
    'Підходить для регулярних тренувань з карате',
    'Легкий матеріал забезпечує свободу рухів',
    'Штани з резинкою та шнурком',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі товару',
  ],
  kit: ['Куртка', 'Штани', 'Білий пояс'],
  kitFixed: true,
  audience:
    'Для підлітків і дорослих, які займаються карате та шукають зручне кімоно для регулярних тренувань у секції.',
  care: CARE_BASE,
};

// ═══════════════════════════════════════════════════════════════════════════════
// BJJ / ДЖ­ИУ-ДЖИТСУ
// ═══════════════════════════════════════════════════════════════════════════════

// ─── BUDOGI BJJ 350 г/м² — діти хлопчики (ID 1500) ──────────────────────────
const BUDOGI_BJJ_350_BOYS: ProductOverride = {
  shortDesc:
    'BUDOGI — дитяче кімоно для джиу-джитсу / BJJ щільністю 350 г/м². Модель підходить для хлопчиків, які починають займатися джиу-джитсу або вже тренуються регулярно.',
  features: [
    'Щільність тканини: 350 г/м² — оптимальний баланс міцності та легкості',
    'Куртка з тканини Pearl Weave, штани з Ripstop — стійкі до розривів',
    'Посилення в грудній, плечовій, пахвовій і колінній зонах',
    'Штани з гумкою та шнурком — дитині легше одягатися самостійно',
    'Гарантія BUDOGI — 3 місяці з дотриманням рекомендацій з догляду',
    'Усадка після прання: 2–3 см',
    'Доступні кольори: білий, синій, червоний, чорний',
  ],
  kit: ['Куртка', 'Штани', 'Пояс', 'Рюкзак-мішок у подарунок'],
  kitFixed: true,
  audience:
    'Для хлопчиків, які починають займатися джиу-джитсу або хочуть зручне кімоно для регулярних тренувань і перших спарингів.',
  care: CARE_BASE,
};

// ─── BUDOGI BJJ 350 г/м² — діти дівчатка (ID 1520) ──────────────────────────
const BUDOGI_BJJ_350_GIRLS: ProductOverride = {
  shortDesc:
    'BUDOGI — дитяче кімоно для джиу-джитсу / BJJ щільністю 350 г/м². Модель підходить для дівчаток, які починають займатися джиу-джитсу або вже тренуються регулярно.',
  features: [
    'Щільність тканини: 350 г/м² — оптимальний баланс міцності та легкості',
    'Куртка з тканини Pearl Weave, штани з Ripstop — стійкі до розривів',
    'Посилення в грудній, плечовій, пахвовій і колінній зонах',
    'Штани з гумкою та шнурком — дитині легше одягатися самостійно',
    'Гарантія BUDOGI — 3 місяці з дотриманням рекомендацій з догляду',
    'Усадка після прання: 2–3 см',
    'Доступні кольори: білий, синій, червоний, чорний',
  ],
  kit: ['Куртка', 'Штани', 'Пояс', 'Рюкзак-мішок у подарунок'],
  kitFixed: true,
  audience:
    'Для дівчаток, які починають займатися джиу-джитсу або хочуть зручне кімоно для регулярних тренувань і перших спарингів.',
  care: CARE_BASE,
};

// ─── BUDOGI BJJ 450 г/м² — дорослі чоловіки (ID 1524) ───────────────────────
const BUDOGI_BJJ_450_MEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для джиу-джитсу / BJJ щільністю 450 г/м². Модель підходить для підлітків і дорослих чоловіків, які займаються BJJ та шукають міцне кімоно для тренувань і спарингів.',
  features: [
    'Щільність тканини: 450 г/м² — підвищена міцність для інтенсивних тренувань',
    'Куртка з тканини Pearl Weave, штани з Ripstop — витримують регулярні спаринги',
    'Посилення в грудній, плечовій, пахвовій і колінній зонах',
    'Зручна посадка — свобода рухів під час відпрацювання техніки',
    'Гарантія BUDOGI — 3 місяці з дотриманням рекомендацій з догляду',
    'Усадка після прання: 2–3 см',
    'Доступні кольори: білий, синій, червоний, чорний',
  ],
  kit: ['Куртка', 'Штани', 'Пояс', 'Рюкзак-мішок у подарунок'],
  kitFixed: true,
  audience:
    'Для підлітків і дорослих чоловіків, які займаються BJJ та хочуть міцне кімоно для тренувань, спарингів і відпрацювання техніки.',
  care: CARE_BASE,
};

// ─── BUDOGI BJJ 450 г/м² — дорослі жінки (ID 1540) ──────────────────────────
const BUDOGI_BJJ_450_WOMEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для джиу-джитсу / BJJ щільністю 450 г/м². Модель підходить для підлітків і дорослих жінок, які займаються BJJ та шукають міцне кімоно для тренувань і спарингів.',
  features: [
    'Щільність тканини: 450 г/м² — підвищена міцність для інтенсивних тренувань',
    'Куртка з тканини Pearl Weave, штани з Ripstop — витримують регулярні спаринги',
    'Посилення в грудній, плечовій, пахвовій і колінній зонах',
    'Зручна посадка — свобода рухів під час відпрацювання техніки',
    'Гарантія BUDOGI — 3 місяці з дотриманням рекомендацій з догляду',
    'Усадка після прання: 2–3 см',
    'Доступні кольори: білий, синій, червоний, чорний',
  ],
  kit: ['Куртка', 'Штани', 'Пояс', 'Рюкзак-мішок у подарунок'],
  kitFixed: true,
  audience:
    'Для підлітків і дорослих жінок, які займаються BJJ та хочуть міцне кімоно для тренувань, спарингів і відпрацювання техніки.',
  care: CARE_BASE,
};

// ─── KINTAYO BJJ 350 г/м² — діти (ID 244) ────────────────────────────────────
const KINTAYO_BJJ_350_KIDS: ProductOverride = {
  shortDesc:
    'KINTAYO — дитяче кімоно для джиу-джитсу / BJJ щільністю 350 г/м². Модель підходить для дітей, які починають займатися джиу-джитсу або вже тренуються регулярно.',
  features: [
    'Щільність тканини: 350 г/м² — легке і міцне для дитячих тренувань',
    'Куртка з тканини Pearl Weave, штани з Ripstop — не сковують рухів',
    'Посилення в грудній, пахвовій і колінній зонах',
    'Штани з гумкою та шнурком — зручно одягати самостійно',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі',
    'Усадка після прання: 1–2 см',
  ],
  kit: ['Куртка', 'Штани', 'Пояс'],
  kitFixed: true,
  audience:
    'Для дітей, які починають займатися джиу-джитсу або шукають зручне кімоно для регулярних тренувань і перших спарингів.',
  care: CARE_BASE,
};

// ─── KINTAYO BJJ 450 г/м² — дорослі (ID 181) ─────────────────────────────────
const KINTAYO_BJJ_450_ADULT: ProductOverride = {
  shortDesc:
    'KINTAYO — кімоно для джиу-джитсу / BJJ щільністю 450 г/м². Модель підходить для підлітків і дорослих, які займаються BJJ та шукають міцне кімоно для тренувань і спарингів.',
  features: [
    'Щільність тканини: 450 г/м² — підвищена міцність для регулярних спарингів',
    'Куртка з тканини Pearl Weave, штани з Ripstop — стійкі до навантажень',
    'Посилення в грудній, пахвовій і колінній зонах',
    'Зручна посадка — свобода рухів під час відпрацювання техніки',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі',
    'Усадка після прання: 1–2 см',
  ],
  kit: ['Куртка', 'Штани', 'Пояс'],
  kitFixed: true,
  audience:
    'Для підлітків і дорослих, які займаються BJJ та хочуть міцне кімоно для тренувань, спарингів і відпрацювання техніки.',
  care: CARE_BASE,
};

// ═══════════════════════════════════════════════════════════════════════════════
// GRAPPLING
// ═══════════════════════════════════════════════════════════════════════════════

// ─── BUDOGI GRAPPLING 350 г/м² — діти хлопчики (ID 1583) ────────────────────
const BUDOGI_GRAPPLING_350_BOYS: ProductOverride = {
  shortDesc:
    'BUDOGI — дитяче кімоно для грепплінгу щільністю 350 г/м² для хлопчиків. Підходить для тренувань у секції та регулярних занять борцівськими дисциплінами.',
  features: [
    'Щільність тканини: 350 г/м²',
    'Підходить для тренувань з грепплінгу, сабмішн-рестлінгу та суміжних дисциплін',
    'Куртка та штани з міцної тканини — витримують регулярні навантаження',
    'Штани з резинкою та шнурком — зручно одягати самостійно',
    'Усадка після прання: 2–3 см',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для хлопчиків, які займаються грепплінгом або суміжними борцівськими дисциплінами та шукають зручне кімоно для тренувань.',
  care: CARE_BASE,
};

// ─── BUDOGI GRAPPLING 350 г/м² — діти дівчатка (ID 1587) ────────────────────
const BUDOGI_GRAPPLING_350_GIRLS: ProductOverride = {
  shortDesc:
    'BUDOGI — дитяче кімоно для грепплінгу щільністю 350 г/м² для дівчаток. Підходить для тренувань у секції та регулярних занять борцівськими дисциплінами.',
  features: [
    'Щільність тканини: 350 г/м²',
    'Підходить для тренувань з грепплінгу, сабмішн-рестлінгу та суміжних дисциплін',
    'Куртка та штани з міцної тканини — витримують регулярні навантаження',
    'Штани з резинкою та шнурком — зручно одягати самостійно',
    'Усадка після прання: 2–3 см',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для дівчаток, які займаються грепплінгом або суміжними борцівськими дисциплінами та шукають зручне кімоно для тренувань.',
  care: CARE_BASE,
};

// ─── BUDOGI GRAPPLING 450 г/м² — дорослі чоловіки (ID 1599) ─────────────────
const BUDOGI_GRAPPLING_450_MEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для грепплінгу щільністю 450 г/м² для чоловіків. Підходить для підлітків і дорослих спортсменів, які тренуються з грепплінгу та суміжних борцівських дисциплін.',
  features: [
    'Щільність тканини: 450 г/м² — підвищена міцність для інтенсивних тренувань',
    'Підходить для тренувань з грепплінгу, сабмішн-рестлінгу та суміжних дисциплін',
    'Куртка та штани з міцної тканини — витримують регулярні спаринги',
    'Зручна посадка — свобода рухів під час відпрацювання техніки',
    'Усадка після прання: 2–3 см',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для підлітків і дорослих чоловіків, які займаються грепплінгом або суміжними борцівськими дисциплінами та шукають міцне кімоно для тренувань.',
  care: CARE_BASE,
};

// ─── BUDOGI GRAPPLING 450 г/м² — дорослі жінки (ID 1603) ────────────────────
const BUDOGI_GRAPPLING_450_WOMEN: ProductOverride = {
  shortDesc:
    'BUDOGI — кімоно для грепплінгу щільністю 450 г/м² для жінок. Підходить для підлітків і дорослих спортсменок, які тренуються з грепплінгу та суміжних борцівських дисциплін.',
  features: [
    'Щільність тканини: 450 г/м² — підвищена міцність для інтенсивних тренувань',
    'Підходить для тренувань з грепплінгу, сабмішн-рестлінгу та суміжних дисциплін',
    'Куртка та штани з міцної тканини — витримують регулярні спаринги',
    'Зручна посадка — свобода рухів під час відпрацювання техніки',
    'Усадка після прання: 2–3 см',
    'Гарантія BUDOGI — 3 місяці за умови дотримання рекомендацій з догляду',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для підлітків і дорослих жінок, які займаються грепплінгом або суміжними борцівськими дисциплінами та шукають міцне кімоно для тренувань.',
  care: CARE_BASE,
};

// ─── KINTAYO GRAPPLING 350 г/м² — діти (ID 1401) ─────────────────────────────
const KINTAYO_GRAPPLING_350_KIDS: ProductOverride = {
  shortDesc:
    'KINTAYO — дитяче кімоно для грепплінгу щільністю 350 г/м². Підходить для дітей і підлітків, які починають займатися грепплінгом або вже тренуються регулярно.',
  features: [
    'Щільність тканини: 350 г/м²',
    'Підходить для тренувань з грепплінгу та суміжних борцівських дисциплін',
    'Куртка та штани з міцної тканини — зручні для активних рухів',
    'Штани з резинкою та шнурком — легко одягати самостійно',
    'Усадка після прання: 1–2 см',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для дітей і підлітків, які займаються грепплінгом або суміжними борцівськими дисциплінами та шукають зручне кімоно для тренувань.',
  care: CARE_BASE,
};

// ─── KINTAYO GRAPPLING 450 г/м² — дорослі (ID 1405) ──────────────────────────
const KINTAYO_GRAPPLING_450_ADULT: ProductOverride = {
  shortDesc:
    'KINTAYO — кімоно для грепплінгу щільністю 450 г/м² для підлітків і дорослих. Підходить для регулярних тренувань і спарингів з грепплінгу та суміжних борцівських дисциплін.',
  features: [
    'Щільність тканини: 450 г/м² — підвищена міцність для інтенсивних тренувань',
    'Підходить для тренувань з грепплінгу, сабмішн-рестлінгу та суміжних дисциплін',
    'Куртка та штани з міцної тканини — стійкі до регулярних навантажень',
    'Зручна посадка — свобода рухів під час відпрацювання техніки',
    'Усадка після прання: 1–2 см',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для підлітків і дорослих, які займаються грепплінгом або суміжними борцівськими дисциплінами та шукають міцне кімоно для тренувань і спарингів.',
  care: CARE_BASE,
};

// ═══════════════════════════════════════════════════════════════════════════════
// САМБО
// ═══════════════════════════════════════════════════════════════════════════════

// ─── KINTAYO САМБОВКА 550 г/м² (ID 1040) ─────────────────────────────────────
const KINTAYO_SAMBO_UNIFORM: ProductOverride = {
  shortDesc:
    'KINTAYO — самбовка щільністю 550 г/м² для дітей, підлітків і дорослих. Погоджена федерацією самбо України — підходить для тренувань і чемпіонатів.',
  features: [
    'Щільність тканини «ялинка»: 550 г/м² — для тренувань і змагань',
    'Матеріал: 90% бавовна, 10% поліестер — стійкий колір, не линяє',
    'Посилені пахвові зони та нижня частина куртки з бічними розрізами',
    'Зручні шорти з еластичною резинкою та шнурком',
    'Форма погоджена федерацією самбо України',
    'Усадка після прання: 2–3 см',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі',
  ],
  kit: ['Куртка', 'Шорти', 'Пояс'],
  kitFixed: true,
  audience:
    'Для дітей, підлітків і дорослих спортсменів, які займаються самбо та шукають якісну форму для тренувань або змагань.',
  care: [
    'Прати при 30°C',
    'Рекомендований віджим: 400–600 об/хв',
    'Не відбілювати',
    'Сушити природним способом',
  ],
};

// ─── KINTAYO САМБЕТКИ (ID 1066) ───────────────────────────────────────────────
const KINTAYO_SAMBO_SHOES: ProductOverride = {
  shortDesc:
    'KINTAYO — самбетки для тренувань і змагань. Підходять для дітей, підлітків і дорослих, які займаються самбо.',
  features: [
    'Спеціальне взуття для самбо — правильна фіксація стопи під час сутички',
    'Нековзна підошва — безпечна робота на татамі',
    'Зручна шнурівка — щільно фіксується на нозі',
    'Легка конструкція — не сковує рухів',
    'Підходить для тренувань і змагань',
    'Гарантія KINTAYO — 3 місяці з моменту купівлі',
  ],
  kit: ['Пара самбеток'],
  kitFixed: true,
  audience:
    'Для дітей, підлітків і дорослих спортсменів, які займаються самбо та шукають надійне взуття для тренувань або змагань.',
  care: [
    'Чистити вологою тканиною',
    'Не замочувати',
    'Сушити природним способом, не біля батареї',
  ],
};
