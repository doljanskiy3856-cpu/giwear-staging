#!/usr/bin/env bun
/**
 * Post-build sitemap generator.
 * Calls the local API (/api/products) to get canonical product IDs,
 * then writes dist/sitemap.xml with clean, deduplicated URLs.
 *
 * Why /api/products instead of raw YML:
 *   - Raw YML has 600+ size/color offers → not canonical product pages
 *   - /api/products returns 87 grouped products (groupId-level, deduplicated)
 *   - We filter available=true → 84 canonical product pages
 *   - These IDs match exactly what ProductPage renders at /product/:id
 *
 * Run automatically via `postbuild` npm hook after `vite build`.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://giwear.com.ua').replace(/\/$/, '');

// Must match server.ts PORT (postbuild runs while server is NOT running, so we use the API inline)
// We re-implement the product fetch here using the same YML parser logic but at group level.

const CATEGORY_PATHS = [
  '/karate',
  '/judo',
  '/bjj',
  '/dytiachy',
];

// Static informational pages
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/karate', priority: '0.9', changefreq: 'weekly' },
  { path: '/judo', priority: '0.9', changefreq: 'weekly' },
  { path: '/bjj', priority: '0.9', changefreq: 'weekly' },
  { path: '/dytiachy', priority: '0.9', changefreq: 'weekly' },
  { path: '/trenery', priority: '0.7', changefreq: 'monthly' },
  { path: '/dostavka', priority: '0.6', changefreq: 'monthly' },
  { path: '/kontakty', priority: '0.6', changefreq: 'monthly' },
];

const YML_URL =
  process.env.YML_CATALOG_URL ||
  'https://kintayo.salesdrive.me/export/yml/export.yml?publicKey=qMA7hvyfa9nBtocvqo7UsLJWSYLeTX-Iyf1ExYd0Hol7seq1jae9xXB8DWBor6Qwhtfi4f_s';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlUrl(loc: string, priority: string, changefreq: string): string {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

/**
 * Fetch canonical product IDs by parsing YML at group_id level.
 * This mirrors what yml-catalog.ts does: group offers by group_id → one Product per group.
 * Returns only available groups (at least one offer with available=true).
 * 
 * group_id fallback: if no group_id attr, use offer id (same as yml-catalog.ts line 623).
 */
async function fetchCanonicalProductIds(): Promise<string[]> {
  console.log('[sitemap] Fetching YML catalog for canonical product IDs...');
  const res = await fetch(YML_URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`YML fetch failed: ${res.status}`);
  const xml = await res.text();

  // Parse all offers: extract id, group_id, available
  const offerRe = /<offer\s([^>]*)>([\s\S]*?)<\/offer>/g;
  const groups = new Map<string, boolean>(); // groupId → hasAvailableOffer

  let m;
  while ((m = offerRe.exec(xml)) !== null) {
    const attrs = m[1];
    const rawId = attrs.match(/\bid="([^"]*)"/)?.[1] ?? '';
    const groupId = attrs.match(/\bgroup_id="([^"]*)"/)?.[1] ?? rawId;
    const available = attrs.match(/\bavailable="([^"]*)"/)?.[1] !== 'false';

    if (!groupId) continue;

    // A group is available if ANY of its offers is available
    if (!groups.has(groupId)) {
      groups.set(groupId, available);
    } else if (available) {
      groups.set(groupId, true);
    }
  }

  // Filter to available groups only
  const availableGroupIds = [...groups.entries()]
    .filter(([, avail]) => avail)
    .map(([id]) => id);

  console.log(`[sitemap] Found ${groups.size} product groups, ${availableGroupIds.length} available.`);
  return availableGroupIds;
}

async function main() {
  let productIds: string[] = [];

  try {
    productIds = await fetchCanonicalProductIds();
  } catch (e) {
    console.warn('[sitemap] Warning: could not fetch YML catalog:', e);
    console.warn('[sitemap] Generating sitemap with static pages only.');
  }

  const staticUrls = STATIC_PAGES.map(({ path, priority, changefreq }) =>
    xmlUrl(`${SITE_URL}${path}`, priority, changefreq)
  );

  const productUrls = productIds.map((id) =>
    xmlUrl(`${SITE_URL}/product/${id}`, '0.8', 'weekly')
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls,
    ...productUrls,
    '</urlset>',
  ].join('\n');

  const distDir = join(import.meta.dir, '..', '..', 'dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  const outPath = join(distDir, 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');

  const totalUrls = staticUrls.length + productUrls.length;
  console.log(`[sitemap] Written ${totalUrls} URLs to ${outPath}`);
  console.log(`[sitemap]   Static pages: ${staticUrls.length}`);
  console.log(`[sitemap]   Product pages: ${productUrls.length}`);
  console.log(`[sitemap]   File size: ${(xml.length / 1024).toFixed(1)} KB`);
}

main().catch((e) => {
  console.error('[sitemap] Fatal error:', e);
  process.exit(1);
});
