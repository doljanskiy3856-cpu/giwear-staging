/**
 * ImageLightbox — premium fullscreen image viewer.
 *
 * Mobile & Desktop:
 *  - Round pill arrow buttons on both sides (always visible)
 *  - Swipe left/right to navigate (doesn't conflict with arrows)
 *  - Swipe down to close (only when zoom=1)
 *  - Pinch-to-zoom + pan
 *  - Double-tap / double-click to toggle zoom
 *  - Escape / X button to close
 *  - Keyboard ←/→ arrows
 *  - Counter "1 / N" top-center
 *  - Smooth fade+scale open animation
 *  - Zoom resets on image change
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
}

const MAX_ZOOM = 3;

export default function ImageLightbox({ images, initialIndex, alt, onClose }: Props) {
  const [index, setIndex]     = useState(initialIndex);
  const [zoom, setZoom]       = useState(1);
  const [pan, setPan]         = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const imgWrapRef = useRef<HTMLDivElement>(null);

  // mouse drag
  const drag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  // touch tracking
  const tc = useRef({
    startX: 0, startY: 0,
    panOx: 0, panOy: 0,
    pinchDist: 0, pinchZoom: 1,
    isPinch: false,
    movedX: 0, movedY: 0,
    lastTap: 0,
    tapped: false,
  });

  // current zoom ref for use inside callbacks without stale closure
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  const panRef = useRef(pan);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // ── lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // Body scroll lock — use useBodyScrollLock pattern: position:fixed + restore scroll
  useEffect(() => {
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
  }, []);

  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [index]);

  // ── Block native browser pinch-zoom inside lightbox (non-passive) ─────────
  // React synthetic onTouchMove cannot call preventDefault on a passive listener.
  // We attach a native non-passive touchmove listener to the image wrapper so
  // the browser's built-in page-zoom gesture is fully suppressed inside lightbox.
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    const block = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────────
  const clamp = useCallback((ox: number, oy: number, z: number) => {
    if (z <= 1) return { x: 0, y: 0 };
    const el = imgWrapRef.current;
    if (!el) return { x: ox, y: oy };
    const maxX = (el.clientWidth  * (z - 1)) / 2;
    const maxY = (el.clientHeight * (z - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  const goNext = useCallback(() => {
    if (images.length < 2) return;
    setIndex(i => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length < 2) return;
    setIndex(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      handleClose();
      if (e.key === 'ArrowRight' && zoomRef.current <= 1) goNext();
      if (e.key === 'ArrowLeft'  && zoomRef.current <= 1) goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose, goNext, goPrev]);

  // ── mouse wheel zoom ──────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const z = zoomRef.current;
    const next = Math.max(1, Math.min(MAX_ZOOM, z - e.deltaY * 0.003));
    setZoom(next);
    if (next <= 1) setPan({ x: 0, y: 0 });
    else setPan(p => clamp(p.x, p.y, next));
  };

  // ── mouse drag ────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoomRef.current <= 1) return;
    e.preventDefault();
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: panRef.current.x, oy: panRef.current.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.active) return;
    setPan(clamp(
      drag.current.ox + e.clientX - drag.current.sx,
      drag.current.oy + e.clientY - drag.current.sy,
      zoomRef.current,
    ));
  };
  const onMouseUp = () => { drag.current.active = false; };

  // ── double-click zoom ─────────────────────────────────────────────────────
  const onDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const z = zoomRef.current;
    if (z > 1) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    const el = imgWrapRef.current;
    const pv = { x: 0, y: 0 };
    if (el) {
      const r = el.getBoundingClientRect();
      pv.x = e.clientX - r.left - r.width  / 2;
      pv.y = e.clientY - r.top  - r.height / 2;
    }
    const nz = 2;
    setZoom(nz);
    setPan(clamp(pv.x * (1 - nz), pv.y * (1 - nz), nz));
  };

  // ── touch ─────────────────────────────────────────────────────────────────
  const dist2 = (a: React.Touch, b: React.Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = tc.current;
    t.isPinch  = false;
    t.movedX   = 0;
    t.movedY   = 0;
    t.tapped   = false;

    if (e.touches.length === 2) {
      t.isPinch     = true;
      t.pinchDist   = dist2(e.touches[0], e.touches[1]);
      t.pinchZoom   = zoomRef.current;
      t.panOx       = panRef.current.x;
      t.panOy       = panRef.current.y;
      return;
    }

    t.startX = e.touches[0].clientX;
    t.startY = e.touches[0].clientY;
    t.panOx  = panRef.current.x;
    t.panOy  = panRef.current.y;

    // double-tap detection
    const now = Date.now();
    if (now - t.lastTap < 280) {
      e.preventDefault();
      const z = zoomRef.current;
      if (z > 1) { setZoom(1); setPan({ x: 0, y: 0 }); }
      else        { setZoom(2); }
      t.lastTap = 0;
    } else {
      t.lastTap = now;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = tc.current;

    if (e.touches.length === 2 || t.isPinch) {
      if (e.touches.length < 2) return;
      const d  = dist2(e.touches[0], e.touches[1]);
      const nz = Math.max(1, Math.min(MAX_ZOOM, t.pinchZoom * (d / t.pinchDist)));
      setZoom(nz);
      setPan(clamp(t.panOx, t.panOy, nz));
      return;
    }

    const dx = e.touches[0].clientX - t.startX;
    const dy = e.touches[0].clientY - t.startY;
    t.movedX = dx;
    t.movedY = dy;

    if (zoomRef.current > 1) {
      setPan(clamp(t.panOx + dx, t.panOy + dy, zoomRef.current));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = tc.current;
    if (t.isPinch) return;

    const absDx = Math.abs(t.movedX);
    const absDy = Math.abs(t.movedY);

    // only swipe gestures when zoom=1 and finger moved enough
    if (zoomRef.current <= 1) {
      // horizontal swipe → navigate
      if (absDx > 44 && absDx > absDy * 1.4) {
        if (t.movedX < 0) goNext(); else goPrev();
        return;
      }
      // swipe down → close
      if (t.movedY > 80 && absDy > absDx * 1.5) {
        handleClose();
        return;
      }
    }

    void e;
  };

  // ── render ────────────────────────────────────────────────────────────────
  const imgTransform = zoom !== 1
    ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
    : 'none';

  const arrowBtn: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(15,15,15,0.72)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    lineHeight: 0,
    transition: 'background 0.15s, border-color 0.15s',
    // keep arrows inside safe area
    margin: '0 6px',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Перегляд фото товару"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: `rgba(0,0,0,${visible ? 0.96 : 0})`,
        transition: 'background 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none',
        // safe-area for notched phones
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ── Close ── */}
      <button
        onClick={handleClose}
        aria-label="Закрити"
        style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', right: 12,
          zIndex: 30,
          width: 40, height: 40, borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(15,15,15,0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'pointer', color: '#fff', lineHeight: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: visible ? 1 : 0, transition: 'opacity 0.2s, background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#E8232A')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(15,15,15,0.72)')}
      >
        <X size={18} />
      </button>

      {/* ── Counter ── */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 30,
          background: 'rgba(15,15,15,0.65)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20, padding: '4px 13px',
          color: '#e0e0e0', fontSize: 13, fontFamily: 'Inter,sans-serif',
          opacity: visible ? 1 : 0, transition: 'opacity 0.2s',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {index + 1} / {images.length}
        </div>
      )}

      {/* ── Prev arrow ── */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Попереднє фото"
          style={{ ...arrowBtn, left: 0,
            opacity: visible ? 1 : 0, transition: 'opacity 0.2s, background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E8232A'; e.currentTarget.style.borderColor = '#E8232A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,15,15,0.72)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* ── Next arrow ── */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Наступне фото"
          style={{ ...arrowBtn, right: 0,
            opacity: visible ? 1 : 0, transition: 'opacity 0.2s, background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E8232A'; e.currentTarget.style.borderColor = '#E8232A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,15,15,0.72)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* ── Image area ── */}
      <div
        ref={imgWrapRef}
        style={{
          // arrows are 44px + 6px margin each side → 100px total padding
          width: 'calc(100% - 108px)',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          // top/bottom padding for counter & close btn
          paddingTop: 60,
          paddingBottom: 20,
          cursor: zoom > 1 ? 'grab' : 'default',
          userSelect: 'none',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* No blurred background in lightbox — clean dark bg for detail viewing */}
        {/* Main image */}
        <img
          key={index}
          src={images[index]}
          alt={alt}
          draggable={false}
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: imgTransform,
            transformOrigin: 'center center',
            transition: zoom === 1 ? 'transform 0.18s ease' : 'none',
            display: 'block',
            pointerEvents: 'none',
            // slightly larger feel
            width: '94vw',
            height: 'auto',
          }}
        />
      </div>
    </div>
  );
}
