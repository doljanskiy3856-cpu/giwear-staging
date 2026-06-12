import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Minus, Plus, RotateCcw } from 'lucide-react';
import { CONTACT } from '../config/contactConfig';

// ─── fallback table ───────────────────────────────────────────────────────────
const SIZE_TABLE = [
  { size: '110', slim: '1,03–1,12m', regular: '0,99–1,08m' },
  { size: '120', slim: '1,13–1,22m', regular: '1,09–1,18m' },
  { size: '130', slim: '1,23–1,32m', regular: '1,19–1,28m' },
  { size: '140', slim: '1,33–1,42m', regular: '1,29–1,38m' },
  { size: '150', slim: '1,43–1,52m', regular: '1,39–1,48m' },
  { size: '160', slim: '1,53–1,62m', regular: '1,49–1,58m' },
  { size: '170', slim: '1,63–1,72m', regular: '1,59–1,68m' },
  { size: '180', slim: '1,73–1,82m', regular: '1,69–1,78m' },
  { size: '190', slim: '1,83–1,92m', regular: '1,79–1,88m' },
  { size: '200', slim: '1,93–2,02m', regular: '1,89–1,98m' },
];

// ─── messenger icons ──────────────────────────────────────────────────────────
function TgIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}
function VbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 2C8.832 2 3 7.477 3 14.184c0 3.697 1.656 7.026 4.32 9.369V28l4.03-2.215A14.2 14.2 0 0 0 16 26.367c7.168 0 13-5.477 13-12.183C29 7.477 23.168 2 16 2zm1.248 16.37c-.488.522-1.09.784-1.8.784-.406 0-.87-.118-1.392-.352-.93-.41-1.844-1.008-2.744-1.797-.9-.79-1.65-1.65-2.248-2.58-.6-.93-.998-1.822-1.196-2.674-.13-.566-.11-1.074.06-1.525.17-.45.47-.82.9-1.106l.978-.63c.244-.157.494-.117.65.1l1.49 2.062c.156.216.118.48-.09.672l-.644.57a.47.47 0 0 0-.114.566c.27.634.67 1.26 1.2 1.877.53.616 1.11 1.12 1.74 1.51a.47.47 0 0 0 .578-.08l.617-.69c.183-.205.448-.238.665-.08l2.01 1.44c.217.155.26.41.1.654l-.56.879zm1.254-5.02a.498.498 0 0 1-.498-.468 3.21 3.21 0 0 0-.874-2.02 3.21 3.21 0 0 0-2.02-.874.498.498 0 0 1-.47-.525.5.5 0 0 1 .526-.47 4.208 4.208 0 0 1 2.652 1.15 4.21 4.21 0 0 1 1.15 2.653.498.498 0 0 1-.466.554zm2.374.176a.499.499 0 0 1-.496-.456 5.785 5.785 0 0 0-1.558-3.567 5.785 5.785 0 0 0-3.567-1.558.499.499 0 0 1-.456-.538.5.5 0 0 1 .538-.458 6.782 6.782 0 0 1 4.181 1.827 6.782 6.782 0 0 1 1.827 4.181.499.499 0 0 1-.469.57z"/>
    </svg>
  );
}
function WaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  );
}

// ─── help block (compact) ─────────────────────────────────────────────────────
const MESSENGERS = [
  { key: 'tg', label: 'Telegram', url: CONTACT.telegram, icon: <TgIcon />, color: '#2AABEE' },
  { key: 'vb', label: 'Viber',    url: CONTACT.viber,    icon: <VbIcon />, color: '#9B6FD4' },
  { key: 'wa', label: 'WhatsApp', url: CONTACT.whatsapp, icon: <WaIcon />, color: '#25D366' },
].filter(m => !!m.url);

