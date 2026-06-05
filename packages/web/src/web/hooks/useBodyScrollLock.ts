import { useEffect, useRef } from 'react';

/**
 * Locks body scroll when `locked` is true.
 *
 * Uses the position:fixed trick so iOS Safari doesn't scroll the page
 * under a fixed overlay. Restores the exact scroll position on unlock.
 */
export function useBodyScrollLock(locked: boolean) {
  const scrollY = useRef(0);

  useEffect(() => {
    if (!locked) return;

    // Save current scroll position
    scrollY.current = window.scrollY;

    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top:      body.style.top,
      width:    body.style.width,
    };

    // Apply lock — position:fixed stops iOS momentum scroll bleed-through
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top      = `-${scrollY.current}px`;
    body.style.width    = '100%';

    return () => {
      // Restore original styles
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top      = prev.top;
      body.style.width    = prev.width;

      // Restore scroll position silently
      window.scrollTo({ top: scrollY.current, behavior: 'instant' as ScrollBehavior });
    };
  }, [locked]);
}
