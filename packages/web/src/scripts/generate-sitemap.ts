#!/usr/bin/env bun
/**
 * Post-build sitemap generator.
 * Fetches the YML catalog and writes dist/sitemap.xml.
 * Run automatically via `postbuild` npm hook after `vite build`.
 *
 * Usage: bun run scripts/generate-sitemap.ts
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://giwear.com.ua').replace(/\/$/, '');

const YML_URL =
  process.env.YML_CATALOG_URL ||
  'https://kintayo.salesdrive.me/export/yml/export.yml?publicKey=qMA7hvyfa9nBtocvqo7UsLJWSYLeTX-Iyf1ExYd0Hol7seq1jae9xXB8DWBor6Qwhtfi4f_s';

const CATEGORY_PATHS = [
  '/category/karate',
  '/category/judo',
  '/category/bjj',
  '/category/sambo',
  '/category/aikido',
  '/category/dytiachy',
  '/category/accessories',
  '/category/bags',
  '/category/trainers',
];

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

async function fetchAvailableProductIds(): Promise<string[]> {
  try {
    console.log('[sitemap] Fetching YML catalog...');
    const res = await fetch(YML_URL, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`YML fetch failed: ${res.status}`);
    const xml = await res.text();

    // Extract available offers: <offer id="..." available="true">
    const ids: string[] = [];
    const seen = new Set<string>();
    const offerRe = /<offer\s[^>]*\bavailable="true"[^>]*>/g;
    let m;
    while ((m = offerRe.exec(xml)) !== null) {
      const idMatch = /\bid="([^"]+)"/.exec(m[0]);
      if (idMatch) {
        const id = idMatch[1];
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
    console.log(`[sitemap] Found ${ids.length} available products.`);
    return ids;
  } catch (e) {
    console.warn('[sitemap] Warning: could not fetch YML catalog:', e);
    return [];
  }
}

async function main() {
  const productIds = await fetchAvailableProductIds();

  const staticUrls = [
    xmlUrl(`${SITE_URL}/`, '1.0', 'daily'),
    ...CATEGORY_PATHS.map((path) => xmlUrl(`${SITE_URL}${path}`, '0.9', 'daily')),
  ];

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
  console.log(`[sitemap] Written to ${outPath} (${(xml.length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error('[sitemap] Fatal error:', e);
  process.exit(1);
});
