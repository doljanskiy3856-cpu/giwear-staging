import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { useCart } from '../context/CartContext';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { CONTACT } from '../config/contactConfig';

// ─── config ──────────────────────────────────────────────────────────────────
const PHONE_DISPLAY = CONTACT.phoneDisplay;
const TG_URL        = CONTACT.telegram;
const VB_URL        = CONTACT.viber;
const WA_URL        = CONTACT.whatsapp;
const TEL_URL       = CONTACT.tel;

// ─── icons ────────────────────────────────────────────────────────────────────
function TgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function VbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 2C8.832 2 3 7.477 3 14.184c0 3.697 1.656 7.026 4.32 9.369V28l4.03-2.215A14.2 14.2 0 0 0 16 26.367c7.168 0 13-5.477 13-12.183C29 7.477 23.168 2 16 2zm1.248 16.37c-.488.522-1.09.784-1.8.784-.406 0-.87-.118-1.392-.352-.93-.41-1.844-1.008-2.744-1.797-.9-.79-1.65-1.65-2.248-2.58-.6-.93-.998-1.822-1.196-2.674-.13-.566-.11-1.074.06-1.525.17-.45.47-.82.9-1.106l.978-.63c.244-.157.494-.117.65.1l1.49 2.062c.156.216.118.48-.09.672l-.644.57a.47.47 0 0 0-.114.566c.27.634.67 1.26 1.2 1.877.53.616 1.11 1.12 1.74 1.51a.47.47 0 0 0 .578-.08l.617-.69c.183-.205.448-.238.665-.08l2.01 1.44c.217.155.26.41.1.654l-.56.879zm1.254-5.02a.498.498 0 0 1-.498-.468 3.21 3.21 0 0 0-.874-2.02 3.21 3.21 0 0 0-2.02-.874.498.498 0 0 1-.47-.525.5.5 0 0 1 .526-.47 4.208 4.208 0 0 1 2.652 1.15 4.21 4.21 0 0 1 1.15 2.653.498.498 0 0 1-.466.554zm2.374.176a.499.499 0 0 1-.496-.456 5.785 5.785 0 0 0-1.558-3.567 5.785 5.785 0 0 0-3.567-1.558.499.499 0 0 1-.456-.538.5.5 0 0 1 .538-.458 6.782 6.782 0 0 1 4.181 1.827 6.782 6.782 0 0 1 1.827 4.181.499.499 0 0 1-.469.57z"/>
    </svg>
  );
}

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

// ─── menu items config ────────────────────────────────────────────────────────
const ITEMS = [
  {
    href:    TG_URL,
    label:   'Telegram',
    icon:    <TgIcon />,
    color:   '#2AABEE',
    hoverBg: 'rgba(42,171,238,0.10)',
    external: true,
  },
  {
    href:    VB_URL,
    label:   'Viber',
    icon:    <VbIcon />,
    color:   '#9B6FD4',
    hoverBg: 'rgba(155,111,212,0.10)',
    external: false,
  },
  {
    href:    WA_URL,
    label:   'WhatsApp',
    icon:    <WaIcon />,
    color:   '#25D366',
    hoverBg: 'rgba(37,211,102,0.10)',
    external: true,
  },
  {
    href:    TEL_URL,
    label:   'Зателефонувати',
    icon:    <PhoneIcon />,
    color:   '#E8232A',
    hoverBg: 'rgba(232,35,42,0.08)',
    external: false,
  },
] as const;

