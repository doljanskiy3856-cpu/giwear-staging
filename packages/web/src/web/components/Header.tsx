import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Menu, X, ShoppingBag, MessageCircle, Phone,
  ChevronRight, Truck, RotateCcw,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';

// ─── Nav data ─────────────────────────────────────────────────────────────────

const navLinks = [
  { href: '/category/karate',     label: 'Карате',     sub: 'Тренувальні та змагальні', thumb: '/menu-icons/cat-karate.png' },
  { href: '/category/judo',       label: 'Дзюдо',      sub: 'IJF-сертифіковані',        thumb: '/menu-icons/cat-judo.png'   },
  { href: '/category/bjj',        label: 'BJJ',         sub: 'Джиу-джитсу, Грепплінг',   thumb: '/menu-icons/cat-bjj.png'    },
  { href: '/category/children',   label: 'Дитячі',     sub: 'Від 3 до 14 років',        thumb: '/menu-icons/cat-kids.png'   },
  { href: '/category/accessories',label: 'Аксесуари',  sub: 'Пояси, захист, сумки',     thumb: '/menu-icons/cat-acc.png'    },
  { href: '/category/trainers',   label: 'Тренажери',  sub: 'Снаряди та обладнання',    thumb: '/menu-icons/cat-gym.png'    },
];

const secondaryLinks = [
  { href: '/trenery', label: 'Тренерам і клубам' },
  { href: '/dostavka', label: 'Доставка та обмін' },
  { href: '/kontakty', label: 'Контакти' },
];

// ─── Telegram icon ────────────────────────────────────────────────────────────

function TgIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function VbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 2C8.832 2 3 7.477 3 14.184c0 3.697 1.656 7.026 4.32 9.369V28l4.03-2.215A14.2 14.2 0 0 0 16 26.367c7.168 0 13-5.477 13-12.183C29 7.477 23.168 2 16 2zm1.248 16.37c-.488.522-1.09.784-1.8.784-.406 0-.87-.118-1.392-.352-.93-.41-1.844-1.008-2.744-1.797-.9-.79-1.65-1.65-2.248-2.58-.6-.93-.998-1.822-1.196-2.674-.13-.566-.11-1.074.06-1.525.17-.45.47-.82.9-1.106l.978-.63c.244-.157.494-.117.65.1l1.49 2.062c.156.216.118.48-.09.672l-.644.57a.47.47 0 0 0-.114.566c.27.634.67 1.26 1.2 1.877.53.616 1.11 1.12 1.74 1.51a.47.47 0 0 0 .578-.08l.617-.69c.183-.205.448-.238.665-.08l2.01 1.44c.217.155.26.41.1.654l-.56.879zm1.254-5.02a.498.498 0 0 1-.498-.468 3.21 3.21 0 0 0-.874-2.02 3.21 3.21 0 0 0-2.02-.874.498.498 0 0 1-.47-.525.5.5 0 0 1 .526-.47 4.208 4.208 0 0 1 2.652 1.15 4.21 4.21 0 0 1 1.15 2.653.498.498 0 0 1-.466.554zm2.374.176a.499.499 0 0 1-.496-.456 5.785 5.785 0 0 0-1.558-3.567 5.785 5.785 0 0 0-3.567-1.558.499.499 0 0 1-.456-.538.5.5 0 0 1 .538-.458 6.782 6.782 0 0 1 4.181 1.827 6.782 6.782 0 0 1 1.827 4.181.499.499 0 0 1-.469.57z"/>
    </svg>
  );
}

// ─── scoped styles ────────────────────────────────────────────────────────────

