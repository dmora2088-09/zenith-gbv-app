import type {
  IngestaFormData,
  IngestaInputsPlano,
  DiagnosticoOutput,
  Metricas,
  Clasificaciones,
  ClasificacionVAR,
  MotorGlobal,
} from '@/types/motor';

/**
 * ================================================================
 * Zenith GBV — Motor Adapter (motor.js v2)
 *
 * Función estrella: ensamblarInputs()
 *   Replica exacta de finalizarYDiagnosticar() de ingesta(2).js
 *   Convierte IngestaFormData (5 pasos) → IngestaInputsPlano (52+ campos)
 *
 * El motor.js se carga como script global en index.html.
 * Este adapter lee window.MotorVBM y expone funciones tipadas.
 * ================================================================
 */

/* ───────────────────────────────────────────────────────────────
   §0 — VALIDACIÓN DEL MOTOR
   ─────────────────────────────────────────────────────────────── */

function getMotor(): MotorGlobal {
  if (!window.MotorVBM) {
    throw new Error(
      '[MotorAdapter] window.MotorVBM no encontrado. ' +
        'Verifica que motor.js esté cargado en index.html antes del bundle React.'
    );
  }
  return window.MotorVBM;
}

export function motorCargado(): boolean {
  return typeof window !== 'undefined' && !!window.MotorVBM;
}

export function esperarMotor(timeout = 5000): Promise<MotorGlobal> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.MotorVBM) {
        resolve(window.MotorVBM);
        return;
      }
      if (Date.now() - start > timeout) {
        reject(new Error('[MotorAdapter] Timeout esperando motor.js'));
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}

/* ───────────────────────────────────────────────────────────────
   §1 — ENSAMBLAR INPUTS
   Paridad 1:1 con ingesta(2).js :: finalizarYDiagnosticar()
   ─────────────────────────────────────────────────────────────── */

/**
 * Construye el objeto plano de 52+ campos que el motor espera.
 *
 * Réplica exacta de la lógica del original:
 *   1. Mapea p1a → campos de negocio + derivados (es_micro, sector_tipo)
 *   2. Mapea p1c → estado de resultados
 *   3. Mapea p1d → balance + derivados (activo_total, patrimonio, pasivo_total, deuda_total)
 *   4. Mapea p1b → ajustes (deuda_sombra = fintech+tarjeta+agiota)
 *   5. Mapea p1e → parámetros operativos (Kd, kd_efectivo, prima_pyme)
 *   6. Calcula campos derivados: pasivos_corrientes, capital_invertido, ebitda, opex, impuestos_anuales
 */
