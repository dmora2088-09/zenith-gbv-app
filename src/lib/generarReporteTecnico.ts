import ExcelJS from 'exceljs';
import type { IngestaInputsPlano, DiagnosticoResult, MetaReporte } from '@/types/motor';

/**
 * ================================================================
 * Generar Reporte Técnico Excel — Inyección por coordenadas exactas
 *
 * REGLA DE ORO: Solo se escribe en celdas conocidas. Nunca se
 * sobrescribe la estructura de las hojas 1, 2 y 3.
 *
 * Hojas:
 *   1. 01_Resumen_Ejecutivo  — SOLO FÓRMULAS → NO TOCAR
 *   2. 02_Variables_Entrada  — Inyectar en C4:C32 (columna C, filas 4-32)
 *   3. 03_Motor_Calculos     — SOLO FÓRMULAS → NO TOCAR
 *   4. 04_Plan_Accion_Estrategias — Borrar filas 4+, insertar reales
 * ================================================================ */

export async function generarReporteTecnico(
  inputs: IngestaInputsPlano,
  resultados: DiagnosticoResult
): Promise<Blob> {

  /* ── 1. Cargar plantilla base ───────────────────────────────── */
  const resp = await fetch('/Plantilla_Reporte_Diagnostico_Tecnico_Zenith_GBV.xlsx');
  if (!resp.ok) throw new Error(`Plantilla no encontrada: ${resp.status}`);
  const buffer = await resp.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  /* ── 2. Helpers ─────────────────────────────────────────────── */
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ── 3. Hoja 02_Variables_Entrada — Inyección en columna C ──── */
  const ws2 = wb.getWorksheet('02_Variables_Entrada');
  if (!ws2) throw new Error('Hoja "02_Variables_Entrada" no encontrada en plantilla');

  /* ── Parámetros macroeconómicos (del motor o defaults) ─────── */
  const macro = (window as any).MotorVBM?.MACRO || {};
  const waccP = (resultados as any).wacc_params || {};

  const Rf        = waccP.Rf        ?? macro.Rf        ?? 0.085;
  const ERP       = waccP.ERP       ?? macro.ERP       ?? 0.06;
  const Beta      = waccP.Beta      ?? macro.Beta      ?? 0.95;
  const Inflacion = waccP.Inflacion ?? macro.Inflacion ?? 0.045;
  const FactorMejora = macro.FactorMejora ?? 0.10;

  /* ── Fecha y Folio ──────────────────────────────────────────── */
  const hoy = new Date();
  const folio = `ZGBV-${hoy.getFullYear()}${String(hoy.getMonth()+1).padStart(2,'0')}${String(hoy.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;

  /* ── Mapeo exacto: fila → valor ───────────────────────────────
   *
   *  NOTA: La plantilla usa "Gastos Operativos" como un solo campo
   *  (fila 9) que combina administración + ventas.
   *
   *  NOTA: Las filas 11-13 usan promedios (para DSO/DOH/DPO).
   *  Como nuestros inputs solo tienen saldos finales, usamos
   *  el saldo final como proxy del promedio.
   * ------------------------------------------------------------- */
  const inyecciones: Record<string, string | number | Date> = {
    C4 : inputs.nombre_empresa || resultados.empresa,
    C5 : hoy,
    C6 : folio,
    C7 : inputs.ventas,
    C8 : inputs.cogs,
    C9 : inputs.gastos_administracion + inputs.gastos_ventas, // Gastos Operativos combinados
    C10: inputs.depreciacion_amortizacion,
    C11: inputs.cuentas_por_cobrar,       // CxC Promedio (proxy: saldo final)
    C12: inputs.inventarios,               // Inventario Promedio (proxy: saldo final)
    C13: inputs.cuentas_por_pagar,         // CxP Promedio (proxy: saldo final)
    C14: inputs.caja_bancos,
    C15: inputs.cuentas_por_cobrar,        // Cuentas por Cobrar (saldo final)
    C16: inputs.inventarios,               // Inventarios (saldo final)
    C17: inputs.otros_activos_corrientes,
    C18: inputs.activos_fijos_netos,
    C19: inputs.cuentas_por_pagar,         // Proveedores / CxP
    C20: inputs.deuda_financiera_cp,       // Deuda Corto Plazo
    C21: inputs.deuda_financiera_lp,       // Deuda Largo Plazo
    C22: inputs.otros_pasivos_corrientes || 0,  // Otros Pasivos Operativos sin Costo
    C23: inputs.capital_social,            // Capital Contable
    C24: inputs.utilidades_retenidas,
    C25: Rf,                               // Tasa Libre de Riesgo
    C26: ERP,                              // Prima de Riesgo de Mercado
    C27: Beta,                             // Beta Sectorial
    C28: inputs.prima_pyme,                // Prima de Riesgo PyME
    C29: Inflacion,                        // Inflación Esperada
    C30: inputs.tasa_impuesto,             // Tasa ISR
    C31: inputs.Kd,                        // Tasa de Interés de la Deuda
    C32: FactorMejora,                     // Factor Mejora EVA Proyectado
  };

  /* ── Inyectar SOLO en celdas conocidas ──────────────────────── */
  for (const [celda, valor] of Object.entries(inyecciones)) {
    const cell = ws2.getCell(celda);
    cell.value = valor as ExcelJS.CellValue;
  }

  /* ═══════════════════════════════════════════════════════════════
     Hoja 01_Resumen_Ejecutivo  →  NO TOCAR (todas fórmulas)
     Hoja 03_Motor_Calculos     →  NO TOCAR (todas fórmulas)
     ═══════════════════════════════════════════════════════════════ */

  /* ═══════════════════════════════════════════════════════════════
     Hoja 04_Plan_Accion_Estrategias — Reemplazar filas de ejemplo
     ═══════════════════════════════════════════════════════════════ */
  const ws4 = wb.getWorksheet('04_Plan_Accion_Estrategias');
  if (ws4) {
    /* ── Borrar filas de ejemplo (4-11) de abajo hacia arriba ── */
    for (let r = 11; r >= 4; r--) {
      ws4.spliceRows(r, 1);
    }

    /* ── Preparar metas ordenadas por prioridad ──────────────── */
    const peso: Record<string, number> = { critica: 4, alta: 3, media: 2, baja: 1 };

    const overrides = (resultados.overrides_activos || [])
      .map((oid: string) => {
        const cat = (window as any).MotorVBM?.CATALOGO_METAS?.find((x: any) => x.id === oid);
        return cat
          ? { id: oid, nombre: cat.nombre, pilar: cat.pilar, prioridad: 'critica' as const, texto_consultor: cat.texto_consultor, texto_cliente: cat.texto_cliente, estrategias: cat.estrategias || [] }
          : null;
      })
      .filter(Boolean) as Array<{
        id: string; nombre: string; pilar: string; prioridad: string;
        texto_consultor: string; texto_cliente: string; estrategias: string[];
      }>;

    const todasMetas = [
      ...overrides,
      ...resultados.metas_activas.sort((a: MetaReporte, b: MetaReporte) => {
        const pa = peso[a.prioridad] || 0;
        const pb = peso[b.prioridad] || 0;
        if (pb !== pa) return pb - pa;
        return b.impacto_eva_calculado - a.impacto_eva_calculado;
      }),
    ];

    /* ── Insertar filas reales (addRow desde fila 4) ─────────── */
    todasMetas.forEach((meta) => {
      ws4.addRow({
        A: cap(meta.pilar),
        B: cap(meta.prioridad),
        C: meta.nombre,
        D: meta.texto_consultor,
        E: '',  // KPI de Medición — no tenemos campo directo; se deja para notas del consultor
      });
    });

    /* ── Asegurar formato de columnas (ancho y estilo) ───────── */
    ws4.columns = [
      { key: 'A', width: 16 },   // Pilar
      { key: 'B', width: 16 },   // Nivel de Prioridad
      { key: 'C', width: 35 },   // Alerta Detonante
      { key: 'D', width: 60 },   // Estrategia Recomendada
      { key: 'E', width: 30 },   // KPI de Medición
    ];
  }

  /* ── 5. Generar blob ────────────────────────────────────────── */
  const outBuffer = await wb.xlsx.writeBuffer();
  return new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
