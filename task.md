# Task: Split bjj_grappling into bjj + grappling

## Goal
Products with "грепплінг" in name/sport → sportSlug = 'grappling'
Products with "джиу-джитсу"/"bjj"/"jiu-jitsu" → sportSlug = 'bjj'
No more false "джиу-джитсу" on grappling product cards/pages.

## Affected Products
- 1583/1587/1599/1603 = BUDOGI grappling (синій+червоний)
- 1401/1405 = KINTAYO grappling (синій+червоний)
- 1647 = KINTAYO belt grappling
- 1500/1520/1524/1540 = BUDOGI BJJ gi (4 colors incl. blue/red)
- 244/181 = KINTAYO BJJ gi (чорне)
- 291 = KINTAYO BJJ belt

## Files to change
1. [x] src/lib/categories.ts — add 'grappling' to SportSlug, SPORT_PATTERNS, SPORT_LABELS, normalizeCategorySlug
2. [x] src/web/data/products.ts — add 'grappling' to SportSlug type
3. [x] src/web/components/ProductCard.tsx — KIMONO_TYPE_PREFIX + SPORT_LABEL + isBeltSwatch
4. [x] src/web/pages/ProductPage.tsx — SPORT_LABELS + isBeltSwatch
5. [x] src/web/lib/belt-rules.ts — bjj_grappling → bjj|grappling
6. [x] src/web/lib/cart-recommendations.ts — bjj_grappling → bjj|grappling
7. [x] src/web/pages/CategoryPage.tsx — bjj query + filters
8. [x] src/api/yml-catalog.ts — isBjjBelt

## Size chart
- grappling products: BUDOGI_CHART_GRAPPLING / KINTAYO_CHART_GRAPPLING (already correct)
- bjj products: BUDOGI_CHART_BJJ (already correct)

## Status
IN PROGRESS