export function ensamblarInputs(form: IngestaFormData): IngestaInputsPlano {
  const p1a = form.p1a;
  const p1b = form.p1b;
  const p1c = form.p1c;
  const p1d = form.p1d;
  const p1e = form.p1e;

  // ── Derivados del balance ──────────────────────────────────
  const patrimonio = p1d.capital_social + p1d.utilidades_retenidas;
  const activo_total =
    p1d.caja_bancos +
    p1d.cuentas_por_cobrar +
    p1d.inventarios +
    p1d.otros_activos_corrientes +
    p1d.activos_fijos_netos +
    p1d.otros_activos_no_corrientes;
  const pasivo_total =
    p1d.deuda_financiera_cp +
    p1d.otros_pasivos_corrientes +
    p1d.cuentas_por_pagar +
    p1d.deuda_financiera_lp +
    p1d.otros_pasivos_nc;
  const deuda_total = p1d.deuda_financiera_cp + p1d.deuda_financiera_lp;

  // ── Derivados del estado de resultados ─────────────────────
  const opex = p1c.gastos_adm + p1c.gastos_vta;
  const ebitda = p1c.ventas - p1c.cogs - opex;
  const impuestos_anuales = (p1c.ventas - p1c.cogs - opex - p1c.da) * p1a.tasa_impuesto;

  // ── Derivados del capital invertido ────────────────────────
  const pasivos_corrientes =
    p1d.deuda_financiera_cp + p1d.cuentas_por_pagar + p1d.otros_pasivos_corrientes;
  const capital_invertido =
    p1d.cuentas_por_cobrar + p1d.inventarios - p1d.cuentas_por_pagar + p1d.activos_fijos_netos;

  // ── Derivados PyME ─────────────────────────────────────────
  const es_micro = p1a.numero_empleados <= 10;

  // ── Derivados deuda sombra ─────────────────────────────────
  const deuda_sombra = p1b.deuda_fintech + p1b.deuda_tarjeta + p1b.deuda_agiotista;

  // ── Sector tipo (derivado del sector_id) ───────────────────
  const sid = p1a.sector_id;
  let sector_tipo: string;
  if (sid.startsWith('01') || sid.startsWith('03') || sid.startsWith('04') || sid.startsWith('13') || sid.startsWith('16') || sid.startsWith('17')) {
    sector_tipo = 'comercio';
  } else if (sid.startsWith('02') || sid.startsWith('05') || sid.startsWith('06') || sid.startsWith('07') || sid.startsWith('08') || sid.startsWith('14') || sid.startsWith('15')) {
    sector_tipo = 'industria';
  } else {
    sector_tipo = 'servicios';
  }

  /* Mapeo regimen hibrido (7 valores) → valores del motor (3) */
  let regimenMotor: 'ISR_PM' | 'RESICO' | 'PFAE';
  if (p1a.regimen === 'PFAE_OTRO') {
    regimenMotor = 'PFAE';
  } else if (p1a.regimen.startsWith('RESICO')) {
    regimenMotor = 'RESICO';
  } else {
    regimenMotor = 'ISR_PM';
  }

  /* Si es PFAE, usar tasa_isr_manual como tasa_impuesto */
  const tasaEfectiva = p1a.regimen === 'PFAE_OTRO' && p1a.tasa_isr_manual
    ? p1a.tasa_isr_manual
    : p1a.tasa_impuesto;

  return {
    // ══ p1a: Negocio ════════════════════════════════════════
    nombre_empresa: p1a.nombre_empresa,
    periodo: p1a.periodo_analizar,
    regimen: regimenMotor,
    tasa_impuesto: tasaEfectiva,
    numero_empleados: p1a.numero_empleados,
    sector_tipo,
    es_informal: p1a.es_informal,
    moneda: p1a.moneda,
    sector_id: p1a.sector_id,
    es_micro,

    // ══ p1c: Estado de Resultados ═══════════════════════════
    ventas: p1c.ventas,
    cogs: p1c.cogs,
    gastos_administracion: p1c.gastos_adm,
    gastos_ventas: p1c.gastos_vta,
    depreciacion_amortizacion: p1c.da,
    ingresos_no_operativos: p1c.ing_no_op,
    gastos_no_operativos: p1c.gto_no_op,
    gastos_financieros: p1c.gastos_financieros,
    capex: p1c.capex,

    // ══ p1d: Balance General ════════════════════════════════
    caja_bancos: p1d.caja_bancos,
    cuentas_por_cobrar: p1d.cuentas_por_cobrar,
    inventarios: p1d.inventarios,
    otros_activos_corrientes: p1d.otros_activos_corrientes,
    activos_fijos_netos: p1d.activos_fijos_netos,
    otros_activos_no_corrientes: p1d.otros_activos_no_corrientes,
    cuentas_por_pagar: p1d.cuentas_por_pagar,
    deuda_financiera_cp: p1d.deuda_financiera_cp,
    otros_pasivos_corrientes: p1d.otros_pasivos_corrientes,
    deuda_financiera_lp: p1d.deuda_financiera_lp,
    otros_pasivos_nc: p1d.otros_pasivos_nc,
    capital_social: p1d.capital_social,
    utilidades_retenidas: p1d.utilidades_retenidas,
    patrimonio,
    activo_total,
    pasivo_total,
    deuda_total,

    // ══ p1b: Ajustes ════════════════════════════════════════
    retiros_propietario: p1b.retiros_propietario,
    gastos_personales: p1b.gastos_personales_empresa,
    gastos_personales_empresa: p1b.gastos_personales_empresa,
    ventas_no_facturadas: p1b.ventas_no_facturadas,
    sueldo_imputado: p1b.sueldo_imputado,
    deuda_sombra,
    deuda_fintech: p1b.deuda_fintech,
    deuda_tarjeta: p1b.deuda_tarjeta,
    deuda_agiotista: p1b.deuda_agiotista,
    atrasos_sat: false,

    // ══ p1e: Operativos ═════════════════════════════════════
    credito_pct: p1e.credito_pct,
    Kd: p1e.Kd,
    kd_efectivo: p1e.Kd,          // alias para compatibilidad
    prima_pyme: p1e.prima_pyme,

    // ══ Derivados calculados ════════════════════════════════
    pasivos_corrientes,
    capital_invertido,
    ebitda,
    opex,
    impuestos_anuales,

    // ══ Opcionales (para NOPCAF delta) ══════════════════════
    ktno_anterior: undefined,
  };
}

