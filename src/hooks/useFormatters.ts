import { useCallback } from 'react';
import { fmtMoney, fmtPct, fmtX, fmtDias } from '@/engine/motorAdapter';

/**
 * Hook de formateo — envuelve las utilidades del motor
 * para uso reactivo en componentes React
 */
export function useFormatters() {
  const fmt = useCallback((n: number | null | undefined, d?: number) => fmtMoney(n, d), []);
  const pct = useCallback((n: number | null | undefined, d?: number) => fmtPct(n, d), []);
  const x = useCallback((n: number | null | undefined, d?: number) => fmtX(n, d), []);
  const dias = useCallback((n: number | null | undefined) => fmtDias(n), []);

  const compactNumber = useCallback((n: number | null | undefined): string => {
    if (n === null || n === undefined || isNaN(n)) return 'N/A';
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }, []);

  return { fmt, pct, x, dias, compactNumber };
}
