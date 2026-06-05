/**
 * CrossSellBlock — "Додай до тренування"
 * Shows bags, trainers, belts as a separate recommendation block
 * inside sport category pages. Never affects main catalog filters.
 */
import { useRef } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Package } from 'lucide-react';
import type { Product } from '../data/products';
import ProductCard from './ProductCard';

/* ── Priority sort within cross-sell items ── */
const TYPE_PRIORITY: Record<string, number> = { bags: 0, belts: 1, trainers: 2 };

// Keyword patterns to further sort bags (рюкзак/сумка first, валіза last)
const BAG_PRIORITY_PATTERNS = [/рюкзак/i, /сумка/i, /backpack/i, /bag/i];
const BAG_LOW_PATTERNS = [/валіза/i, /suitcase/i, /travell/i, /wheel/i];

function bagRank(name: string): number {
  if (BAG_LOW_PATTERNS.some((r) => r.test(name))) return 2;
  if (BAG_PRIORITY_PATTERNS.some((r) => r.test(name))) return 0;
  return 1;
}

function sortCrossSell(items: Product[]): Product[] {
  return [...items].sort((a, b) => {
    const pa = TYPE_PRIORITY[a.productType] ?? 99;
    const pb = TYPE_PRIORITY[b.productType] ?? 99;
    if (pa !== pb) return pa - pb;
    // Within bags: rank by name
    if (a.productType === 'bags' && b.productType === 'bags') {
      return bagRank(a.name) - bagRank(b.name);
    }
    return 0;
  });
}

/* ── Determine CTA button link/label based on what's in the set ── */
function ctaInfo(items: Product[]): { label: string; href: string } {
  const hasBags = items.some((p) => p.productType === 'bags');
  const hasOther = items.some((p) => p.productType !== 'bags');
  if (hasBags && !hasOther) return { label: 'Перейти до сумок', href: '/category/bags' };
  return { label: 'Перейти до аксесуарів', href: '/category/accessories' };
}

/* ── Component ── */
export default function CrossSellBlock() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: raw = [], isLoading } = useQuery<Product[]>({
    queryKey: ['cross-sell'],
    queryFn: () => fetch('/api/products/cross-sell?limit=12').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const items = sortCrossSell(raw).slice(0, 6);
  const { label: ctaLabel, href: ctaHref } = ctaInfo(items);

  // Don't render anything while loading or if nothing to show
  if (isLoading || items.length === 0) return null;

  return (
    <section className="cross-sell-block py-8 sm:py-10 border-t border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package size={15} className="text-[#E8232A] flex-shrink-0" />
              <h2 className="text-[15px] sm:text-[17px] font-semibold text-white font-inter tracking-tight">
                Додай до тренування
              </h2>
            </div>
            <p className="text-[#666] text-[12px] sm:text-[13px] font-inter leading-relaxed max-w-md">
              Сумки, пояси, резини, захвати та інше спорядження
            </p>
          </div>

          {/* CTA — desktop only */}
          <Link
            href={ctaHref}
            className="hidden sm:flex items-center gap-1.5 flex-shrink-0 h-9 px-4 bg-transparent border border-[#2A2A2A] rounded-lg text-[13px] font-inter text-[#909090] hover:border-[#E8232A]/50 hover:text-[#E8232A] transition-colors"
          >
            {ctaLabel}
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* ── Desktop: 4-col grid (lg+), 3-col (md) ── */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-5">
          {items.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {/* ── Mobile: horizontal scroll ── */}
        <div className="sm:hidden relative">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory"
            style={{ scrollPaddingLeft: '12px' }}
          >
            {items.map((p) => (
              <div
                key={p.id}
                className="flex-shrink-0 snap-start"
                style={{ width: 'calc(50vw - 18px)', maxWidth: '180px' }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {/* fade edge */}
          <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-[#0F0F0F] to-transparent pointer-events-none" />
        </div>

        {/* CTA — mobile */}
        <div className="sm:hidden mt-4">
          <Link
            href={ctaHref}
            className="flex items-center justify-center gap-1.5 w-full h-10 border border-[#2A2A2A] rounded-lg text-[13px] font-inter text-[#909090] hover:border-[#E8232A]/50 hover:text-[#E8232A] transition-colors"
          >
            {ctaLabel}
            <ChevronRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  );
}
