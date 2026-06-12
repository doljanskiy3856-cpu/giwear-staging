/**
 * useSeoMeta — централізований SEO hook для GIWEAR.
 *
 * Встановлює:
 *   - document.title
 *   - <meta name="description">
 *   - <link rel="canonical"> (clean URL, без query params що не стосуються SEO)
 *
 * Canonical базується на VITE_SITE_URL з .env.
 * Якщо env не встановлено — canonical не генерується (безпечний dev-fallback).
 */

import { useEffect } from 'react';

const SITE_URL: string =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_SITE_URL?.replace(/\/$/, '') ?? '';

interface SeoMetaOptions {
  title: string;
  description: string;
  /** Clean path без query params, напр. '/product/kintayo-koka-blue' */
  canonicalPath: string;
}

export function useSeoMeta({ title, description, canonicalPath }: SeoMetaOptions): void {
  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────────────────
    document.title = title;

    // ── Meta description ───────────────────────────────────────────────────
    let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.name = 'description';
      document.head.appendChild(descEl);
    }
    descEl.content = description;

    // ── Canonical ──────────────────────────────────────────────────────────
    // Only inject if VITE_SITE_URL is configured (skip on dev without env).
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (SITE_URL) {
      const href = `${SITE_URL}${canonicalPath}`;
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.rel = 'canonical';
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.href = href;
    } else {
      // No SITE_URL → remove any stale canonical to avoid wrong domain
      canonicalEl?.remove();
    }

    // ── Cleanup on unmount ─────────────────────────────────────────────────
    return () => {
      // Reset to site default — prevents stale title if user navigates back
      // to a page that doesn't use this hook yet.
      document.title = 'GIWEAR — екіпірування для єдиноборств в Україні';
    };
  }, [title, description, canonicalPath]);
}
