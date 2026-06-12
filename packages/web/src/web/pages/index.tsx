import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { MessageCircle, ChevronRight, ChevronLeft, ArrowRight, Truck, RotateCcw, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '../data/products';
import ProductCard from '../components/ProductCard';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useJsonLd } from '../hooks/useJsonLd';

const heroSlides = [
  { img: '/hero1.png' },
  { img: '/hero2.png' },
  { img: '/hero3.png' },
];

const mainSports = [
  { slug: 'karate',   label: 'Карате',                      href: '/category/karate',   img: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&q=80' },
  { slug: 'judo',     label: 'Дзюдо',                       href: '/category/judo',     img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=500&q=80' },
  { slug: 'bjj',      label: 'BJJ / Грепплінг',             href: '/category/bjj',      img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80' },
  { slug: 'sambo',    label: 'Самбо',                       href: '/category/sambo',    img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80' },
  { slug: 'aikido',   label: 'Айкідо',                      href: '/category/aikido',   img: 'https://images.unsplash.com/photo-1600267165477-6d4cc741b379?w=500&q=80' },
  { slug: 'children', label: 'Дитячі',                      href: '/category/children', img: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&q=80' },
];

const BRAND_GUIDE = [
  {
    name: 'KINTAYO',
    tagline: 'Для дзюдо, BJJ і тренувань',
    desc: 'Універсальний бренд для регулярних тренувань, клубів і спортсменів різного рівня.',
    tags: ['Дзюдо', 'BJJ', 'Пояси', 'Тренажери'],
    href: '/category/brand?brand=KINTAYO',
    accent: '#E8232A',
  },
  {
    name: 'BUDOGI',
    tagline: 'Кімоно, дитяче, BJJ, греплінг',
    desc: 'Практичний вибір для старту, дитячих секцій і регулярних тренувань.',
    tags: ['Кімоно', 'Дитяче', 'BJJ', 'Греплінг'],
    href: '/category/brand?brand=BUDOGI',
    accent: '#E8232A',
  },
  {
    name: 'IPPON GEAR',
    tagline: 'IJF-моделі, сумки, тренажери',
    desc: 'Для спортсменів, турнірів і професійного рівня. Визнаний бренд із Німеччини.',
    tags: ['Дзюдо', 'IJF', 'Сумки', 'Тренажери'],
    href: '/category/brand?brand=IPPON+GEAR',
    accent: '#E8232A',
  },
];

function sortProducts(products: Product[]) {
  return [...products].sort(
    (a, b) =>
      Number(b.available) - Number(a.available) ||
      Number((b.sizes?.length ?? 0) > 0) - Number((a.sizes?.length ?? 0) > 0) ||
      a.name.localeCompare(b.name, 'uk'),
  );
}

// ─── BrandCard with scroll reveal + micro-interactions ───────────────────────
type BrandGuideItem = typeof BRAND_GUIDE[number];

function BrandCard({ brand: b, index }: { brand: BrandGuideItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 0.48s ease ${index * 0.10}s, transform 0.48s ease ${index * 0.10}s`,
      }}
    >
      <Link href={b.href} className="group block h-full">
        {/* card */}
        <div
          className="relative h-full rounded-2xl p-4 lg:p-6 flex flex-col overflow-hidden
            border border-[#252525]
            bg-[#141414]
            transition-all duration-300 ease-out
            hover:-translate-y-[3px]
            hover:border-[#E8232A]/55
            hover:shadow-[0_4px_28px_rgba(232,35,42,0.11)]
            active:scale-[0.985] active:border-[#E8232A]/40"
        >
          {/* radial glow — almost invisible, appears on hover via opacity */}
          <div
            className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full
              bg-[radial-gradient(circle,rgba(232,35,42,0.07)_0%,transparent_70%)]
              opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />

          {/* Brand name + tagline */}
          <div className="mb-3 relative">
            <p className="font-unbounded text-white text-base lg:text-lg font-black tracking-tight leading-tight">
              {b.name}
            </p>
            <p className="font-inter text-[#E8232A] text-xs font-medium mt-1 uppercase tracking-wide">
              {b.tagline}
            </p>
          </div>

          {/* Description */}
          <p className="font-inter text-[#909090] text-sm leading-relaxed flex-1 relative">
            {b.desc}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3 lg:mt-4 relative">
            {b.tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: '#C2CDD5',
                  background: '#252C36',
                  border: '1px solid #4E6070',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  display: 'inline-block',
                  letterSpacing: '0.02em',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#2E3A46';
                  (e.currentTarget as HTMLElement).style.borderColor = '#6A8090';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = '#252C36';
                  (e.currentTarget as HTMLElement).style.borderColor = '#4E6070';
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-3 lg:mt-5 pt-3 lg:pt-4 border-t border-[#222] relative">
            <span className="inline-flex items-center font-inter text-[#E8232A] text-sm font-semibold">
              <span>Дивитися {b.name}</span>
              <ArrowRight
                size={14}
                className="shrink-0 ml-1.5 transition-transform duration-200 group-hover:translate-x-[4px]"
              />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function HomePage() {
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
  });
  const hits = sortProducts(allProducts).filter(p => p.available).slice(0, 4);

  /* ── SEO ── */
  useSeoMeta({
    title: 'GIWEAR — екіпірування для єдиноборств в Україні',
    description:
      'Офіційний інтернет-магазин кімоно та гі для карате, дзюдо, BJJ, самбо, айкідо. Доставка по Україні за 1–2 дні. Допомога з вибором розміру.',
    canonicalPath: '/',
  });

  const _homeSiteUrl = ((import.meta as any).env?.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://giwear.com.ua';
  useJsonLd('homepage', [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'GIWEAR',
      url: _homeSiteUrl,
      logo: `${_homeSiteUrl}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        url: 'https://t.me/gistore_ua',
        availableLanguage: 'Ukrainian',
      },
      sameAs: ['https://t.me/gistore_ua'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'GIWEAR',
      url: _homeSiteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${_homeSiteUrl}/category/karate?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ]);

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % heroSlides.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">

      {/* ── HERO ── */}
      <section className="relative bg-[#0F0F0F] overflow-hidden">
        {heroSlides.map((s, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: slide === i ? 1 : 0 }}>
            <div
              className="absolute inset-0"
              style={{ backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center 15%', opacity: 0.25 }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F0F]/60 via-[#0F0F0F]/40 to-[#0F0F0F]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 lg:pt-32 lg:pb-16">

          <style>{`
            .hero-cta {
              position: relative;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              background: linear-gradient(135deg, rgba(158,20,26,0.92) 0%, rgba(220,34,40,0.88) 55%, rgba(175,24,30,0.90) 100%);
              color: #fff;
              font-weight: 700;
              line-height: 1;
              border-radius: 10px;
              border: 1px solid rgba(239,68,68,0.28);
              box-shadow: 0 2px 10px rgba(200,30,36,0.20), inset 0 1px 0 rgba(255,255,255,0.10);
              transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
              overflow: hidden;
            }
            .hero-cta span {
              display: inline-block;
              line-height: 1;
              vertical-align: middle;
            }
            .hero-cta::after {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 60%);
              border-radius: inherit;
              pointer-events: none;
            }
            @media (hover: hover) {
              .hero-cta:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 18px rgba(220,34,40,0.28), inset 0 1px 0 rgba(255,255,255,0.14);
                background: linear-gradient(135deg, rgba(175,24,30,0.95) 0%, rgba(232,35,42,0.92) 55%, rgba(190,28,34,0.94) 100%);
              }
              .hero-cta:hover .hero-cta-arrow { transform: translateX(3px); }
            }
            .hero-cta:active { transform: translateY(0); }
            .hero-cta-arrow { transition: transform 180ms ease; }

            /* integrated trust cards */
            @keyframes htrust-blink {
              0%, 100% { border-color: rgba(255,255,255,0.10); }
              8%        { border-color: rgba(232,35,42,0.45); }
              16%       { border-color: rgba(255,255,255,0.10); }
            }
            .htrust-card {
              background-color: rgba(255,255,255,0.04);
              border: 1px solid rgba(255,255,255,0.07);
              border-radius: 10px;
              padding: 8px 10px;
              display: flex;
              align-items: center;
              gap: 8px;
              overflow: visible;
              backdrop-filter: blur(6px);
              -webkit-backdrop-filter: blur(6px);
            }
            .htrust-text {
              min-width: 0;
              overflow: visible;
            }
            .htrust-card--1 { animation: htrust-blink ease-in-out 5.5s 0s    infinite; }
            .htrust-card--2 { animation: htrust-blink ease-in-out 5.5s 1.5s  infinite; }
            .htrust-card--3 { animation: htrust-blink ease-in-out 5.5s 3.0s  infinite; }
            .htrust-card--4 { animation: htrust-blink ease-in-out 5.5s 4.5s  infinite; }
            .htrust-icon {
              width: 24px; height: 24px;
              border-radius: 6px;
              background-color: rgba(232,35,42,0.08);
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            /* title/sub — єдиний контроль розміру, без Tailwind font-size */
            .htrust-title {
              font-size: 10px;
              line-height: 1.3;
              font-weight: 600;
              color: rgba(255,255,255,0.92);
            }
            .htrust-sub {
              font-size: 9px;
              line-height: 1.3;
              margin-top: 2px;
              color: rgba(255,255,255,0.42);
            }
            /* кнопки — базовий розмір (mobile) */
            .hero-cta { font-size: 15px; }
            .hero-tg  { font-size: 13px; }

            /* ── Desktop overrides ── */
            @media (min-width: 1024px) {
              .htrust-card {
                padding: 12px 16px;
                gap: 12px;
                border-radius: 12px;
                border-color: rgba(255,255,255,0.07);
                background-color: rgba(255,255,255,0.04);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                min-width: 190px;
              }
              .htrust-icon {
                width: 40px; height: 40px;
                border-radius: 10px;
                background-color: rgba(232,35,42,0.16);
              }
              .htrust-title {
                font-size: 13px;
                line-height: 1.3;
                font-weight: 600;
                letter-spacing: 0;
                text-transform: none;
                color: rgba(255,255,255,0.95);
              }
              .htrust-sub {
                font-size: 11px;
                line-height: 1.3;
                margin-top: 3px;
                color: rgba(255,255,255,0.45);
              }
              .hero-cta-desktop {
                font-size: 17px;
                line-height: 1;
                padding: 16px 36px;
                border-radius: 12px;
                gap: 10px;
                align-items: center;
              }
              .hero-tg-desktop {
                font-size: 17px;
                line-height: 1;
                padding: 15px 28px;
                border-radius: 12px;
                align-items: center;
              }
            }
            @media (min-width: 1280px) {
              .htrust-card { min-width: 210px; }
            }

            @media (prefers-reduced-motion: reduce) {
              .hero-cta, .hero-cta::after { animation: none !important; }
              .hero-cta:hover { transform: none; }
              .htrust-card--1,.htrust-card--2,.htrust-card--3,.htrust-card--4 { animation: none !important; }
            }
          `}</style>

          {/* ── Mobile hero ── */}
          <div className="lg:hidden flex flex-col gap-5 pb-2">
            <div>
              <p className="text-[#E8232A] text-[10px] font-bold font-inter uppercase tracking-widest mb-2">
                Кімоно та екіпірування
              </p>
              <h1 className="font-unbounded text-[26px] font-black text-white leading-tight">
                Екіпіруй себе.<br />
                <span className="text-[#E8232A]">Виграй поєдинок.</span>
              </h1>
            </div>

            <p className="font-inter text-[#909090] text-[13px] leading-relaxed -mt-1">
              Карате, дзюдо, BJJ, дитячі товари — доставка по Україні за 1–2 дні.
            </p>

            <div className="flex flex-col gap-2">
              <a href="#catalog" className="hero-cta justify-center font-inter py-3.5 px-5 w-full">
                <span>Перейти в каталог</span>
                <ChevronRight size={17} className="hero-cta-arrow" />
              </a>
              <a href="https://t.me/gistore_ua" target="_blank" rel="noopener noreferrer"
                className="hero-tg flex items-center justify-center gap-2 border border-white/10 text-white/45 font-inter py-2.5 rounded-lg transition-all w-full text-[12px]"
              >
                <MessageCircle size={13} className="text-[#2AABEE]" style={{flexShrink:0}} />
                <span>Підібрати розмір у Telegram</span>
              </a>
            </div>

            {/* Integrated trust — 2×2 */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="htrust-card htrust-card--1">
                <div className="htrust-icon"><Truck size={11} strokeWidth={1.5} className="text-[#E8232A]" /></div>
                <div className="htrust-text"><p className="htrust-title font-inter">Доставка по Україні</p><p className="htrust-sub font-inter">Нова пошта 1–2 дні</p></div>
              </div>
              <div className="htrust-card htrust-card--2">
                <div className="htrust-icon"><RotateCcw size={11} strokeWidth={1.5} className="text-[#E8232A]" /></div>
                <div className="htrust-text"><p className="htrust-title font-inter">Обмін і повернення</p><p className="htrust-sub font-inter">14 днів без питань</p></div>
              </div>
              <div className="htrust-card htrust-card--3">
                <div className="htrust-icon"><Shield size={11} strokeWidth={1.5} className="text-[#E8232A]" /></div>
                <div className="htrust-text"><p className="htrust-title font-inter">Гарантія якості</p><p className="htrust-sub font-inter">Перевірені бренди</p></div>
              </div>
              <div className="htrust-card htrust-card--4">
                <div className="htrust-icon"><MessageCircle size={11} strokeWidth={1.5} className="text-[#E8232A]" /></div>
                <div className="htrust-text"><p className="htrust-title font-inter">Консультація</p><p className="htrust-sub font-inter">Telegram або Viber</p></div>
              </div>
            </div>
          </div>

          {/* ── Desktop hero ── */}
          <div className="hidden lg:flex flex-col gap-0">
            <div className="max-w-4xl">
              <span className="section-label">№1 магазин екіпірування в Україні</span>
              <h1 className="font-unbounded text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6 mt-3">
                Кімоно для <span className="text-[#E8232A]">перемог.</span><br />
                Доставка за 1–2 дні.
              </h1>
              <p className="font-inter text-[#A0A0A0] text-xl leading-relaxed mb-10 max-w-2xl">
                Карате, дзюдо, BJJ/Grappling, дитячі товари та інше екіпірування. Консультуємо по розміру безкоштовно.
              </p>
              <div className="flex items-center gap-5 mb-12">
                <a href="#catalog" className="hero-cta hero-cta-desktop font-inter font-bold">
                  <span>Обрати екіпірування</span>
                  <ChevronRight size={22} className="hero-cta-arrow" strokeWidth={2.5} />
                </a>
                <a href="https://t.me/gistore_ua" target="_blank" rel="noopener noreferrer"
                  className="hero-tg-desktop inline-flex items-center gap-2.5 border border-white/30 hover:border-white text-white font-inter font-semibold rounded-lg transition-all"
                >
                  <MessageCircle size={20} className="text-[#2AABEE]" style={{flexShrink:0}} />
                  <span>Підібрати розмір у Telegram</span>
                </a>
              </div>
            </div>

            {/* Integrated trust — 4 inline */}
            <div className="flex gap-3 flex-wrap">
              <div className="htrust-card htrust-card--1">
                <div className="htrust-icon"><Truck size={18} strokeWidth={1.6} className="text-[#E8232A]" /></div>
                <div className="htrust-text">
                  <p className="htrust-title font-inter">Доставка по Україні</p>
                  <p className="htrust-sub font-inter">Нова пошта 1–2 дні</p>
                </div>
              </div>
              <div className="htrust-card htrust-card--2">
                <div className="htrust-icon"><RotateCcw size={18} strokeWidth={1.6} className="text-[#E8232A]" /></div>
                <div className="htrust-text">
                  <p className="htrust-title font-inter">Обмін і повернення</p>
                  <p className="htrust-sub font-inter">14 днів без питань</p>
                </div>
              </div>
              <div className="htrust-card htrust-card--3">
                <div className="htrust-icon"><Shield size={18} strokeWidth={1.6} className="text-[#E8232A]" /></div>
                <div className="htrust-text">
                  <p className="htrust-title font-inter">Гарантія якості</p>
                  <p className="htrust-sub font-inter">Перевірені бренди</p>
                </div>
              </div>
              <div className="htrust-card htrust-card--4">
                <div className="htrust-icon"><MessageCircle size={18} strokeWidth={1.6} className="text-[#E8232A]" /></div>
                <div className="htrust-text">
                  <p className="htrust-title font-inter">Консультація</p>
                  <p className="htrust-sub font-inter">Telegram або Viber</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATALOG / DIRECTIONS ── */}
      <section id="catalog" className="pt-5 pb-3 lg:pt-14 lg:pb-6 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 lg:mb-8">
            <span className="section-label">Каталог</span>
            <h2 className="font-unbounded text-xl lg:text-4xl font-black text-white">Обери свій напрямок</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 lg:gap-5">
            {mainSports.map(cat => (
              <Link href={cat.href} key={cat.slug}>
                <div className="relative overflow-hidden rounded-xl border border-[#2E2E2E] hover:border-[#E8232A] group transition-all duration-300 cursor-pointer aspect-[1/1] lg:aspect-[16/10]">
                  {/* Photo */}
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
                    style={{ objectPosition: 'center 20%' }}
                  />
                  {/* Gradient — keeps text readable */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F]/90 via-[#0F0F0F]/20 to-transparent" />
                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-5 lg:p-4">
                    <h3 className="font-unbounded text-white text-[12px] sm:text-base lg:text-base font-black leading-tight mb-1">
                      {cat.label}
                    </h3>
                    <div className="flex items-center gap-1 text-[#E8232A] text-[10px] sm:text-sm font-bold font-inter">
                      Дивитись <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HITS ── */}
      <HitsSection hits={hits} />

      {/* ── BRANDS ── */}
      <section className="py-10 lg:py-16 bg-[#0F0F0F] pb-24 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-7 lg:mb-10">
            <span className="section-label">Бренди</span>
            <h2 className="font-unbounded text-xl lg:text-3xl font-black text-white mt-1 mb-2">
              Оберіть бренд під свою дисципліну
            </h2>
            <p className="font-inter text-[#606060] text-sm lg:text-base">
              KINTAYO, BUDOGI та IPPON GEAR — для дзюдо, BJJ, тренувань, дітей і професійного рівня.
            </p>
          </div>

          {/* Brand cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
            {BRAND_GUIDE.map((b, i) => (
              <BrandCard key={b.name} brand={b} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Hits carousel section ────────────────────────────────────────────────────

const HITS_STYLES = `
  /* ════════════════════════════════════
     MOBILE  (< 1024px)
     Simple horizontal swipe — no JS, no transform, no duplicates
     ════════════════════════════════════ */
  .hits-mobile-track {
    display: flex;
    flex-direction: row;
    gap: 12px;
    overflow-x: auto;
    overflow-y: visible;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;
    max-width: 100%;
  }
  .hits-mobile-track::-webkit-scrollbar { display: none; }

  .hits-mobile-slide {
    scroll-snap-align: start;
    flex: 0 0 calc(50% - 6px);
    min-width: 0;
    max-width: none;
  }

  @media (min-width: 500px) {
    .hits-mobile-slide { flex: 0 0 calc(33.333% - 8px); }
  }

  /* dots wrapper — always visible, never clipped */
  .hits-dots-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 12px 0 4px;
    overflow: visible;
  }

  /* dots */
  .hits-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.20);
    transition: background 0.25s ease, transform 0.25s ease, width 0.25s ease;
    flex-shrink: 0;
    padding: 0;
    border: none;
    cursor: pointer;
    display: block;
  }
  .hits-dot.active {
    background: #E8232A;
    transform: scale(1.4);
  }

  /* ════════════════════════════════════
     DESKTOP  (≥ 1024px)
     Infinite RAF carousel with arrows
     ════════════════════════════════════ */
  @media (min-width: 1024px) {
    .hits-desktop-shell {
      display: flex;
      align-items: center;
      gap: 0;
    }

    .hits-desktop-wrap {
      position: relative;
      overflow: hidden;
      flex: 1;
      min-width: 0;
    }

    .hits-desktop-track {
      display: flex;
      gap: 24px;
      will-change: transform;
    }

    .hits-desktop-slide {
      flex: 0 0 calc(25% - 18px);
      min-width: 220px;
    }

    /* fade masks */
    .hits-desktop-wrap::before,
    .hits-desktop-wrap::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      width: 72px;
      z-index: 2;
      pointer-events: none;
    }
    .hits-desktop-wrap::before {
      left: 0;
      background: linear-gradient(to right, #0F0F0F 0%, transparent 100%);
    }
    .hits-desktop-wrap::after {
      right: 0;
      background: linear-gradient(to left, #0F0F0F 0%, transparent 100%);
    }

    /* nav arrows */
    .hits-arrow {
      flex-shrink: 0;
      width: 42px; height: 42px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(20,20,20,0.80);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      color: rgba(255,255,255,0.55);
      box-shadow: 0 2px 12px rgba(0,0,0,0.35);
      transition: border-color 200ms ease, color 200ms ease, background 200ms ease,
                  box-shadow 200ms ease, transform 150ms ease;
      z-index: 5;
      outline: none;
    }
    .hits-arrow:hover {
      border-color: rgba(232,35,42,0.55);
      color: #E8232A;
      background: rgba(232,35,42,0.08);
      box-shadow: 0 0 0 1px rgba(232,35,42,0.18), 0 4px 16px rgba(232,35,42,0.15);
      transform: scale(1.07);
    }
    .hits-arrow:active  { transform: scale(0.96); }
    .hits-arrow:focus-visible {
      outline: 2px solid rgba(232,35,42,0.6);
      outline-offset: 2px;
    }
    .hits-arrow-left  { margin-right: 12px; }
    .hits-arrow-right { margin-left: 12px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hits-mobile-track { scroll-behavior: auto; }
    .hits-dot { transition: none; }
  }
`;

let _hitsStyleInjected = false;

const DESKTOP_SPEED = 40;    // px/s
const ARROW_SCROLL_MS = 480; // ms

function HitsSection({ hits }: { hits: import('../data/products').Product[] }) {
  // ── mobile refs ──
  const mobileTrackRef   = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const mobileAutoRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mobileUserRef    = useRef(false);   // true while user is touching/scrolling
  const mobileResumeRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobilePageRef    = useRef(0);       // current page index (avoids stale closure)
  const mobilePageCountRef = useRef(1);     // mirrors pageCount state

  // ── desktop refs ──
  const desktopWrapRef  = useRef<HTMLDivElement>(null);
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const rafRef          = useRef<number | null>(null);
  const desktopPausedRef = useRef(false);
  const posRef          = useRef(0);

  const arrowAnimRef      = useRef<number | null>(null);
  const arrowStartRef     = useRef(0);
  const arrowTargetRef    = useRef(0);
  const arrowStartTimeRef = useRef(0);

  // inject styles once
  if (!_hitsStyleInjected && typeof document !== 'undefined') {
    _hitsStyleInjected = true;
    const el = document.createElement('style');
    el.textContent = HITS_STYLES;
    document.head.appendChild(el);
  }

  // ── mobile: measure real page count ──
  const measurePages = useCallback(() => {
    const el = mobileTrackRef.current;
    if (!el) return;
    const firstSlide = el.firstElementChild as HTMLElement | null;
    if (!firstSlide || firstSlide.offsetWidth === 0) return;
    const gap = 12;
    const slideWidth = firstSlide.offsetWidth + gap;
    const scrollRange = el.scrollWidth - el.clientWidth;
    const pages = scrollRange <= 0 ? 1 : Math.round(scrollRange / slideWidth) + 1;
    mobilePageCountRef.current = pages;
    setPageCount(pages);
    // recompute current dot
    const dot = Math.min(Math.round(el.scrollLeft / slideWidth), pages - 1);
    mobilePageRef.current = dot;
    setActiveDot(dot);
  }, []);

  // ── mobile: scroll to specific page ──
  const scrollToPage = useCallback((page: number) => {
    const el = mobileTrackRef.current;
    if (!el) return;
    const firstSlide = el.firstElementChild as HTMLElement | null;
    if (!firstSlide) return;
    const slideWidth = firstSlide.offsetWidth + 12;
    el.scrollTo({ left: page * slideWidth, behavior: 'smooth' });
  }, []);

  // ── mobile: start auto-scroll interval ──
  const startAutoScroll = useCallback(() => {
    if (mobileAutoRef.current) clearInterval(mobileAutoRef.current);
    mobileAutoRef.current = setInterval(() => {
      if (mobileUserRef.current) return;
      const total = mobilePageCountRef.current;
      if (total <= 1) return;
      const next = (mobilePageRef.current + 1) % total;
      mobilePageRef.current = next;
      scrollToPage(next);
    }, 3200);
  }, [scrollToPage]);

  // ── mobile: setup on mount ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = mobileTrackRef.current;
    if (!el) return;

    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mq = window.matchMedia('(min-width: 1024px)');

    // Reset scroll position on mount to prevent refresh bug
    el.scrollLeft = 0;
    mobilePageRef.current = 0;

    // Measure after a short delay to allow layout + images to settle
    const initTimer = setTimeout(() => {
      measurePages();
      if (!rm.matches && !mq.matches) {
        startAutoScroll();
      }
    }, 120);

    // Also re-measure on resize
    const onResize = () => {
      measurePages();
    };
    window.addEventListener('resize', onResize, { passive: true });

    // Re-measure after images load
    const images = el.querySelectorAll('img');
    let loadedCount = 0;
    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount >= images.length) measurePages();
    };
    images.forEach(img => {
      if (img.complete) { loadedCount++; }
      else img.addEventListener('load', onImageLoad, { once: true });
    });
    if (loadedCount >= images.length && images.length > 0) measurePages();

    // Scroll listener — update active dot
    const onScroll = () => {
      const firstSlide = el.firstElementChild as HTMLElement | null;
      if (!firstSlide) return;
      const slideWidth = firstSlide.offsetWidth + 12;
      const pages = mobilePageCountRef.current;
      const dot = Math.min(Math.round(el.scrollLeft / slideWidth), pages - 1);
      mobilePageRef.current = dot;
      setActiveDot(dot);
    };
    el.addEventListener('scroll', onScroll, { passive: true });

    // Touch: pause auto-scroll while user interacts, resume after 3s
    const onTouchStart = () => {
      mobileUserRef.current = true;
      if (mobileResumeRef.current) clearTimeout(mobileResumeRef.current);
    };
    const onTouchEnd = () => {
      if (mobileResumeRef.current) clearTimeout(mobileResumeRef.current);
      mobileResumeRef.current = setTimeout(() => {
        mobileUserRef.current = false;
        // sync page index after manual swipe
        const firstSlide = el.firstElementChild as HTMLElement | null;
        if (firstSlide) {
          const sw = firstSlide.offsetWidth + 12;
          mobilePageRef.current = Math.min(
            Math.round(el.scrollLeft / sw),
            mobilePageCountRef.current - 1
          );
        }
      }, 3000);
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      clearTimeout(initTimer);
      if (mobileAutoRef.current) clearInterval(mobileAutoRef.current);
      if (mobileResumeRef.current) clearTimeout(mobileResumeRef.current);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits.length]);

  // ── easing ──
  const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  // ── desktop: RAF infinite scroll ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches || rm.matches) return;
    const track = desktopTrackRef.current;
    if (!track || hits.length === 0) return;

    let lastTime: number | null = null;
    const animate = (ts: number) => {
      if (!desktopPausedRef.current) {
        if (lastTime !== null) {
          const delta = ts - lastTime;
          posRef.current += (DESKTOP_SPEED * delta) / 1000;
          const halfW = track.scrollWidth / 2;
          if (posRef.current >= halfW) posRef.current -= halfW;
          track.style.transform = `translateX(-${posRef.current}px)`;
        }
        lastTime = ts;
      } else {
        lastTime = null;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [hits.length]);

  const pauseDesktop  = useCallback(() => { desktopPausedRef.current = true;  }, []);
  const resumeDesktop = useCallback(() => { desktopPausedRef.current = false; }, []);

  // ── arrow: smooth nudge ──
  const slideByArrow = useCallback((direction: 1 | -1) => {
    const track = desktopTrackRef.current;
    if (!track) return;
    if (arrowAnimRef.current) cancelAnimationFrame(arrowAnimRef.current);

    const firstChild = track.firstElementChild as HTMLElement | null;
    const slideW = firstChild ? firstChild.offsetWidth + 24 : 300;
    const halfW  = track.scrollWidth / 2;

    arrowStartRef.current     = posRef.current;
    arrowTargetRef.current    = ((posRef.current + direction * slideW) % halfW + halfW) % halfW;
    arrowStartTimeRef.current = performance.now();
    desktopPausedRef.current  = true;

    const animArrow = (ts: number) => {
      const progress = Math.min((ts - arrowStartTimeRef.current) / ARROW_SCROLL_MS, 1);
      const eased = easeInOut(progress);
      let from = arrowStartRef.current, to = arrowTargetRef.current;
      if (Math.abs(to - from) > halfW / 2) { if (to > from) from += halfW; else to += halfW; }
      let cur = ((from + (to - from) * eased) % halfW + halfW) % halfW;
      posRef.current = cur;
      track.style.transform = `translateX(-${cur}px)`;
      if (progress < 1) {
        arrowAnimRef.current = requestAnimationFrame(animArrow);
      } else {
        arrowAnimRef.current = null;
        setTimeout(() => { desktopPausedRef.current = false; }, 1200);
      }
    };
    arrowAnimRef.current = requestAnimationFrame(animArrow);
  }, []);

  const doubledHits = [...hits, ...hits];

  return (
    <section className="py-8 lg:pt-10 lg:pb-20 bg-[#0F0F0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-end justify-between mb-5 lg:mb-10">
          <div>
            <span className="section-label">Найпопулярніше</span>
            <h2 className="font-unbounded text-xl lg:text-4xl font-black text-white">Хіти продажів</h2>
          </div>
        </div>

        {/* ══ MOBILE — swipe + auto-scroll, тільки оригінальні картки ══ */}
        <div className="lg:hidden" style={{ overflow: 'visible' }}>
          <div ref={mobileTrackRef} className="hits-mobile-track">
            {hits.map(p => (
              <div key={p.id} className="hits-mobile-slide">
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {/* dots — always visible, never hidden */}
          <div className="hits-dots-wrap">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                aria-label={`Слайд ${i + 1}`}
                className={`hits-dot${activeDot === i ? ' active' : ''}`}
                onClick={() => {
                  // pause user-initiated auto-scroll resume
                  mobileUserRef.current = true;
                  if (mobileResumeRef.current) clearTimeout(mobileResumeRef.current);
                  mobilePageRef.current = i;
                  scrollToPage(i);
                  mobileResumeRef.current = setTimeout(() => {
                    mobileUserRef.current = false;
                  }, 3000);
                }}
              />
            ))}
          </div>
        </div>

        {/* ══ DESKTOP — infinite RAF carousel зі стрілками ══ */}
        <div className="hidden lg:flex hits-desktop-shell">
          <button className="hits-arrow hits-arrow-left" aria-label="Попередні товари" onClick={() => slideByArrow(-1)}>
            <ChevronLeft size={20} strokeWidth={2} />
          </button>

          <div ref={desktopWrapRef} className="hits-desktop-wrap" onMouseEnter={pauseDesktop} onMouseLeave={resumeDesktop}>
            <div ref={desktopTrackRef} className="hits-desktop-track">
              {doubledHits.map((p, i) => (
                <div key={`${p.id}-${i}`} className="hits-desktop-slide">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>

          <button className="hits-arrow hits-arrow-right" aria-label="Наступні товари" onClick={() => slideByArrow(1)}>
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>

      </div>
    </section>
  );
}