function HelpBlock() {
  if (MESSENGERS.length === 0) return null;
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.03)',
      flexShrink: 0,
    }}>
      <p style={{ margin: 0, color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
        Не впевнені з розміром?
      </p>
      <p style={{ margin: '3px 0 8px', color: '#686868', fontSize: 11, lineHeight: 1.4 }}>
        Напишіть менеджеру — допоможемо підібрати за зростом, вагою і моделлю.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {MESSENGERS.map(m => (
          <a
            key={m.key}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 7,
              border: `1px solid ${m.color}28`,
              background: `${m.color}0d`,
              color: m.color,
              fontSize: 11,
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${m.color}1f`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${m.color}0d`)}
          >
            {m.icon}{m.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ZoomableImage
//
//  DESKTOP:
//    - Image fits container via CSS (object-fit: contain, height: 100%)
//    - Zoom via +/− buttons or mouse wheel (Ctrl+wheel)
//    - Pan via click-and-drag when scale > 1
//    - Transform applied via CSS transform on <img>
//    - overflow: hidden on wrap, pan constrained to image bounds
//
//  MOBILE:
//    - Image full-width, natural height
//    - Pinch = zoom, 1-finger-while-zoomed = pan
//    - scale=1 → 1-finger scrolls the modal body (no preventDefault)
//
//  All imperative state in live.current — no setState during pointer/touch events.
// ─────────────────────────────────────────────────────────────────────────────
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function ZoomableImage({
  src, alt, scrollContainerRef,
}: {
  src: string;
  alt: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const imgRef  = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scaleState, setScaleState] = useState(1);

  const live = useRef({
    scale: 1, ox: 0, oy: 0,
    // touch
    pinching: false, initDist: 0, initScale: 1,
    initOx: 0, initOy: 0, midX: 0, midY: 0,
    touchPanning: false, panStartX: 0, panStartY: 0, panInitOx: 0, panInitOy: 0,
    // mouse
    mouseDragging: false, mouseStartX: 0, mouseStartY: 0, mouseInitOx: 0, mouseInitOy: 0,
  });

  // ── apply CSS transform ───────────────────────────────────────────────────
  const applyTransform = useCallback((s: number, ox: number, oy: number) => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = `scale(${s}) translate(${ox / s}px, ${oy / s}px)`;
    img.style.cursor = s > 1.01 ? (live.current.mouseDragging ? 'grabbing' : 'grab') : 'default';
  }, []);

  // ── clamp pan so image never shows empty space ────────────────────────────
  const clamp = useCallback((ox: number, oy: number, s: number) => {
    const img = imgRef.current;
    if (!img) return { x: ox, y: oy };
    const maxX = Math.max(0, (img.clientWidth  * (s - 1)) / 2);
    const maxY = Math.max(0, (img.clientHeight * (s - 1)) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) };
  }, []);

  // ── reset to scale 1, centered ────────────────────────────────────────────
  const reset = useCallback(() => {
    const lv = live.current;
    lv.scale = 1; lv.ox = 0; lv.oy = 0;
    lv.mouseDragging = false;
    applyTransform(1, 0, 0);
    setScaleState(1);
    if (scrollContainerRef?.current) scrollContainerRef.current.scrollTop = 0;
  }, [applyTransform, scrollContainerRef]);

  // ── zoom step (buttons + wheel) ───────────────────────────────────────────
  const zoomBy = useCallback((delta: number, pivotX = 0, pivotY = 0) => {
    const lv = live.current;
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lv.scale + delta));
    if (next <= MIN_SCALE) { reset(); return; }
    // zoom toward pivot point
    const sd = next / lv.scale;
    const c = clamp(pivotX + (lv.ox - pivotX) * sd, pivotY + (lv.oy - pivotY) * sd, next);
    lv.scale = next; lv.ox = c.x; lv.oy = c.y;
    applyTransform(next, c.x, c.y);
    setScaleState(next);
  }, [reset, clamp, applyTransform]);

  // ── MOUSE events (desktop only) ───────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // detect touch device — skip mouse listeners on touch
    const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

    function onMouseDown(e: MouseEvent) {
      if (isTouchDevice()) return;
      const lv = live.current;
      if (lv.scale <= 1.01) return; // scale=1 → no drag
      e.preventDefault();
      lv.mouseDragging = true;
      lv.mouseStartX = e.clientX; lv.mouseStartY = e.clientY;
      lv.mouseInitOx = lv.ox; lv.mouseInitOy = lv.oy;
      applyTransform(lv.scale, lv.ox, lv.oy); // update cursor to grabbing
    }

    function onMouseMove(e: MouseEvent) {
      if (isTouchDevice()) return;
      const lv = live.current;
      if (!lv.mouseDragging) return;
      e.preventDefault();
      const c = clamp(
        lv.mouseInitOx + e.clientX - lv.mouseStartX,
        lv.mouseInitOy + e.clientY - lv.mouseStartY,
        lv.scale,
      );
      lv.ox = c.x; lv.oy = c.y;
      applyTransform(lv.scale, c.x, c.y);
    }

    function onMouseUp() {
      if (isTouchDevice()) return;
      const lv = live.current;
      if (!lv.mouseDragging) return;
      lv.mouseDragging = false;
      applyTransform(lv.scale, lv.ox, lv.oy); // cursor back to grab
    }

    function onWheel(e: WheelEvent) {
      if (isTouchDevice()) return;
      const lv = live.current;
      // Plain wheel at scale=1 → let modal scroll naturally (don't block)
      // Plain wheel at scale>1 OR any Ctrl+wheel → zoom
      if (lv.scale <= 1.01 && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const img = imgRef.current;
      if (!img) return;
      // pivot = mouse cursor position relative to image center
      const r = img.getBoundingClientRect();
      const pivotX = e.clientX - r.left - r.width  / 2;
      const pivotY = e.clientY - r.top  - r.height / 2;
      // Normalize delta across different devices/browsers
      const rawDelta = e.deltaMode === 1 ? e.deltaY * 24 : // line mode
                       e.deltaMode === 2 ? e.deltaY * 400 : // page mode
                       e.deltaY; // pixel mode
      const step = Math.min(0.5, Math.abs(rawDelta) * 0.003); // 0.05–0.5 per event
      const delta = rawDelta > 0 ? -step : step;
      zoomBy(delta, pivotX, pivotY);
    }

    wrap.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    wrap.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      wrap.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      wrap.removeEventListener('wheel', onWheel);
    };
  }, [applyTransform, clamp, zoomBy]);

  // ── TOUCH events (mobile) ─────────────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const dist = (t: TouchList) =>
      Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
    const mid = (t: TouchList, r: DOMRect) => ({
      x: (t[0].clientX + t[1].clientX) / 2 - r.left - r.width  / 2,
      y: (t[0].clientY + t[1].clientY) / 2 - r.top  - r.height / 2,
    });

    function onStart(e: TouchEvent) {
      const lv = live.current;
      if (e.touches.length === 2) {
        e.preventDefault();
        lv.pinching = true; lv.touchPanning = false;
        lv.initDist = dist(e.touches); lv.initScale = lv.scale;
        lv.initOx = lv.ox; lv.initOy = lv.oy;
        const img = imgRef.current; if (!img) return;
        const mp = mid(e.touches, img.getBoundingClientRect());
        lv.midX = mp.x; lv.midY = mp.y;
      } else if (e.touches.length === 1) {
        lv.pinching = false;
        if (lv.scale > 1.01) {
          e.preventDefault();
          lv.touchPanning = true;
          lv.panStartX = e.touches[0].clientX; lv.panStartY = e.touches[0].clientY;
          lv.panInitOx = lv.ox; lv.panInitOy = lv.oy;
        } else {
          lv.touchPanning = false; // scale=1 → let modal scroll
        }
      }
    }

    function onMove(e: TouchEvent) {
      const lv = live.current;
      if (lv.pinching && e.touches.length === 2) {
        e.preventDefault();
        const d = dist(e.touches);
        const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lv.initScale * (d / lv.initDist)));
        const sd = s / lv.initScale;
        const c = clamp(lv.midX + (lv.initOx - lv.midX) * sd, lv.midY + (lv.initOy - lv.midY) * sd, s);
        lv.scale = s; lv.ox = c.x; lv.oy = c.y;
        applyTransform(s, c.x, c.y);
      } else if (lv.touchPanning && e.touches.length === 1) {
        e.preventDefault();
        const c = clamp(lv.panInitOx + e.touches[0].clientX - lv.panStartX,
                        lv.panInitOy + e.touches[0].clientY - lv.panStartY, lv.scale);
        lv.ox = c.x; lv.oy = c.y;
        applyTransform(lv.scale, c.x, c.y);
      }
    }

    function onEnd(e: TouchEvent) {
      const lv = live.current;
      if (e.touches.length === 0) {
        lv.pinching = false; lv.touchPanning = false;
        if (lv.scale < MIN_SCALE) reset(); else setScaleState(lv.scale);
      } else if (e.touches.length === 1 && lv.pinching) {
        lv.pinching = false;
        if (lv.scale > 1.01) {
          e.preventDefault();
          lv.touchPanning = true;
          lv.panStartX = e.touches[0].clientX; lv.panStartY = e.touches[0].clientY;
          lv.panInitOx = lv.ox; lv.panInitOy = lv.oy;
        }
      }
    }

    wrap.addEventListener('touchstart', onStart, { passive: false });
    wrap.addEventListener('touchmove',  onMove,  { passive: false });
    wrap.addEventListener('touchend',   onEnd,   { passive: false });
    return () => {
      wrap.removeEventListener('touchstart', onStart);
      wrap.removeEventListener('touchmove',  onMove);
      wrap.removeEventListener('touchend',   onEnd);
    };
  }, [applyTransform, clamp, reset]);

  const isZoomed = scaleState > 1.01;

  return (
    <div className="md:flex-1 md:min-h-0" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

      {/* Desktop zoom controls */}
      <div className="hidden md:flex items-center gap-1 justify-end" style={{ flexShrink: 0 }}>
        <button
          onClick={() => zoomBy(-0.5)}
          disabled={!isZoomed}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#606060] hover:text-white hover:bg-[#2a2a2a] disabled:opacity-25 disabled:cursor-default transition-colors"
          aria-label="Зменшити"
        ><Minus size={13} /></button>
        <span className="text-[#505050] text-xs w-8 text-center tabular-nums select-none">
          {Math.round(scaleState * 100)}%
        </span>
        <button
          onClick={() => zoomBy(0.5)}
          disabled={scaleState >= MAX_SCALE}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#606060] hover:text-white hover:bg-[#2a2a2a] disabled:opacity-25 disabled:cursor-default transition-colors"
          aria-label="Збільшити"
        ><Plus size={13} /></button>
        {isZoomed && (
          <button
            onClick={reset}
            className="flex items-center justify-center w-7 h-7 rounded-md text-[#606060] hover:text-white hover:bg-[#2a2a2a] transition-colors"
            aria-label="Скинути"
          ><RotateCcw size={13} /></button>
        )}
        {isZoomed && (
          <span className="text-[#3a3a3a] text-[10px] ml-1 select-none hidden lg:block">
            drag to pan · scroll to zoom
          </span>
        )}
      </div>

      {/*
        Image wrap.
        DESKTOP: flex:1 min-h-0, overflow:hidden, drag-to-pan.
                 img: h-full w-auto object-contain, transform for zoom+pan.
        MOBILE:  auto height, full width, touch pinch/pan.
      */}
      <div
        ref={wrapRef}
        className="md:flex-1 md:min-h-0"
        style={{
          overflow: 'hidden',
          borderRadius: 8,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overscrollBehavior: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          className="w-full h-auto md:h-full md:w-auto"
          style={{
            display: 'block',
            maxWidth: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            transformOrigin: 'center center',
            transform: 'scale(1) translate(0px, 0px)',
            cursor: 'default',
          }}
        />
      </div>

      {/* Zoom hint — mobile only */}
      {!isZoomed && (
        <p className="md:hidden text-center select-none"
          style={{
            margin: '9px 0 12px',
            fontSize: 12,
            color: 'rgba(255,255,255,0.48)',
            lineHeight: 1.4,
          }}>
          Зведіть два пальці, щоб наблизити
        </p>
      )}
    </div>
  );
}

// ─── tab inference ────────────────────────────────────────────────────────────
const TAB_RULES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /Judojacke|jacket|куртка/i, label: 'Куртка' },
  { pattern: /Judo-Pant|pant|штани/i,   label: 'Штани'  },
];
function inferLabel(url: string, i: number) {
  for (const r of TAB_RULES) if (r.pattern.test(url)) return r.label;
  return `Сітка ${i + 1}`;
}
interface ChartTab { label: string; url: string; }
const buildTabs = (imgs: string[]): ChartTab[] => imgs.map((url, i) => ({ label: inferLabel(url, i), url }));

