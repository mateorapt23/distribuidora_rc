import { useState, useEffect } from 'react';

/**
 * Hook para detectar si la pantalla es móvil o tablet.
 * Breakpoints:
 *   mobile  < 640px
 *   tablet  640px – 1023px
 *   desktop >= 1024px
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

export function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setBp('mobile');
      else if (w < 1024) setBp('tablet');
      else setBp('desktop');
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return {
    bp,
    isMobile: bp === 'mobile',
    isTablet: bp === 'tablet',
    isDesktop: bp === 'desktop',
    isSmall: bp === 'mobile' || bp === 'tablet',
  };
}