/* ───────────────────────────────────────────────────────────────
   §2 — FUNCIONES PRINCIPALES DEL MOTOR
   ─────────────────────────────────────────────────────────────── */

/**
 * Ejecuta el diagnóstico completo.
 * Recibe IngestaFormData, ensambla el objeto plano, y llama al motor.
 */
export function ejecutarDiagnostico(
  form: IngestaFormData
): DiagnosticoOutput {
  const motor = getMotor();
  const inputs = ensamblarInputs(form);
  const sectorId = inputs.sector_id;
  const resultado = motor.ejecutarDiagnostico(
    inputs as unknown as Record<string, unknown>,
    sectorId
  ) as DiagnosticoOutput;

  /* Enriquecer resultado: inyectar estrategias desde CATALOGO_METAS */
  if (!resultado.error) {
    try {
      const cat = (window as any).MotorVBM?.CATALOGO_METAS;
      if (Array.isArray(cat)) {
        const enrich = (metaList: any[]) =>
          metaList.map((meta) => {
            const found = cat.find((c: any) => c.id === meta.id);
            if (found?.estrategias) {
              return { ...meta, estrategias: found.estrategias };
            }
            return meta;
          });
        if (Array.isArray(resultado.metas_activas)) {
          (resultado as any).metas_activas = enrich(resultado.metas_activas);
        }
        if (Array.isArray(resultado.metas_reporte)) {
          (resultado as any).metas_reporte = enrich(resultado.metas_reporte);
        }
      }
    } catch {
      /* silently skip if catalog not available */
    }
  }

  /* Enriquecer resultado: props de primer nivel para acceso directo */
  const r = resultado as unknown as Record<string, unknown>;

  if ('metricas' in resultado && resultado.metricas) {
    const m = resultado.metricas as unknown as Record<string, unknown>;
    r.z_score = typeof m.z_score === 'number' ? m.z_score : null;
    const zz = m.z_zona;
    r.z_zona = zz === 'Segura' || zz === 'Gris' || zz === 'Quiebra' ? zz : null;
  }

  /* Copiar overrides_activos (alertas criticas O1-O7) */
  if ('overrides_activos' in resultado && Array.isArray(resultado.overrides_activos)) {
    r.overrides_activos = resultado.overrides_activos;
    /* Derivar alertas legibles buscando en CATALOGO_METAS */
    try {
      const cat = (window as any).MotorVBM?.CATALOGO_METAS;
      if (Array.isArray(cat)) {
        r.alertas = (resultado.overrides_activos as string[]).map((oid: string) => {
          const found = cat.find((c: any) => c.id === oid);
          return found?.nombre || oid;
        });
      } else {
        r.alertas = resultado.overrides_activos;
      }
    } catch {
      r.alertas = resultado.overrides_activos;
    }
  } else {
    r.overrides_activos = [];
    r.alertas = [];
  }

  return resultado;
}

/**
 * Calcula solo las métricas (sin clasificación, metas, etc.)
 */
export function calcularMetricas(form: IngestaFormData): Metricas {
  const motor = getMotor();
  const inputs = ensamblarInputs(form);
  return motor.calcularMetricas(
    inputs as unknown as Record<string, unknown>,
    inputs.sector_id
  );
}

/**
 * Calcula solo el WACC
 */