const MENU_STYLES = `
  @media (prefers-reduced-motion: reduce) {
    .gw-menu-overlay,
    .gw-menu-panel,
    .gw-nav-card,
    .gw-info-row { transition: none !important; animation: none !important; }
  }

  /* ── overlay ── */
  .gw-menu-overlay {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.22s ease;
  }
  .gw-menu-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  /* ── panel ── */
  .gw-menu-panel {
    transform: translateY(-12px);
    transition: transform 0.24s cubic-bezier(0.22,1,0.36,1);
  }
  .gw-menu-overlay.open .gw-menu-panel {
    transform: translateY(0);
  }

  /* ── section label ── */
  .gw-section-label {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    margin-bottom: 10px;
    padding-left: 2px;
  }

  /* ── nav card ── */
  .gw-nav-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
    text-decoration: none;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .gw-nav-card:hover,
  .gw-nav-card:focus-visible {
    background: rgba(255,255,255,0.055);
    border-color: rgba(255,255,255,0.1);
    outline: none;
  }
  .gw-nav-card:active {
    background: rgba(255,255,255,0.07);
  }
  .gw-nav-card.active {
    background: rgba(232,35,42,0.07);
    border-color: rgba(232,35,42,0.28);
    box-shadow: 0 0 16px rgba(232,35,42,0.08);
  }

  /* ── icon box ── */
  .gw-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: #111;
    border: 1px solid rgba(255,255,255,0.07);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .gw-icon-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    transition: opacity 0.18s ease;
    opacity: 0.78;
  }
  .gw-nav-card:hover .gw-icon-box img,
  .gw-nav-card:focus-visible .gw-icon-box img {
    opacity: 0.9;
  }
  .gw-nav-card.active .gw-icon-box {
    border-color: rgba(232,35,42,0.32);
    box-shadow: 0 0 10px rgba(232,35,42,0.1);
  }
  .gw-nav-card.active .gw-icon-box img {
    opacity: 1;
  }

  /* ── card text ── */
  .gw-card-title {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,0.88);
    line-height: 1;
    margin-bottom: 3px;
    transition: color 0.18s ease;
  }
  .gw-nav-card.active .gw-card-title {
    color: #d93030;
  }
  .gw-card-sub {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    color: rgba(255,255,255,0.28);
    line-height: 1;
  }

  /* ── chevron ── */
  .gw-chevron {
    color: rgba(255,255,255,0.15);
    flex-shrink: 0;
    transition: color 0.18s ease;
  }
  .gw-nav-card.active .gw-chevron {
    color: rgba(232,35,42,0.4);
  }

  /* ── stagger animation ── */
  @keyframes gw-card-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .gw-menu-overlay.open .gw-nav-card {
    animation: gw-card-in 0.22s ease both;
  }
  .gw-menu-overlay.open .gw-nav-card:nth-child(1) { animation-delay: 0.04s; }
  .gw-menu-overlay.open .gw-nav-card:nth-child(2) { animation-delay: 0.07s; }
  .gw-menu-overlay.open .gw-nav-card:nth-child(3) { animation-delay: 0.10s; }
  .gw-menu-overlay.open .gw-nav-card:nth-child(4) { animation-delay: 0.13s; }
  .gw-menu-overlay.open .gw-nav-card:nth-child(5) { animation-delay: 0.16s; }
  .gw-menu-overlay.open .gw-nav-card:nth-child(6) { animation-delay: 0.19s; }

  /* ── info rows ── */
  .gw-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.16s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .gw-info-row:hover,
  .gw-info-row:focus-visible {
    background: rgba(255,255,255,0.04);
    outline: none;
  }
  .gw-info-row:active {
    background: rgba(255,255,255,0.06);
  }
  .gw-info-sep {
    height: 1px;
    background: rgba(255,255,255,0.05);
    margin: 0 14px;
  }

  /* ── trust chips ── */
  .gw-trust-chip {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
  }

  /* ── messenger buttons ── */
  .gw-msg-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 46px;
    border-radius: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.82);
    text-decoration: none;
    border: 1px solid transparent;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .gw-msg-btn.tg {
    background: rgba(42,171,238,0.07);
    border-color: rgba(42,171,238,0.18);
  }
  .gw-msg-btn.tg:hover, .gw-msg-btn.tg:active {
    background: rgba(42,171,238,0.13);
    border-color: rgba(42,171,238,0.28);
    color: #fff;
  }
  .gw-msg-btn.vb {
    background: rgba(123,81,157,0.07);
    border-color: rgba(123,81,157,0.18);
  }
  .gw-msg-btn.vb:hover, .gw-msg-btn.vb:active {
    background: rgba(123,81,157,0.13);
    border-color: rgba(123,81,157,0.28);
    color: #fff;
  }
  .gw-msg-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.75;
  }
  .gw-msg-btn.tg .gw-msg-icon { color: #2AABEE; opacity: 1; }
  .gw-msg-btn.vb .gw-msg-icon { color: #9B6FD4; opacity: 1; }
`;

