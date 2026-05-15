/**
 * ============================================================
 * limpiarJerga — Purga de siglas financieras en textos UI
 *
 * Reemplaza siglas técnicas por términos en español comprensibles
 * para el cliente final.
 * ============================================================
 */

const REEMPLAZOS: [RegExp, string][] = [
  // Siglas de ciclos y métricas operativas
  [/\bDPO\b/g, 'Dias de Pago'],
  [/\bDSO\b/g, 'Dias de Cobro'],
  [/\bDOH\b/g, 'Dias de Inventario'],
  [/\bKTNO\b/g, 'Capital de Trabajo'],
  [/\bCCC\b/g, 'Ciclo de Efectivo'],
  [/\bCCC\b/gi, 'Ciclo de Efectivo'],

  // Siglas de costo de capital
  [/\bKd\b/g, 'Costo de Deuda'],
  [/\bKe\b/g, 'Costo de Capital'],
  [/\bWACC\b/g, 'Costo de Capital Promedio'],

  // Siglas de métricas de valor
  [/\bROIC\b/g, 'Retorno sobre Inversion'],
  [/\bEVA\b/g, 'Valor Economico Agregado'],
  [/\bNOPAT\b/g, 'Utilidad Operativa neta de Impuestos'],
  [/\bEBIT\b/g, 'Utilidad Operativa'],
  [/\bEBITDA\b/g, 'Utilidad antes de Impuestos y Depreciacion'],

  // Siglas misceláneas
  [/\bCOGS\b/g, 'Costo de Ventas'],
  [/\bOPEX\b/gi, 'Gastos de Operacion'],
  [/\bCAPEX\b/gi, 'Inversion en Activos'],
  [/\bPE\b/g, 'Punto de Equilibrio'],
  [/\bROA\b/g, 'Rendimiento sobre Activos'],
  [/\bROE\b/g, 'Rendimiento sobre Capital'],

  // Términos en inglés comunes
  [/\bspread\b/gi, 'diferencial'],
  [/\bbenchmark\b/gi, 'referencia del sector'],
  [/\bBenchmark\b/g, 'Referencia del sector'],
];

/**
 * Limpia todas las siglas financieras de un texto,
 * reemplazándolas por términos en español.
 */
export function limpiarJerga(texto: string | null | undefined): string {
  if (!texto) return '';
  let limpio = texto;
  for (const [regex, reemplazo] of REEMPLAZOS) {
    limpio = limpio.replace(regex, reemplazo);
  }
  return limpio;
}

/**
 * Limpia jerga en un nombre de meta (casos especiales).
 * Algunas metas tienen siglas en el título que deben traducirse.
 */
export function limpiarNombreMeta(nombre: string | null | undefined): string {
  if (!nombre) return 'Estrategia';
  return limpiarJerga(nombre);
}
