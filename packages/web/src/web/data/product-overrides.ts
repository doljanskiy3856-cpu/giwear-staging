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
  /** specs — optional key/value pairs for bags/trainers, rendered as a compact list */
  specs?: Record<string, string>;
  /** usage — what the trainer is used for (trainers only) */
  usage?: string[];
  /** whoFor — who the product is best suited for (trainers only) */
  whoFor?: string;
  /** care2 — safe use / care note displayed at the bottom (trainers only) */
  care2?: string;
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

// ─── BELT matchers ───────────────────────────────────────────────────────────

function isKintayoJudoBelt(brand: string, sport: string, type: string): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'judo' && type === 'belts';
}
// WAZARI belt entry — product id ends with '_adult' (e.g. 238_adult)
function isKintayoWazariJudoBelt(brand: string, sport: string, type: string, productId: string): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'judo' && type === 'belts' && productId.endsWith('_adult');
}
function isKintayoBjjBelt(brand: string, sport: string, type: string): boolean {
  return brand.toLowerCase() === 'kintayo' && sport === 'bjj' && type === 'belts';
}
function isKintayoGrapplingBelt(brand: string, sport: string, type: string): boolean {
  return brand.toLowerCase() === 'kintayo' && (sport === 'grappling') && type === 'belts';
}
function isBudogiBegJudoBelt(brand: string, name: string, sport: string, type: string): boolean {
  return brand === 'BUDOGI' && sport === 'judo' && type === 'belts' && name.toUpperCase().includes('BEGINNER');
}
function isBudogiProJudoBelt(brand: string, name: string, sport: string, type: string): boolean {
  return brand === 'BUDOGI' && sport === 'judo' && type === 'belts' && name.toUpperCase().includes('PRO');
}
function isIpponClub2Belt(brand: string, name: string, sport: string, type: string): boolean {
  return (brand === 'IPPON GEAR' || brand === 'IPPONGEAR') && sport === 'judo' && type === 'belts'
    && name.toUpperCase().includes('CLUB');
}
function isIpponElite2Belt(brand: string, name: string, sport: string, type: string): boolean {
  return (brand === 'IPPON GEAR' || brand === 'IPPONGEAR') && sport === 'judo' && type === 'belts'
    && name.toUpperCase().includes('ELITE');
}
function isIpponIjf2Belt(brand: string, name: string, sport: string, type: string): boolean {
  return (brand === 'IPPON GEAR' || brand === 'IPPONGEAR') && sport === 'judo' && type === 'belts'
    && name.toUpperCase().includes('IJF');
}

