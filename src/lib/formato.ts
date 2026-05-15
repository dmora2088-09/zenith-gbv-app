/**
 * ================================================================
 * Utilidades de formateo numérico
 *
 * - formatearMiles: 2000000 → "2,000,000"
 * - desformatearMiles: "2,000,000" → 2000000
 * - formatearMilesInput: maneja la entrada del usuario, solo dígitos
 * ================================================================ */

/** Formatea un número con comas separadoras de miles (es-MX) */
export function formatearMiles(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '';
  return n.toLocaleString('es-MX', { maximumFractionDigits: 0 });
}

/** Convierte un string con comas a número */
export function desformatearMiles(s: string): number {
  const limpio = s.replace(/[^\d.-]/g, '');
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

/** Valida que un string solo contenga dígitos y comas */
export function soloDigitosYComas(s: string): string {
  return s.replace(/[^\d,]/g, '');
}

/** Para el onChange de un input: formatea la entrada del usuario */
export function mascaraMiles(valor: string): string {
  const limpio = valor.replace(/[^\d]/g, '');
  if (!limpio) return '';
  const n = parseFloat(limpio);
  if (isNaN(n)) return '';
  return n.toLocaleString('es-MX', { maximumFractionDigits: 0 });
}