let _menuStyleInjected = false;
function ensureMenuStyle() {
  if (_menuStyleInjected || typeof document === 'undefined') return;
  _menuStyleInjected = true;
  const el = document.createElement('style');
  el.textContent = MENU_STYLES;
  document.head.appendChild(el);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header() {
  const { menuOpen, setMenuOpen } = useMenu();
  const [location] = useLocation();
  const { count, openCart } = useCart();

  ensureMenuStyle();

  const close = () => setMenuOpen(false);

  // lock body scroll when mobile menu open (iOS-safe: position:fixed trick)
  useEffect(() => {
    if (!menuOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top      = `-${scrollY}px`;
    body.style.width    = '100%';
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top      = prev.top;
      body.style.width    = prev.width;
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    };
  }, [menuOpen]);

  return (
    <>
      {/* ── Fixed top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-[#2E2E2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Mobile */}
          <div className="flex lg:hidden items-center justify-between h-16">
            <button
              className="text-white w-10 h-10 flex items-center justify-center"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Меню"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link href="/" onClick={close} className="flex items-center justify-center">
              <img src="/logo/giwear-logo-header.svg" alt="GIWEAR" className="h-8 w-auto object-contain max-w-[140px]" />
            </Link>
            <button
              onClick={openCart}
              className="relative flex items-center justify-center w-10 h-10"
              aria-label="Кошик"
            >
              <ShoppingBag size={22} className="text-white" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E8232A] text-white text-[10px] font-black font-inter w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>

          {/* Desktop */}
          <div className="hidden lg:flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <img src="/logo/giwear-logo-header.svg" alt="GIWEAR" className="h-[38px] w-auto object-contain max-w-[200px]" />
            </Link>
            <nav className="flex items-center gap-8">
              {navLinks.slice(0, 4).map(link => (
                <Link key={link.href} href={link.href}
                  className={`font-inter text-sm font-medium transition-colors hover:text-[#E8232A] ${location === link.href ? 'text-[#E8232A]' : 'text-[#A0A0A0]'}`}>
                  {link.label}
                </Link>
              ))}
              {secondaryLinks.slice(0, 2).map(link => (
                <Link key={link.href} href={link.href}
                  className={`font-inter text-sm font-medium transition-colors hover:text-[#E8232A] ${location === link.href ? 'text-[#E8232A]' : 'text-[#A0A0A0]'}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={openCart}
                className="relative flex items-center justify-center w-10 h-10 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#E8232A] rounded transition-all"
                aria-label="Кошик">
                <ShoppingBag size={20} className="text-white" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#E8232A] text-white text-[10px] font-black font-inter w-5 h-5 rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile fullscreen menu ── */}
      <div className={`lg:hidden fixed inset-0 z-40 gw-menu-overlay${menuOpen ? ' open' : ''}`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(6,6,8,0.97)', backdropFilter: 'blur(2px)' }}
          onClick={close}
        />

        {/* Panel */}
        <div className="absolute inset-0 flex flex-col gw-menu-panel">

          {/* Top bar */}
          <div
            className="flex items-center justify-between h-16 px-4 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button onClick={close} className="text-white w-10 h-10 flex items-center justify-center">
              <X size={20} strokeWidth={1.8} />
            </button>
            <Link href="/" onClick={close}>
              <img src="/logo/giwear-logo-header.svg" alt="GIWEAR" className="h-8 w-auto object-contain max-w-[130px]" />
            </Link>
            <button
              onClick={() => { openCart(); close(); }}
              className="relative w-10 h-10 flex items-center justify-center"
            >
              <ShoppingBag size={20} strokeWidth={1.8} className="text-white" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E8232A] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-5">

            {/* ── Catalog ── */}
            <p className="gw-section-label">Каталог</p>

            <div className="space-y-1.5 mb-7">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={`gw-nav-card${location === link.href ? ' active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="gw-icon-box">
                      <img src={link.thumb} alt="" aria-hidden="true" draggable={false} />
                    </div>
                    <div>
                      <p className="gw-card-title">{link.label}</p>
                      <p className="gw-card-sub">{link.sub}</p>
                    </div>
                  </div>
                  <ChevronRight size={15} strokeWidth={1.8} className="gw-chevron" />
                </Link>
              ))}
            </div>

            {/* ── Info ── */}
            <p className="gw-section-label">Інформація</p>

            <div
              className="mb-7 overflow-hidden"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {secondaryLinks.map((link, i) => (
                <div key={link.href}>
                  {i > 0 && <div className="gw-info-sep" />}
                  <Link href={link.href} onClick={close} className="gw-info-row">
                    <span
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.62)',
                      }}
                    >
                      {link.label}
                    </span>
                    <ChevronRight size={14} strokeWidth={1.6} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </Link>
                </div>
              ))}
            </div>

            {/* ── Trust chips ── */}
            <div className="flex gap-2.5 mb-7">
              {[
                { icon: <Truck size={13} strokeWidth={1.7} style={{ color: '#E8232A' }} />, text: 'Доставка 1–2 дні' },
                { icon: <RotateCcw size={13} strokeWidth={1.7} style={{ color: '#E8232A' }} />, text: 'Обмін розміру' },
              ].map(t => (
                <div key={t.text} className="gw-trust-chip">
                  {t.icon}
                  <span style={{ fontFamily: 'Inter, system-ui', fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                    {t.text}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Messenger buttons ── */}
            <div className="flex gap-2.5 pb-6">
              <a
                href="https://t.me/gistore_ua"
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="gw-msg-btn tg"
              >
                <span className="gw-msg-icon"><TgIcon /></span>
                Telegram
              </a>
              <a
                href="viber://chat?number=%2B380668564845"
                onClick={close}
                className="gw-msg-btn vb"
              >
                <span className="gw-msg-icon"><VbIcon /></span>
                Viber
              </a>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