// ─── component ───────────────────────────────────────────────────────────────
export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const { menuOpen } = useMenu();
  const { isOpen: cartOpen } = useCart();
  const isDesktop = useIsDesktop();

  // track body class 'size-modal-open' set by SizeChartModal
  useEffect(() => {
    const check = () => setSizeModalOpen(document.body.classList.contains('size-modal-open'));
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // close on scroll
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [open]);

  // close chat panel when mobile menu opens
  useEffect(() => {
    if (menuOpen) setOpen(false);
  }, [menuOpen]);

  // close chat panel when cart opens on mobile
  useEffect(() => {
    if (cartOpen && !isDesktop) setOpen(false);
  }, [cartOpen, isDesktop]);

  // hide entire FAB when mobile menu is open
  if (menuOpen) return null;

  // hide FAB when cart is open on mobile
  if (cartOpen && !isDesktop) return null;

  // hide FAB when size chart modal is open (any device)
  if (sizeModalOpen) return null;

  return (
    <>
      {/* backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* wrapper — fixed bottom-right */}
      <div
        className="fixed z-50"
        style={{
          right:  'max(18px, calc(env(safe-area-inset-right, 0px) + 18px))',
          bottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
        }}
      >
        {/* ── glass menu panel ── */}
        <div
          aria-hidden={!open}
          style={{
            position:       'absolute',
            bottom:         'calc(100% + 12px)',
            right:          '0',
            width:          '172px',
            padding:        '6px',
            borderRadius:   '18px',
            background:     'rgba(14, 14, 18, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border:         '1px solid rgba(255,255,255,0.08)',
            boxShadow:      '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset',
            // animation
            opacity:        open ? 1 : 0,
            transform:      open ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)',
            transformOrigin: 'bottom right',
            transition:     'opacity 0.22s ease, transform 0.22s ease',
            pointerEvents:  open ? 'auto' : 'none',
          }}
        >
          {ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="fc-menu-item"
              style={{ '--item-color': item.color, '--item-hover-bg': item.hoverBg } as React.CSSProperties}
            >
              {/* icon container */}
              <span
                className="fc-menu-icon"
                style={{ color: item.color }}
              >
                {item.icon}
              </span>
              {/* label */}
              <span className="fc-menu-label">{item.label}</span>
            </a>
          ))}
        </div>

        {/* ── FAB ── */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Закрити' : "Зв'язатись з нами"}
          aria-expanded={open}
          style={{
            width:          '48px',
            height:         '48px',
            borderRadius:   '50%',
            border:         'none',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          '#fff',
            background:     open ? '#232323' : '#E8232A',
            transform:      open ? 'rotate(135deg)' : 'rotate(0deg)',
            transition:     'background 0.3s ease, transform 0.3s ease',
            boxShadow:      open
              ? '0 4px 16px rgba(0,0,0,0.4)'
              : '0 4px 20px rgba(232,35,42,0.45)',
          }}
          className={open ? '' : 'floating-contact-pulse'}
        >
          {open
            ? <X size={18} style={{ transition: 'none' }} />
            : <ChatIcon />
          }
        </button>
      </div>

      {/* ── scoped styles ── */}
      <style>{`
        .fc-menu-item {
          display:        flex;
          align-items:    center;
          gap:            11px;
          width:          100%;
          padding:        8px 10px;
          border-radius:  12px;
          border:         none;
          background:     transparent;
          color:          rgba(255,255,255,0.90);
          font-family:    Inter, system-ui, sans-serif;
          font-size:      13.5px;
          font-weight:    500;
          letter-spacing: 0.01em;
          text-decoration: none;
          cursor:         pointer;
          transition:     background 0.18s ease, color 0.18s ease;
          user-select:    none;
          -webkit-tap-highlight-color: transparent;
          min-height:     44px;
        }
        .fc-menu-item:hover,
        .fc-menu-item:focus-visible {
          background: var(--item-hover-bg);
          color:      #fff;
          outline:    none;
        }
        .fc-menu-item:active {
          background: var(--item-hover-bg);
          transform:  scale(0.97);
        }
        .fc-menu-icon {
          display:         flex;
          align-items:     center;
          justify-content: center;
          flex-shrink:     0;
          width:           26px;
          height:          26px;
          border-radius:   8px;
          background:      rgba(255,255,255,0.06);
        }
        .fc-menu-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* divider between items */
        .fc-menu-item + .fc-menu-item {
          margin-top: 2px;
        }
      `}</style>
    </>
  );
}
