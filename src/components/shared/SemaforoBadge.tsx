import { getColorSet } from '@/hooks/useClasificacionColor';
import type { ClasificacionVAR } from '@/types/motor';

interface SemaforoBadgeProps {
  clasificacion: ClasificacionVAR | string;
  label?: string;
  size?: 'sm' | 'md';
}

export default function SemaforoBadge({ clasificacion, label, size = 'sm' }: SemaforoBadgeProps) {
  const colors = getColorSet(clasificacion);
  const text = label || (clasificacion === 'verde' ? 'Verde' : clasificacion === 'amarillo' ? 'Amarillo' : clasificacion === 'rojo' ? 'Rojo' : 'N/A');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width: size === 'sm' ? 6 : 8,
          height: size === 'sm' ? 6 : 8,
          backgroundColor: colors.dot,
        }}
      />
      {text}
    </span>
  );
}