// ─── icons ────────────────────────────────────────────────────────────────────
function IconJacket() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 2 L2 6 L4 8 L6 6 L6 18 L14 18 L14 6 L16 8 L18 6 L13 2"/>
      <path d="M7 2 Q10 4 13 2"/>
    </svg>
  );
}
function IconPants() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2 L16 2 L14 12 L11 18 L10 14 L9 18 L6 12 Z"/>
    </svg>
  );
}
const TAB_ICONS: Record<string, JSX.Element> = { 'Куртка': <IconJacket />, 'Штани': <IconPants /> };

// ─── segmented control ────────────────────────────────────────────────────────
function SegmentedControl({ tabs, active, onChange }: {
  tabs: ChartTab[]; active: number; onChange: (i: number) => void;
}) {
  return (
    <div role="tablist" style={{
      display: 'flex', gap: 3, padding: 4, borderRadius: 12,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
      alignSelf: 'flex-start',
    }}>
      {tabs.map((tab, i) => {
        const on = active === i;
        return (
          <button key={tab.label} role="tab" aria-selected={on} onClick={() => onChange(i)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 16px', borderRadius: 9,
              border: on ? '1px solid rgba(220,38,38,0.45)' : '1px solid transparent',
              fontSize: 13, fontWeight: on ? 600 : 500,
              fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.01em',
              color: on ? '#fff' : 'rgba(255,255,255,0.72)',
              background: on ? 'linear-gradient(135deg,#282828,#1e1e1e)' : 'transparent',
              boxShadow: on ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'background 0.17s, color 0.17s, border-color 0.17s',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => { if (!on) e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { if (!on) e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; }}
          >
            {TAB_ICONS[tab.label] && (
              <span style={{ opacity: on ? 1 : 0.65, display: 'flex' }}>{TAB_ICONS[tab.label]}</span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── cap size content ─────────────────────────────────────────────────────────
function CapSizeContent() {
  return (
    <div style={{ padding: '20px 4px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        padding: '16px 18px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.4, fontFamily: 'Inter, sans-serif' }}>
          Розмір кепки: Universal (One Size)
        </p>
        <p style={{ margin: '8px 0 0', color: '#A0A0A0', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
          Кепка має універсальний розмір і регулюється ззаду за допомогою застібки.
          Підійде більшості дорослих та підлітків.
        </p>
      </div>
      <div style={{
        padding: '12px 18px',
        borderRadius: 10,
        background: 'rgba(232,35,42,0.05)',
        border: '1px solid rgba(232,35,42,0.15)',
      }}>
        <p style={{ margin: 0, color: '#E8232A', fontSize: 12, fontWeight: 600, lineHeight: 1.4, fontFamily: 'Inter, sans-serif' }}>
          Потрібна додаткова інформація?
        </p>
        <p style={{ margin: '4px 0 0', color: '#A0A0A0', fontSize: 12, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
          Напишіть менеджеру — допоможемо з вибором.
        </p>
      </div>
    </div>
  );
}

// ─── sauna suit size content ──────────────────────────────────────────────────
function SaunaSuitSizeContent() {
  return (
    <div style={{ padding: '20px 4px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        padding: '16px 18px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.4, fontFamily: 'Inter, sans-serif' }}>
          Розмір костюма-сауни
        </p>
        <p style={{ margin: '10px 0 0', color: '#A0A0A0', fontSize: 13, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          Костюм має стандартну розмірну сітку для спортивного одягу та вільну посадку для тренувань. Обирайте свій звичний розмір.
        </p>
        <p style={{ margin: '8px 0 0', color: '#A0A0A0', fontSize: 13, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          Якщо вага або зріст між двома розмірами — напишіть менеджеру GIWEAR, підкажемо оптимальний варіант за вашими параметрами.
        </p>
      </div>
    </div>
  );
}

// ─── props ────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  chartImages: string[];
  fallbackTable: boolean;
  /** When true, renders cap-specific size info instead of kimono chart */
  isCap?: boolean;
  /** When true, renders sauna suit size info instead of kimono chart */
  isSaunaSuit?: boolean;
}

// ─── modal ────────────────────────────────────────────────────────────────────
export default function SizeChartModal({ open, onClose, chartImages, fallbackTable, isCap, isSaunaSuit }: Props) {
  const tabs = buildTabs(chartImages);
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setActiveTab(0); if (scrollRef.current) scrollRef.current.scrollTop = 0; }
  }, [open, chartImages]);

  const handleTabChange = useCallback((i: number) => {
    setActiveTab(i);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('size-modal-open');
    return () => { document.body.style.overflow = prev; document.body.classList.remove('size-modal-open'); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const multiTab = tabs.length > 1;
  const hasChart = chartImages.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/*
        SIZING STRATEGY
        ───────────────
        Desktop:
          - height: 88vh + explicit height so flex children can use flex:1
          - body div: flex:1 min-h-0 overflow-y:auto
          - ZoomableImage inner wrap: flex:1 min-h-0 → image fills height, object-fit:contain
          → image fills the modal, no empty space, no cropping

        Mobile:
          - height: auto, max-height: 90svh → sheet grows to content, scrolls if needed
          - body div: overflow-y:auto, touch-action:pan-y
          - ZoomableImage: full-width natural height, no height constraint
          → compact sheet, help block visible near bottom of image
      */}
      <div
        className="w-full md:max-w-[920px] md:mx-auto md:rounded-2xl rounded-t-2xl bg-[#141414] border border-[#2E2E2E] flex flex-col md:h-[88svh]"
        style={{
          // Mobile: auto height, capped at 90svh
          maxHeight: '90svh',
          overflow: 'hidden',
          overscrollBehavior: 'contain',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-[#2E2E2E]"
          style={{ flexShrink: 0, background: '#141414' }}
        >
          <h3 className="font-inter text-white font-semibold text-base">
            {isCap ? 'Розмір кепки' : isSaunaSuit ? 'Розмір костюма-сауни' : 'Таблиця розмірів'}
          </h3>
          <button onClick={onClose}
            className="text-[#606060] hover:text-white transition-colors p-1.5 -mr-1 rounded-lg hover:bg-[#252525]"
            aria-label="Закрити"><X size={18} /></button>
        </div>

        {/* Tabs */}
        {!isCap && !isSaunaSuit && multiTab && (
          <div className="px-4 pt-3 pb-2.5 border-b border-[#1e1e1e]"
            style={{ flexShrink: 0, background: '#141414' }}>
            <SegmentedControl tabs={tabs} active={activeTab} onChange={handleTabChange} />
          </div>
        )}

        {/*
          Scrollable body.
          flex:1 min-h-0 → on desktop fills remaining 88vh space.
          On mobile height:auto sheet → this div is also auto-height, grows with content.
          overflow-y:auto → scroll when content > available space.
          touch-action:pan-y → native scroll when image not zoomed.
        */}
        <div
          ref={scrollRef}
          className="md:flex-1 md:min-h-0"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '12px 12px',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Cap size info */}
          {isCap && <CapSizeContent />}

          {/* Sauna suit size info */}
          {isSaunaSuit && <SaunaSuitSizeContent />}

          {/* Chart image */}
          {!isCap && !isSaunaSuit && hasChart && (
            <ZoomableImage
              key={activeTab}
              src={tabs[activeTab]?.url ?? chartImages[0]}
              alt={tabs[activeTab]?.label ?? 'Таблиця розмірів'}
              scrollContainerRef={scrollRef}
            />
          )}

          {/* Fallback HTML table */}
          {!isCap && !isSaunaSuit && !hasChart && fallbackTable && (
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full text-xs font-inter border-collapse" style={{ minWidth: 280 }}>
                <thead>
                  <tr className="bg-[#242424]">
                    <th className="text-left text-white font-bold py-2.5 px-3 border border-[#2E2E2E]">Розмір</th>
                    <th className="text-left text-white font-bold py-2.5 px-3 border border-[#2E2E2E]">Зріст (худорлява)</th>
                    <th className="text-left text-white font-bold py-2.5 px-3 border border-[#2E2E2E]">Зріст (середня)</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_TABLE.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? 'bg-[#0F0F0F]' : 'bg-[#1A1A1A]'}>
                      <td className="text-white font-bold py-2.5 px-3 border border-[#2E2E2E]">{row.size}</td>
                      <td className="text-[#A0A0A0] py-2.5 px-3 border border-[#2E2E2E]">{row.slim}</td>
                      <td className="text-[#A0A0A0] py-2.5 px-3 border border-[#2E2E2E]">{row.regular}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Help block — always right after content */}
          <HelpBlock />
        </div>
      </div>
    </div>
  );
}