export function calcularWACC(form: IngestaFormData) {
  const motor = getMotor();
  const inputs = ensamblarInputs(form);
  return motor.calcularWACC(
    inputs as unknown as Record<string, unknown>,
    inputs.sector_id
  );
}

/**
 * Clasifica métricas contra benchmarks
 */
export function clasificarMetricas(
  metricas: Metricas,
  form: IngestaFormData
): Clasificaciones {
  const motor = getMotor();
  const inputs = ensamblarInputs(form);
  return motor.clasificarTodasLasMetricas(
    metricas,
    inputs.sector_id,
    inputs as unknown as Record<string, unknown>
  );
}

/* ───────────────────────────────────────────────────────────────
   §3 — UTILIDADES DE FORMATO
   ─────────────────────────────────────────────────────────────── */

/* Fallback de formato nativo (cuando motor.js aun no cargo) */
function fmtNative(n: number, decimales: number): string {
  return n.toLocaleString('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function fmtMoney(n: number | null | undefined, d = 0): string {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  if (!motorCargado()) return `$${fmtNative(n, d)}`;
  return getMotor().fmt(n, d);
}

export function fmtPct(n: number | null | undefined, d = 1): string {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  if (!motorCargado()) return `${fmtNative(n * 100, d)}%`;
  return getMotor().fmtPct(n, d);
}

export function fmtX(n: number | null | undefined, d = 1): string {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  if (!motorCargado()) return `${fmtNative(n, d)}x`;
  return getMotor().fmtX(n, d);
}

export function fmtDias(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  if (!motorCargado()) return `${Math.round(n)} dias`;
  return getMotor().fmtDias(n);
}

export function colorSemaforo(c: ClasificacionVAR | string): string {
  if (!motorCargado()) return INSTITUTIONAL_COLORS[c as string]?.dot || '#9ba5b3';
  return getMotor().colorSemaforo(c as ClasificacionVAR);
}

export function emojiSemaforo(c: ClasificacionVAR | string): string {
  if (!motorCargado()) {
    const map: Record<string, string> = { verde: 'V', amarillo: 'A', rojo: 'R', na: '-' };
    return map[c as string] || '?';
  }
  return getMotor().emojiSemaforo(c as ClasificacionVAR);
}

/* ───────────────────────────────────────────────────────────────
   §4 — DATOS DE REFERENCIA
   ─────────────────────────────────────────────────────────────── */

export function getSectores(): Array<{ id: string; nombre: string }> {
  if (!motorCargado()) return [];
  const motor = getMotor();
  return Object.entries(motor.BENCHMARKS).map(([id, b]) => ({
    id,
    nombre: (b as { nombre?: string }).nombre || `Sector ${id}`,
  }));
}

export function getBenchmarkSector(sectorId: string): unknown {
  return getMotor().BENCHMARKS[sectorId];
}

export function getWACCParams(sectorId: string): unknown {
  return getMotor().WACC_PARAMS[sectorId];
}

export function getMacro(): Record<string, number | string> {
  return getMotor().MACRO;
}

export function getCatalogoMetas(): unknown[] {
  return getMotor().CATALOGO_METAS;
}

/* ───────────────────────────────────────────────────────────────
   §5 — COLORES INSTITUCIONALES ZENITH
   ─────────────────────────────────────────────────────────────── */

const INSTITUTIONAL_COLORS: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  verde:    { text: '#1B8A4F', bg: '#e8f5ee', border: 'rgba(27,138,79,0.25)', dot: '#1B8A4F' },
  amarillo: { text: '#B0780A', bg: '#fdf5e4', border: 'rgba(176,120,10,0.25)', dot: '#D4930D' },
  rojo:     { text: '#C0392B', bg: '#fbe8e6', border: 'rgba(192,57,43,0.25)', dot: '#C0392B' },
  na:       { text: '#9ba5b3', bg: '#f0f2f5', border: 'rgba(155,165,179,0.25)', dot: '#9ba5b3' },
};

export function colorInstitucional(c: ClasificacionVAR | string) {
  return INSTITUTIONAL_COLORS[c as string] || INSTITUTIONAL_COLORS.na;
}
