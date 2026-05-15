import { useMemo } from 'react';
import type { ClasificacionVAR } from '@/types/motor';

/**
 * Hook de colores institucionales V/A/R
 * Mapea clasificaciones del motor a la paleta visual Zenith
 */

interface ColorSet {
  text: string;
  bg: string;
  border: string;
  badge: string;
  dot: string;
  lightBg: string;
}

const COLOR_MAP: Record<string, ColorSet> = {
  verde: {
    text: '#1B8A4F',
    bg: '#e8f5ee',
    border: 'rgba(27,138,79,0.25)',
    badge: 'bg-[#e8f5ee] text-[#1B8A4F] border-[#1B8A4F]/20',
    dot: '#1B8A4F',
    lightBg: '#f4faf6',
  },
  amarillo: {
    text: '#B0780A',
    bg: '#fdf5e4',
    border: 'rgba(176,120,10,0.25)',
    badge: 'bg-[#fdf5e4] text-[#B0780A] border-[#D4930D]/20',
    dot: '#D4930D',
    lightBg: '#fefbf4',
  },
  rojo: {
    text: '#C0392B',
    bg: '#fbe8e6',
    border: 'rgba(192,57,43,0.25)',
    badge: 'bg-[#fbe8e6] text-[#C0392B] border-[#C0392B]/20',
    dot: '#C0392B',
    lightBg: '#fdf5f4',
  },
  na: {
    text: '#9ba5b3',
    bg: '#f0f2f5',
    border: 'rgba(155,165,179,0.25)',
    badge: 'bg-[#f0f2f5] text-[#6b7a8d] border-[#9ba5b3]/20',
    dot: '#9ba5b3',
    lightBg: '#f5f6f8',
  },
};

export function useClasificacionColor(clasificacion?: ClasificacionVAR | string): ColorSet {
  return useMemo(() => {
    return COLOR_MAP[clasificacion as string] || COLOR_MAP.na;
  }, [clasificacion]);
}

export function getColorSet(clasificacion?: ClasificacionVAR | string): ColorSet {
  return COLOR_MAP[clasificacion as string] || COLOR_MAP.na;
}

/** Clasifica un score 0-100 en V/A/R */
export function scoreToClasificacion(score: number): ClasificacionVAR {
  if (score >= 75) return 'verde';
  if (score >= 50) return 'amarillo';
  if (score >= 25) return 'rojo';
  return 'rojo';
}

/** Clasifica EVA en Crea/Destruye valor */
export function evaStatus(eva: number): { label: string; clasificacion: ClasificacionVAR } {
  if (eva > 0) return { label: 'Crea Valor', clasificacion: 'verde' };
  if (eva === 0) return { label: 'Neutral', clasificacion: 'amarillo' };
  return { label: 'Destruye Valor', clasificacion: 'rojo' };
}