export function getProductOverride(
  brand: string,
  name: string,
  sportSlug: string,
  productType: string,
  density?: string,
  isChildren?: boolean,
  productId?: string,
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

  // ── ТРЕНАЖЕРИ ─────────────────────────────────────────────────────────────
  if (productType === 'trainers') {
    const n = name.toLowerCase();
    const b = brand.toLowerCase();
    // IPPON GEAR Uchi Komi 2 — must come BEFORE generic IPPON/grip check
    if (/jita23|uchi.*komi.*2|uchi.*kom.*2|uchi\s*komi\s*2/i.test(n) || (/ippon/i.test(b) && /uchi.*2/i.test(n)))
      return IPPON_GEAR_UCHI_KOMI_2;
    // IPPON GEAR Grip Trainer
    if (/jita20|grip.*train|train.*grip/i.test(n) || (/ippon/i.test(b) && /grip/i.test(n)) || (/ippon/i.test(b) && /захват/i.test(n)))
      return IPPON_GEAR_GRIP_TRAINER;
    // remaining IPPON GEAR uchi-komi (without "2") — catch by brand+uchi combo
    if (/ippon/i.test(b) && /uchi/i.test(n))
      return IPPON_GEAR_UCHI_KOMI_2;
    // KINTAYO trainers
    if (/комір.рукав|collar.sleeve|collar.*sleeve/i.test(n))
      return KINTAYO_COLLAR_SLEEVE;
    if (/канат.рукав|rope.*sleeve|sleeve.*rope/i.test(n)) {
      // 3m/5m versions
      if (/3м|5м|3m|5m|\b[35]\s*м/i.test(n)) return KINTAYO_ROPE_SLEEVE_LONG;
      return KINTAYO_ROPE_SLEEVE;
    }
    if (/захват/i.test(n) && /kintayo/i.test(b || n)) return KINTAYO_GRIP_PADS;
    if (/uchi.kom|учі.ком/i.test(n)) return KINTAYO_UCHI_KOMI;
  }

  // ── СУМКИ / РЮКЗАКИ / ВАЛІЗИ ─────────────────────────────────────────────
  if (productType === 'bags') {
    const n = name.toLowerCase();
    if (/валіз|travell|wheel/i.test(n))                          return IPPON_GEAR_SUITCASE;
    if (/fighter.*2.*в.*1|2.*в.*1.*fighter|fighter.*сумк|сумк.*fighter/i.test(n)) return IPPON_GEAR_FIGHTER2_BAG;
    if (/essential\s*m\b|essential.*\bm\b/i.test(n))             return IPPON_GEAR_ESSENTIAL_M;
    if (/kintayo|мішок/i.test(n) || /kintayo/i.test(brand))      return KINTAYO_JUDO_SACK;
    if (/fighter.*рюкзак|рюкзак.*fighter|fighter.*backpack|backpack.*fighter|JI031/i.test(n)) return IPPON_GEAR_FIGHTER2_BACKPACK;
    if (/рюкзак|backpack|essentials/i.test(n))                   return IPPON_GEAR_ESSENTIALS_BACKPACK;
    if (/сумк|bag/i.test(n))                                     return IPPON_GEAR_BAG;
  }

  // ── ПОЯСИ ────────────────────────────────────────────────────────────────
  // More specific matchers first (IPPON by series, BUDOGI by series)
  if (isIpponIjf2Belt(brand, name, sportSlug, productType))   return IPPON_GEAR_IJF2_BELT;
  if (isIpponElite2Belt(brand, name, sportSlug, productType)) return IPPON_GEAR_ELITE2_BELT;
  if (isIpponClub2Belt(brand, name, sportSlug, productType))  return IPPON_GEAR_CLUB2_BELT;
  if (isBudogiProJudoBelt(brand, name, sportSlug, productType))  return BUDOGI_PRO_JUDO_BELT;
  if (isBudogiBegJudoBelt(brand, name, sportSlug, productType))  return BUDOGI_BEGINNER_JUDO_BELT;
  if (isKintayoGrapplingBelt(brand, sportSlug, productType))  return KINTAYO_GRAPPLING_BELT;
  if (isKintayoBjjBelt(brand, sportSlug, productType))        return KINTAYO_BJJ_BELT;
  // WAZARI check before generic YUKO — matches only 238_adult (id ends with _adult)
  if (isKintayoWazariJudoBelt(brand, sportSlug, productType, productId ?? '')) return KINTAYO_WAZARI_JUDO_BELT;
  if (isKintayoJudoBelt(brand, sportSlug, productType))       return KINTAYO_JUDO_BELT;

  // ── КЕПКИ KINTAYO ────────────────────────────────────────────────────────
  if (productId === '1756') return KINTAYO_CAP_BASEBALL;
  if (productId === '1759') return KINTAYO_CAP_SNAPBACK;

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
    'Slim Fit — приталений крій із більш щільною посадкою по тілу',
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
    'Slim Fit — приталений крій із більш щільною посадкою по тілу',
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

// ─── BELT overrides ───────────────────────────────────────────────────────────

const BELT_CARE = [
  'Пояс краще не прати без потреби — він має пройти свій шлях разом зі спортсменом 😊',
];

// ── KINTAYO JUDO BELT (серія YUKO, id 238 / 238_adult) ─────────────────────
// ── KINTAYO WAZARI JUDO BELT (id 238_adult) ─────────────────────────────────
const KINTAYO_WAZARI_JUDO_BELT: ProductOverride = {
  shortDesc:
    'Пояс для дзюдо серії WAZARI від KINTAYO — для спортсменів з досвідом. Ширина 4,5 см, посилений 9 рядками прошивки. Кольори відповідають просунутому рівню підготовки. Не поспішайте прати пояс — у нього теж є своя історія тренувань 😉',
  features: [
    'Серія WAZARI — пояси для досвідчених спортсменів з дзюдо',
    'Матеріал: 70% бавовна, 30% поліестер',
    'Ширина 4,5 см, посилений 9 рядками прошивки',
    'Щільна тканина — тримає форму після зав\'язування',
    'Доступні кольори: зелений, синій, коричневий',
    'Розміри 160–190 см — для підлітків і дорослих',
    'Гарантія KINTAYO: 3 місяці з моменту купівлі',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Для спортсменів із досвідом, які займаються дзюдо. Колір пояса обирайте відповідно до вашого рівня підготовки та правил школи або тренера.',
  care: BELT_CARE,
};

// ── KINTAYO YUKO JUDO BELT (id 238) ─────────────────────────────────────────
const KINTAYO_JUDO_BELT: ProductOverride = {
  shortDesc:
    'Пояс для дзюдо серії YUKO від KINTAYO — базовий елемент екіпірування для тренувань і занять у секції. Підходить для початківців і спортсменів, які тільки починають опановувати техніку дзюдо. Прати пояс не рекомендуємо — це той рідкісний випадок, коли трохи спортивної історії нормально 😉',
  features: [
    'Серія YUKO — пояси для початківців дзюдо',
    'Матеріал: 70% бавовна, 30% поліестер',
    'Ширина 4 см, посилений 7 рядками прошивки',
    'Довжина підбирається під зріст спортсмена',
    'Рівномірна структура — зберігає форму після зав\'язування',
    'Гарантія KINTAYO: 3 місяці з моменту купівлі',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Підходить для дітей і дорослих початківців, які займаються дзюдо. Колір пояса обирайте відповідно до вашого рівня підготовки та правил школи або тренера.',
  care: BELT_CARE,
};

// ── KINTAYO BJJ BELT (id 291) ────────────────────────────────────────────────
const KINTAYO_BJJ_BELT: ProductOverride = {
  shortDesc:
    'Пояс для джиу-джитсу від KINTAYO — доповнює комплект для тренувань у залі та регулярних занять з BJJ. Широкий вибір кольорів відповідає прогресії рівнів IBJJF. Пояс краще не прати без потреби — колір, форма і бойовий настрій скажуть вам дякую 😉',
  features: [
    'Матеріал: 70% бавовна, 30% поліестер',
    'Ширина 4 см, посилений 7 рядками прошивки',
    'Щільна тканина — тримає форму та не розтягується',
    'Широка палітра кольорів: білий, синій, фіолетовий, коричневий, чорний та перехідні',
    'Довжина підбирається під зріст і спосіб зав\'язування',
    'Гарантія KINTAYO: 3 місяці з моменту купівлі',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Для спортсменів, які займаються BJJ (бразильське джиу-джитсу). Колір пояса відповідає вашому рівню підготовки згідно зі шкалою прогресії вашої школи або федерації.',
  care: BELT_CARE,
};

// ── KINTAYO GRAPPLING BELT (id 1647) ────────────────────────────────────────
const KINTAYO_GRAPPLING_BELT: ProductOverride = {
  shortDesc:
    'Пояс для грепплінгу від KINTAYO — підходить для регулярних тренувань і занять у залі. Завершує комплект для грепплінгу та підкреслює рівень спортсмена. Після тренування достатньо просушити — пояс сам знає, скільки він пройшов 😉',
  features: [
    'Матеріал: 70% бавовна, 30% поліестер',
    'Ширина 4 см, посилений прошивкою',
    'Міцна тканина — не деформується від частих тренувань',
    'Широка кольорова палітра під стиль і рівень',
    'Довжина підбирається під зріст і спосіб зав\'язування',
    'Гарантія KINTAYO: 3 місяці з моменту купівлі',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Для дітей і дорослих спортсменів, які займаються грепплінгом. Колір обирайте відповідно до вашого рівня і правил секції.',
  care: BELT_CARE,
};

// ── BUDOGI BEGINNER JUDO BELT (id 1612) ─────────────────────────────────────
const BUDOGI_BEGINNER_JUDO_BELT: ProductOverride = {
  shortDesc:
    'Пояс для дзюдо серії BEGINNER від BUDOGI — оптимальний вибір для перших тренувань і занять у секції. Виготовлений з 100% бавовни преміальної якості. Прати пояс не рекомендуємо — він має пройти свій шлях разом зі спортсменом 😉',
  features: [
    'Серія BEGINNER — для початківців дзюдо',
    'Матеріал: 100% бавовна, PREMIUM якість',
    'Ширина 4 см, 8 рядків прошивки',
    'Товщина 3 мм — щільний і стійкий до зносу',
    'Підходить для клубних тренувань і атестацій',
    'Гарантія BUDOGI: 3 місяці з моменту придбання',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Для початківців і дітей, які займаються дзюдо. Колір пояса обирайте згідно з вимогами вашої школи або тренера.',
  care: BELT_CARE,
};

// ── BUDOGI PRO JUDO BELT (id 1627) ──────────────────────────────────────────
const BUDOGI_PRO_JUDO_BELT: ProductOverride = {
  shortDesc:
    'Пояс для дзюдо серії PRO від BUDOGI — для спортсменів із досвідом, які шукають щільніший і надійніший пояс для регулярних тренувань і змагань. Не поспішайте прати пояс: він зберігає не тільки форму, а й історію тренувань 😉',
  features: [
    'Серія PRO — для досвідчених спортсменів',
    'Матеріал: 100% бавовна, PREMIUM якість',
    'Ширина 4,5 см, 8 рядків прошивки',
    'Товщина 5 мм — підвищена щільність для стійкої фіксації',
    'Зберігає форму під час інтенсивних тренувань',
    'Гарантія BUDOGI: 3 місяці з моменту придбання',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Для спортсменів із досвідом, які займаються дзюдо і потребують більш щільного пояса для тренувань і виступів на змаганнях.',
  care: BELT_CARE,
};

// ── IPPON GEAR CLUB 2 BELT (id 28) ──────────────────────────────────────────
const IPPON_GEAR_CLUB2_BELT: ProductOverride = {
  shortDesc:
    'Пояс для дзюдо серії CLUB 2 від IPPON GEAR — надійний вибір для клубних тренувань і регулярних занять у залі. Підходить для спортсменів різного рівня. Пояс краще не прати без потреби — після тренування достатньо просушити та зберігати в сухому місці 😉',
  features: [
    'Серія CLUB 2 — для клубних тренувань з дзюдо',
    'Матеріал: 48% бавовна, 52% поліестер',
    'Щільність: 220 г/м²',
    'Доступний у кольорах жовтий та помаранчевий',
    'Широкий діапазон довжин: 220–300 см',
    'Гарантія IPPON GEAR: 3 місяці з моменту придбання',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Для спортсменів, які займаються дзюдо в клубі або секції. Колір пояса підбирайте відповідно до вашого рівня підготовки та вимог школи.',
  care: BELT_CARE,
};

// ── IPPON GEAR ELITE 2 BELT (id 1362) ───────────────────────────────────────
const IPPON_GEAR_ELITE2_BELT: ProductOverride = {
  shortDesc:
    'Пояс для дзюдо серії ELITE 2 від IPPON GEAR — для кадетів і дорослих спортсменів, які беруть участь у змаганнях. Висока якість виготовлення, 9 рядків прошивки. Прати пояс не рекомендуємо — він зберігає не тільки форму, а й бойовий настрій 😉',
  features: [
    'Серія ELITE 2 — для змагань кадетів і дорослих',
    'Матеріал: 48% бавовна, 52% поліестер',
    'Щільність: 220 г/м²',
    '9 рядків прошивки — підвищена міцність',
    'Нашивка з логотипом IPPON GEAR',
    'Широкий діапазон довжин: 240–320 см',
    'Гарантія IPPON GEAR: 3 місяці з моменту придбання',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Для кадетів і дорослих дзюдоїстів, які готуються до змагань або шукають пояс підвищеної міцності для інтенсивних тренувань.',
  care: BELT_CARE,
};

// ── IPPON GEAR IJF 2 BELT (id 1356) ─────────────────────────────────────────
const IPPON_GEAR_IJF2_BELT: ProductOverride = {
  shortDesc:
    'Пояс для дзюдо серії IJF 2 від IPPON GEAR — схвалений IJF, дозволений до використання на всіх міжнародних змаганнях з дзюдо. Для спортсменів найвищого рівня. Пояс краще не прати без потреби — колір і форма скажуть вам дякую 😉',
  features: [
    'Сертифікований IJF — дозволений на міжнародних змаганнях',
    'Матеріал: 48% бавовна, 52% поліестер',
    'Щільність: 220 г/м²',
    'Ширина 4,5 см, 13 рядків прошивки',
    'Нашивка з логотипом IPPON GEAR',
    'Широкий діапазон довжин: 260–340 см',
    'Гарантія IPPON GEAR: 3 місяці з моменту придбання',
  ],
  kit: ['Пояс'],
  kitFixed: true,
  audience:
    'Для дорослих дзюдоїстів, які виступають на змаганнях під егідою IJF або потребують сертифікованої екіпірування. Підходить для клубів і тренерів, які комплектують спортсменів за міжнародними стандартами.',
  care: BELT_CARE,
};

// ─── СУМКИ / РЮКЗАКИ / ВАЛІЗИ ────────────────────────────────────────────────

// ── IPPON GEAR SUITCASE (Traveller Wheel XL, id 114) ─────────────────────────
const IPPON_GEAR_SUITCASE: ProductOverride = {
  shortDesc:
    'Велика валіза на колесах IPPON GEAR Traveller Wheel XL — ідеальний вибір для виїзних змагань, зборів і тривалих поїздок. Об\'єм ~120 л: легко вміщує кімоно, захист, взуття та особисті речі. Посилені колеса й телескопічна ручка роблять переміщення комфортним навіть з повним завантаженням.',
  features: [
    'Об\'єм ~120 л — достатньо для повного комплекту змагального екіпірування',
    'Посилені колеса та телескопічна ручка для зручного переміщення в аеропортах і вокзалах',
    '2 зовнішніх кишені + велике внутрішнє відділення з 3 внутрішніми кишенями',
    'Поперечний ремінь і сітчастий мішок для фіксації вмісту',
    'Матеріал: 100% поліестер із водовідштовхувальним ПУ-покриттям',
    'М\'які бокові ручки для перенесення без колес',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для спортсменів, які регулярно виїжджають на змагання або тренувальні збори та потребують великого надійного багажу.',
  care: [],
  specs: {
    'Розміри': '72 × 40 × 40 см',
    "Об'єм": '~120 л',
    'Матеріал': '100% поліестер, водовідштовхувальне ПУ-покриття',
    'Колеса': 'Посилені, знімні',
    'Ручка': 'Телескопічна + м\'які бокові',
    'Відділення': '2 зовнішніх + 1 велике внутрішнє + 3 менших',
    'Країна': 'Китай',
  },
};

// ── IPPON GEAR FIGHTER 2 BACKPACK (id 109) ───────────────────────────────────
const IPPON_GEAR_FIGHTER2_BACKPACK: ProductOverride = {
  shortDesc:
    'Рюкзак IPPON GEAR Fighter 2 — об\'ємний і функціональний рюкзак для тренувань і змагань. Три відділення (включно з ноутбучним), двостороння блискавка та регульовані лямки з нагрудним і поясним ременем. Водовідштовхувальний матеріал захищає екіпірування від вологи.',
  features: [
    '3 відділення: основне (~28 л), відсік для ноутбука та зовнішня кишеня',
    'Двостороння блискавка для зручного доступу',
    'Регульовані лямки + нагрудний ремінь + поясний ремінь',
    'Матеріал: 100% поліестер із водовідштовхувальним покриттям',
    'Підходить для кімоно, форми, екіпірування та щоденного використання',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для спортсменів, яким потрібен зручний просторий рюкзак для щоденних тренувань і поїздок на змагання.',
  care: [],
  specs: {
    'Розміри': '30 × 22 × 48 см',
    "Об'єм": '~28 л',
    'Матеріал': '100% поліестер, водовідштовхувальний',
    'Відділення': '3 (ноутбук, основне, зовнішнє)',
    'Застібка': '2-стороння блискавка',
    'Ремені': 'Регульовані + нагрудний + поясний',
  },
};

// ── IPPON GEAR ESSENTIALS BACKPACK (id 81) ───────────────────────────────────
const IPPON_GEAR_ESSENTIALS_BACKPACK: ProductOverride = {
  shortDesc:
    'Рюкзак IPPON GEAR Essentials — компактний і практичний варіант для щоденних тренувань. Основне відділення легко вміщує кімоно або форму, є кишеня-органайзер і сітчасті бокові кишені для пляшки. Водовідштовхувальний матеріал і двостороння блискавка.',
  features: [
    'Просторе основне відділення для кімоно або форми',
    'Кишеня-органайзер для дрібного спорядження',
    'Сітчасті бокові кишені для пляшок або аксесуарів',
    'Двостороння блискавка',
    'Матеріал: 100% поліестер, водовідштовхувальний',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для спортсменів, яким потрібен надійний повсякденний рюкзак для ходу в зал.',
  care: [],
  specs: {
    'Розміри': '30 × 13 × 45 см',
    'Матеріал': '100% поліестер, водовідштовхувальний',
    'Відділення': 'Основне + органайзер + 2 бокових сітки',
    'Застібка': '2-стороння блискавка',
  },
};

// ── IPPON GEAR FIGHTER 2 BAG 2-в-1 (id 1082) ─────────────────────────────────
const IPPON_GEAR_FIGHTER2_BAG: ProductOverride = {
  shortDesc:
    'Сумка IPPON GEAR Fighter 2 2в1 — трансформується у рюкзак. Щільна тканина 900D, відсік для вологих речей, ноутбучний відсік і 2 зовнішні кишені на блискавці. Доступна у розмірах M (50 л) і L (65 л) — підходить як для тренувань, так і для виїздів.',
  features: [
    'Функція 2в1: носиться як сумка або як рюкзак — знімний плечовий ремінь + рюкзачні лямки',
    'Відсік для вологих речей (кімоно, взуття після тренування)',
    'Відсік для ноутбука / органайзер',
    '2 зовнішні кишені на блискавці',
    'Щільна тканина 900D поліестер — витримує інтенсивне використання',
    'Розмір M: 60×28×30 см (50 л) / Розмір L: 68×30×32 см (65 л)',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для тих, хто хоче одну сумку й для залу, і для змагань — з можливістю носити на плечі або в руках.',
  care: [],
  specs: {
    'Розмір M': '60 × 28 × 30 см, ~50 л',
    'Розмір L': '68 × 30 × 32 см, ~65 л',
    'Матеріал': '100% поліестер 900D',
    'Функція': '2в1 — сумка + рюкзак',
    'Відділення': 'Вологий відсік + ноутбук/органайзер + 2 кишені',
    'Ремені': 'Знімний плечовий + рюкзачні лямки',
  },
};

// ── IPPON GEAR ESSENTIAL M BAG (id 1358) ─────────────────────────────────────
const IPPON_GEAR_ESSENTIAL_M: ProductOverride = {
  shortDesc:
    'Компактна спортивна сумка IPPON GEAR Essential M (35 л) для щоденних тренувань. Є бічний відсік для вологих речей, внутрішня кишеня та регульований плечовий ремінь. Зручний мінімалістичний формат для тих, кому не потрібен великий рюкзак.',
  features: [
    'Об\'єм 35 л — вміщає кімоно, змінний одяг та аксесуари',
    'Бічний відсік для вологого взуття або мокрого кімоно',
    'Внутрішня кишеня для дрібних речей',
    'Регульований плечовий ремінь',
    'Матеріал: 100% поліестер',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для спортсменів, які шукають компактну і практичну сумку для щоденного ходу в зал.',
  care: [],
  specs: {
    'Розміри': '45 × 28 × 28 см',
    "Об'єм": '35 л',
    'Матеріал': '100% поліестер',
    'Відділення': 'Основне + бічний вологий відсік + внутрішня кишеня',
    'Ремінь': 'Регульований плечовий',
  },
};

// ── KINTAYO JUDO SACK (id 1400) ───────────────────────────────────────────────
const KINTAYO_JUDO_SACK: ProductOverride = {
  shortDesc:
    'Рюкзак-мішок KINTAYO для дзюдо — легкий і простий спосіб носити кімоно в зал. Виготовлений в Україні з тканини Оксфорд, затягується шнурком-стяжкою. Компактний і ненабридливий варіант для тих, кому не потрібно брати з собою багато.',
  features: [
    'Зручна форма мішка — швидко завантажується і легко несеться',
    'Шнурок-стяжка для надійного закриття',
    'Матеріал: Оксфорд поліестер — міцний і легкий',
    'Виробництво: Україна',
  ],
  kit: [],
  kitFixed: false,
  audience:
    'Для дітей і дорослих, яким потрібен простий і легкий варіант для носіння кімоно на тренування.',
  care: [],
  specs: {
    'Розміри': '43 × 33 см',
    'Матеріал': 'Оксфорд поліестер',
    'Тип застібки': 'Шнурок-стяжка',
    'Виробництво': 'Україна',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ТРЕНАЖЕРИ
// ═══════════════════════════════════════════════════════════════════════════

// ── KINTAYO Uchi Komi (учі комі) ─────────────────────────────────────────────
const KINTAYO_UCHI_KOMI: ProductOverride = {
  shortDesc:
    'Тренажер KINTAYO Uchi Komi — спеціалізований снаряд для відпрацювання технік учі-комі у дзюдо та єдиноборствах. Імітує рукав кімоно зі щільної тканини і дозволяє відпрацьовувати входи та захвати без партнера або на різних тренажерах.',
  usage: [
    'Відпрацювання технік учі-комі: повторення входів у кидки без завершення',
    'Тренування сили захвату та пальців на гирях, гантелях або перекладині',
    'Підготовка до змагань — швидке напрацювання рефлекторних захватів',
    'Самостійне тренування або як доповнення до парної роботи',
  ],
  whoFor:
    'Підійде спортсменам з єдиноборств — дзюдоїстам, грепплерам і всім, хто хоче розвинути силу захвату. Цільова група: спортсмени з єдиноборств будь-якого рівня підготовки.',
  features: [
    'Імітує рукав кімоно — реалістичне відчуття захвату під час тренування',
    'Сумісний з різними тренажерами та обладнанням',
    'Щільна джудо-тканина 650 г/м² — міцна та довговічна',
    'Матеріал: 70% бавовна, 30% поліестер',
    'У комплекті: 2 захвати + гумовий еспандер довжиною 2,8 м',
    'Вишивка KINTAYO',
  ],
  specs: {
    'Бренд': 'KINTAYO',
    'Тип': 'Тренажер для учі-комі',
    'Матеріал': '70% бавовна, 30% поліестер',
    'Щільність тканини': '650 г/м²',
    'Колір': 'Синій',
    'Комплект': '2 захвати + гумовий еспандер 2,8 м',
    'Країна виробника': 'Пакистан',
  },
  kit: [],
  kitFixed: false,
  audience: '',
  care: [],
};

// ── KINTAYO Захвати (grip pads) ──────────────────────────────────────────────
const KINTAYO_GRIP_PADS: ProductOverride = {
  shortDesc:
    'Захвати KINTAYO — тренувальний інструмент зі щільної джудо-тканини для розвитку сили пальців і передпліччя. Призначені для використання з гирями, гантелями, блинами або перекладиною — легко інтегруються в будь-яке силове тренування.',
  usage: [
    'Тренування з гирями та гантелями — надягаються через рукоять для ускладнення захвату',
    'Підтягування на перекладині — розвивають силу хвата та передпліч',
    'Станова тяга та інші вправи з блинами штанги',
    'Підготовка сили захвату для дзюдо та єдиноборств',
  ],
  whoFor:
    'Для спортсменів з єдиноборств і силового тренінгу, які хочуть посилити хват і розвинути м\'язи передпліч. Цільова група: спортсмени з єдиноборств будь-якого рівня підготовки.',
  features: [
    'Прочна джудо-тканина щільністю 650 г/м² — тримає форму під навантаженням',
    'Підходять для гирей, гантелей, блинів і перекладини',
    'Простий спосіб ускладнити вже звичні вправи',
    'У комплекті: 2 захвати',
    'Вишивка KINTAYO',
  ],
  specs: {
    'Бренд': 'KINTAYO',
    'Тип': 'Захвати для тренування хвата',
    'Матеріал': '70% бавовна, 30% поліестер',
    'Щільність тканини': '650 г/м²',
    'Колір': 'Синій',
    'Комплект': '2 захвати',
    'Країна виробника': 'Пакистан',
  },
  kit: [],
  kitFixed: false,
  audience: '',
  care: [],
};

// ── KINTAYO Комір-рукав (Collar Sleeve) ──────────────────────────────────────
const KINTAYO_COLLAR_SLEEVE: ProductOverride = {
  shortDesc:
    'Комір-рукав KINTAYO — універсальний тренажер зі щільної джудо-тканини, який одночасно імітує комір і рукав кімоно. Призначений для тренування захватів, зміцнення спини, плечей, тулуба та розвитку сили рук. Підходить для різних форматів тренування.',
  usage: [
    'Відпрацювання захватів за комір і рукав — реалістичне відчуття кімоно',
    'Зміцнення м\'язів спини, плечей і тулуба',
    'Розвиток сили рук у комплексі з тренажерами',
    'Самостійне тренування або як доповнення до парної роботи',
  ],
  whoFor:
    'Для спортсменів з єдиноборств, які хочуть вдосконалити роботу з захватами та зміцнити відповідні м\'язові групи. Підходить для дзюдоїстів будь-якого рівня підготовки.',
  features: [
    'Одночасно імітує комір і рукав кімоно — підвищена ефективність тренувань',
    'Щільна джудо-тканина 550 г/м² — міцна та довговічна',
    'Матеріал: 70% бавовна, 30% поліестер',
    'Розміри: 200 × 20 см',
    'Вишивка KINTAYO',
  ],
  specs: {
    'Бренд': 'KINTAYO',
    'Артикул': 'KNT-CS-2-550',
    'Тип': 'Комір-рукав (Collar Sleeve)',
    'Матеріал': '70% бавовна, 30% поліестер',
    'Щільність тканини': '550 г/м²',
    'Розміри': '200 × 20 см',
    'Колір': 'Синій',
    'Цільова група': 'Спортсмени з єдиноборств',
    'Країна виробника': 'Пакистан',
  },
  kit: [],
  kitFixed: false,
  audience: '',
  care: [],
};

// ── KINTAYO Канат-рукав (Rope Sleeve) ────────────────────────────────────────
const KINTAYO_ROPE_SLEEVE: ProductOverride = {
  shortDesc:
    'Канат-рукав KINTAYO — тренажер зі щільної джудо-тканини, що одночасно імітує комір та рукав кімоно. Призначений для тренування захватів і зміцнення спини, плечей, тулуба та рук. Кріпиться на 4 кільця — підходить для різних варіантів використання.',
  usage: [
    'Тренування захватів у позиції стоячи та лежачи',
    'Зміцнення м\'язів спини, плечей і тулуба',
    'Розвиток м\'язів рук у комплексі',
    'Робота над технікою захватів за комір і рукав',
  ],
  whoFor:
    'Для спортсменів з єдиноборств, яким потрібен універсальний тренажер для роботи над захватами. Підходить для дзюдоїстів і всіх, хто тренує захвати за кімоно.',
  features: [
    'Одночасно імітує комір і рукав кімоно',
    'Довжина 200 см × 20 см — зручно для різних варіантів кріплення',
    'Щільна джудо-тканина 550 г/м²',
    'Матеріал: 70% бавовна, 30% поліестер',
    '4 кільця для кріплення',
    'Вишивка KINTAYO',
  ],
  specs: {
    'Бренд': 'KINTAYO',
    'Тип': 'Канат-рукав (комір + рукав)',
    'Матеріал': '70% бавовна, 30% поліестер',
    'Щільність тканини': '550 г/м²',
    'Розміри': '200 × 20 см',
    'Колір': 'Синій',
    'Кріплення': '4 кільця',
    'Країна виробника': 'Пакистан',
  },
  kit: [],
  kitFixed: false,
  audience: '',
  care: [],
};

// ── KINTAYO Канат-рукав 3м/5м (Rope Sleeve — довші версії) ──────────────────
const KINTAYO_ROPE_SLEEVE_LONG: ProductOverride = {
  shortDesc:
    'Канат-рукав KINTAYO — подовжена версія тренажера для роботи над захватами. Виготовлений зі щільної джудо-тканини 750 г/м². Кріпиться на 4 кільця, без карабіна в комплекті. Підходить для зміцнення спини, плечей, тулуба та м\'язів рук.',
  usage: [
    'Тренування захватів і тяги на довшій дистанції',
    'Зміцнення спини, плечей і тулуба',
    'Розвиток сили рук і передпліч',
    'Робота з різними варіантами кріплення',
  ],
  whoFor:
    'Для спортсменів з єдиноборств, яким потрібна довша версія канату-рукава для ширшого спектра вправ. Підходить для тренувань у залі.',
  features: [
    'Щільна джудо-тканина 750 г/м² — міцна основа для інтенсивних тренувань',
    'Розмір 3м×20см або 5м×20см',
    'Матеріал: 70% бавовна, 30% поліестер',
    '4 кільця для кріплення',
    'Без карабіна в комплекті',
    'Вишивка KINTAYO',
  ],
  specs: {
    'Бренд': 'KINTAYO',
    'Тип': 'Канат-рукав',
    'Матеріал': '70% бавовна, 30% поліестер',
    'Щільність тканини': '750 г/м²',
    'Кріплення': '4 кільця (без карабіна)',
    'Країна виробника': 'Пакистан',
  },
  kit: [],
  kitFixed: false,
  audience: '',
  care: [],
};

// ── IPPON GEAR Grip Trainer ──────────────────────────────────────────────────
const IPPON_GEAR_GRIP_TRAINER: ProductOverride = {
  shortDesc:
    'Тренажер для захвату IPPON GEAR — простий і ефективний інструмент для розвитку сили хвата та передпліч. Імітує рукав кімоно для дзюдо та BJJ. Доступний у двох версіях: M для гирей і тяг, L для підтягувань.',
  usage: [
    'Версія M (40×20 см): тренування з гирями, станова тяга та вправи з обтяженням',
    'Версія L (65×20 см): підтягування на перекладині',
    'Розвиток сили пальців і передпліч для єдиноборств',
  ],
  whoFor:
    'Для спортсменів з дзюдо, BJJ або силових тренувань, які хочуть покращити силу хвата. Підходить для залу та домашніх тренувань.',
  features: [
    'Дві версії: M (40×20 см) — гирі та тяги / L (65×20 см) — підтягування',
    'Імітує рукав кімоно для дзюдо та бразильського джиу-джитсу',
    'Сумісний з гирями, штангою, перекладиною та іншим обладнанням',
    'Простий монтаж — протягнути через рукоять і тренування розпочато',
    'У комплекті: 2 штуки',
  ],
  specs: {
    'Бренд': 'IPPON GEAR',
    'Тип': 'Тренажер для захвату',
    'Версія M': '40 × 20 см — для гирей, тяг',
    'Версія L': '65 × 20 см — для підтягувань',
    'Комплект': '2 штуки',
    'Країна реєстрації бренду': 'Німеччина',
  },
  kit: [],
  kitFixed: false,
  audience: '',
  care: [],
};

// ── IPPON GEAR Uchi Komi 2 Training Tool ─────────────────────────────────────
const IPPON_GEAR_UCHI_KOMI_2: ProductOverride = {
  shortDesc:
    'IPPON GEAR Uchi Komi 2 — тренажер для технічної роботи у дзюдо та BJJ. Дозволяє відпрацьовувати входи в кидки (учі-комі) без партнера: розвиває координацію, відчуття дистанції, натяг і правильний рух у техніці. Для самостійної роботи — вдома, у залі або на зборах.',
  usage: [
    'Учі-комі — відпрацювання повторних входів у кидки без завершення',
    'Розвиток координації, натягу та відчуття дистанції',
    'Тренування техніки руху і правильного положення тіла',
    'Самостійна технічна робота без партнера або тренера',
    'Підготовка до змагань — напрацювання автоматизму в техніці',
  ],
  whoFor:
    'Для дзюдоїстів і BJJ-спортсменів будь-якого рівня. Підходить для особистих тренувань, клубної роботи та тренерів, яким потрібен інструмент для постановки техніки.',
  features: [
    'Спеціалізований тренажер саме для учі-комі — не грип-тренер і не силовий снаряд',
    'Допомагає напрацьовувати правильну техніку входів у кидки',
    'Матеріал: бавовна — близьке до кімоно відчуття при захваті',
    'Розмір: Adult (дорослий)',
    'Колір: чорний',
    'Легко прати',
  ],
  specs: {
    'Бренд': 'IPPON GEAR',
    'Тип': 'Тренажер для учі-комі',
    'Матеріал': 'Бавовна',
    'Дисципліна': 'Дзюдо, BJJ',
    'Розмір': 'Adult',
    'Колір': 'Чорний',
    'Країна реєстрації бренду': 'Німеччина',
    'Країна виробника': 'Пакистан',
  },
  kit: [],
  kitFixed: false,
  audience: '',
  care: [],
};

// ── IPPON GEAR BAG (generic fallback) ────────────────────────────────────────
const IPPON_GEAR_BAG: ProductOverride = {
  shortDesc:
    'Спортивна сумка IPPON GEAR для тренувань і змагань. Містка, зручна та практична — легко вміщує повний комплект екіпірування. Підходить для щоденного використання та виїздів на турніри.',
  features: [],
  kit: [],
  kitFixed: false,
  audience:
    'Для спортсменів, яким потрібна надійна сумка для носіння екіпірування на тренування або змагання.',
  care: [],
};

// ─── KINTAYO CAP (id 1756) — бейсболка класична ──────────────────────────────
const KINTAYO_CAP_BASEBALL: ProductOverride = {
  shortDesc:
    'Бейсболка KINTAYO JUDO — стильний аксесуар із 100% натуральної бавовни щільністю 320 г/м². Унісекс, універсальний розмір з регульованою застібкою ззаду. Підходить для тренувань, повсякденного носіння та як подарунок спортсмену.',
  features: [
    'Матеріал: 100% натуральна бавовна, 320 г/м²',
    'Вентиляційні отвори для кращої циркуляції повітря',
    'Регульована застібка ззаду — підходить більшості',
    'Класичний вигнутий козирок',
    'Унісекс — для дорослих і підлітків',
    'Нашивка / вишивка KINTAYO JUDO',
    'Розмір: Universal (One Size)',
    'Підходить для тренувань і щоденного носіння',
  ],
  kit: [],
  kitFixed: true,
  audience:
    'Для спортсменів, які займаються дзюдо та хочуть стильний аксесуар KINTAYO. Підходить як подарунок або доповнення до комплекту тренувального одягу.',
  care: [
    'Прати при 30°C',
    'Не відбілювати',
    'Не використовувати сушарку',
    'Сушити природним способом',
  ],
};

// ─── KINTAYO CAP SNAPBACK (id 1759) — реперка / прямий козирок ───────────────
const KINTAYO_CAP_SNAPBACK: ProductOverride = {
  shortDesc:
    'Бейсболка KINTAYO JUDO з прямим козирком — streetwear стиль із 100% натуральної бавовни щільністю 340 г/м². Snapback застібка, вентиляційні отвори, унісекс. Для тих, хто поєднує спорт і стиль.',
  features: [
    'Матеріал: 100% натуральна бавовна, 340 г/м²',
    'Прямий козирок — streetwear / snapback стиль',
    'Вентиляційні отвори для кращої циркуляції повітря',
    'Регульована застібка ззаду — підходить більшості',
    'Унісекс — для дорослих і підлітків',
    'Нашивка / вишивка KINTAYO JUDO',
    'Розмір: Universal (One Size)',
    'Підходить для тренувань, відпочинку та повсякденного носіння',
  ],
  kit: [],
  kitFixed: true,
  audience:
    'Для спортсменів і тих, хто цінує streetwear стиль. Підходить як стильний аксесуар до тренувального одягу або як подарунок.',
  care: [
    'Прати при 30°C',
    'Не відбілювати',
    'Не використовувати сушарку',
    'Сушити природним способом',
  ],
};
