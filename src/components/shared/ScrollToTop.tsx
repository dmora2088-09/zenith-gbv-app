import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';

/**
 * ================================================================
 * ScrollToTop — Solución global a nivel de enrutador
 *
 * Restaura el scroll al tope del contenedor de contenido en CADA
 * navegación. Recibe el ref del elemento con overflow-y-auto.
 *
 * Estrategia (triple protección):
 *   1. scrollTo({behavior:'instant'}) — inmediato, mata scroll residual
 *   2. requestAnimationFrame — el browser ya midió el nuevo DOM
 *   3. setTimeout(50) — respaldo para contenido asincrónico
 *
 * NOTA: En este layout (Sidebar + Contenido), window NO scrollea.
 * El scroll ocurre dentro del <main> → <div overflow-y-auto>.
 * Por eso recibimos el ref del contenedor real.
 * ================================================================
 */
interface ScrollToTopProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export default function ScrollToTop({ containerRef }: ScrollToTopProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 1. Inmediato
    el.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // 2. Post-layout
    const raf = requestAnimationFrame(() => {
      el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });

    // 3. Contenido asincrónico
    const t = setTimeout(() => {
      el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname, containerRef]);

  return null;
}
