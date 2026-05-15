import { usePDF } from 'react-to-pdf';
import { useDiagnostico } from '@/context/DiagnosticoContext';
import { useFormatters } from '@/hooks/useFormatters';
import { limpiarJerga } from '@/lib/limpiarJerga';
import { FileDown } from 'lucide-react';

/**
 * ================================================================
 * Reporte Ejecutivo PDF — One-Pager para el Dueño de Negocio
 *
 * Estructura exacta (Fase 5.3):
 *   1. Cabecera: Logo + titulo + subtitulos dinamicos
 *   2. Resumen Ejecutivo: Score, Veredicto, Bloque EVA
 *   3. Semáforos de Pilares: Rentabilidad, Liquidez, Estructura
 *   4. Alertas Críticas Identificadas
 *   5. Plan de Acción Alta + Hoja de Ruta 90 días
 *   6. Pie: Firma del consultor
 *
 * Paleta: Navy (#0f2b4c) + Oro (#d4a843) + Gris corporativo
 * ================================================================ */

/* ── Colores corporativos ────────────────────────────────────── */
const C = {
  navy: '#0f2b4c',
  navyLight: '#1a3a5c',
  gold: '#d4a843',
  goldLight: '#e8d5a3',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#dc2626',
  gray: '#6b7a8d',
  grayLight: '#9ba5b3',
  bg: '#fafbfd',
  white: '#ffffff',
  border: '#e8ebf0',
};

export default function ExportarReporteEjecutivo() {
  const { resultados } = useDiagnostico();
  const { pct, compactNumber } = useFormatters();

  const { toPDF, targetRef } = usePDF({
    filename: `Zenith_Resumen_${resultados?.empresa?.replace(/\s+/g, '_') || 'Ejecutivo'}.pdf`,
    page: { margin: 28, format: 'letter' },
  });

  if (!resultados) return null;

  const m = resultados.metricas;
  const sm = resultados.semaforos;

  /* Folio: ZEN-2026-XXXX */
  const folio = `ZEN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  /* EVA proyeccion (meta: alcanzar spread +2pp) */
  const evaProyectado = m.eva + m.capital_invertido * 0.02;
  const deltaEva = evaProyectado - m.eva;

  /* Alertas criticas (overrides) */
  const overrides = (resultados.overrides_activos || [])
    .map((oid: string) => {
      const cat = (window as any).MotorVBM?.CATALOGO_METAS?.find((x: any) => x.id === oid);
      return cat ? { id: oid, ...cat } : null;
    })
    .filter(Boolean);

  /* Solo metas ALTA prioridad */
  const metasAlta = [...resultados.metas_activas]
    .filter((mx) => mx.prioridad === 'alta')
    .sort((a, b) => b.impacto_eva_calculado - a.impacto_eva_calculado);

  /* Color semáforo → hex */
  const semColor = (val: string) =>
    val === 'verde' ? C.success : val === 'amarillo' ? C.warning : C.danger;

  /* Score color */
  const scoreColor = resultados.score_global >= 75 ? C.success :
                     resultados.score_global >= 50 ? C.warning : C.danger;

  return (
    <>
      {/* ── Botón visible en la UI ────────────────────────────── */}
      <button
        onClick={() => toPDF()}
        className="flex items-center gap-2 text-xs font-semibold text-navy-700 hover:text-navy-900 px-3 py-2 rounded-md hover:bg-navy-50 transition-colors border border-[#e8ebf0]"
      >
        <FileDown size={14} />
        Resumen Ejecutivo (PDF)
      </button>

      {/* ═══════════════════════════════════════════════════════════
          CONTENIDO PDF (oculto en UI, capturado por react-to-pdf)
          ═══════════════════════════════════════════════════════════ */}
      <div ref={targetRef} className="hidden-pdf-report">
        <div style={st.page}>

          {/* ═══════ 1. CABECERA ═════════════════════════════════ */}
          <div style={st.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/logo-inicio-azul.png"
                alt="Zenith GBV"
                style={{ height: 36, width: 'auto' }}
                draggable={false}
              />
              <div>
                <div style={st.brand}>ZENITH GBV</div>
                <div style={st.brandSub}>Consultoria Financiera</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={st.docTitle}>REPORTE EJECUTIVO</div>
              <div style={st.docSub}>Diagnostico de Valor</div>
            </div>
          </div>

          {/* Subtítulos dinámicos */}
          <div style={st.subHeader}>
            <span>Elaborado para: <strong>{resultados.empresa}</strong></span>
            <span style={{ margin: '0 8px', color: C.grayLight }}>|</span>
            <span>Fecha: {fechaHoy}</span>
            <span style={{ margin: '0 8px', color: C.grayLight }}>|</span>
            <span>Folio: <strong style={{ color: C.gold }}>{folio}</strong></span>
          </div>

          {/* ═══════ 2. RESUMEN EJECUTIVO ════════════════════════ */}
          <div style={st.sectionBox}>
            <div style={st.sectionNum}>01</div>
            <div style={st.sectionTitle}>RESUMEN EJECUTIVO</div>

            {/* Score + Sector */}
            <div style={st.scoreRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ ...st.scoreCircle, borderColor: scoreColor, color: scoreColor }}>
                  <div style={st.scoreValue}>{resultados.score_global}</div>
                  <div style={st.scoreLabel}>/ 100</div>
                </div>
                <div>
                  <div style={st.scoreText}>SCORE GLOBAL</div>
                  <div style={st.sectorText}>Sector: {resultados.sector}</div>
                </div>
              </div>
              {/* Veredicto */}
              <div style={{
                ...st.veredictoBox,
                backgroundColor: resultados.crea_valor ? '#ecfdf5' : '#fef2f2',
                borderColor: resultados.crea_valor ? C.success : C.danger,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 800,
                  color: resultados.crea_valor ? C.success : C.danger,
                }}>
                  {resultados.crea_valor ? '✓ CREA VALOR' : '⚠ DESTRUYE VALOR'}
                </div>
                <div style={{ fontSize: 9, color: C.gray, marginTop: 4, lineHeight: 1.4 }}>
                  {resultados.texto_cliente}
                </div>
              </div>
            </div>

            {/* Bloque EVA */}
            <div style={st.evaRow}>
              <div style={st.evaCard}>
                <div style={st.evaLabel}>EVA ACTUAL</div>
                <div style={{ ...st.evaValue, color: m.eva >= 0 ? C.success : C.danger }}>
                  {m.eva >= 0 ? '+' : ''}{compactNumber(m.eva)}
                </div>
              </div>
              <div style={{ fontSize: 20, color: C.gold, fontWeight: 300 }}>→</div>
              <div style={st.evaCard}>
                <div style={st.evaLabel}>EVA PROYECTADO</div>
                <div style={{ ...st.evaValue, color: C.navy }}>
                  {evaProyectado >= 0 ? '+' : ''}{compactNumber(evaProyectado)}
                </div>
              </div>
              <div style={{ fontSize: 20, color: C.gold, fontWeight: 300 }}>|</div>
              <div style={st.evaCard}>
                <div style={st.evaLabel}>DELTA</div>
                <div style={{ ...st.evaValue, color: deltaEva >= 0 ? C.success : C.danger }}>
                  {deltaEva >= 0 ? '+' : ''}{compactNumber(deltaEva)}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ 3. SEMÁFOROS DE PILARES ═════════════════════ */}
          <div style={st.sectionBox}>
            <div style={st.sectionNum}>02</div>
            <div style={st.sectionTitle}>ESTADO DE LOS PILARES FINANCIEROS</div>

            <div style={st.pilarGrid}>
              {/* Rentabilidad */}
              <div style={{ ...st.pilarCard, borderTop: `3px solid ${semColor(sm.rentabilidad)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ ...st.pilarDot, backgroundColor: semColor(sm.rentabilidad) }} />
                  <span style={st.pilarName}>RENTABILIDAD</span>
                </div>
                <MetricRow label="ROIC" value={pct(m.roic)} />
                <MetricRow label="WACC" value={pct(m.wacc)} />
                <MetricRow label="Margen Neto" value={pct(m.margen_neto)} />
              </div>

              {/* Liquidez */}
              <div style={{ ...st.pilarCard, borderTop: `3px solid ${semColor(sm.liquidez)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ ...st.pilarDot, backgroundColor: semColor(sm.liquidez) }} />
                  <span style={st.pilarName}>LIQUIDEZ</span>
                </div>
                <MetricRow label="Razon Corriente" value={m.razon_corriente?.toFixed(2) || 'N/A'} />
                <MetricRow label="Dias de Caja" value={`${Math.round(m.dias_caja || 0)} dias`} />
                <MetricRow label="CCC" value={`${Math.round(m.ccc || 0)} dias`} />
              </div>

              {/* Estructura */}
              <div style={{ ...st.pilarCard, borderTop: `3px solid ${semColor(sm.estructura)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ ...st.pilarDot, backgroundColor: semColor(sm.estructura) }} />
                  <span style={st.pilarName}>ESTRUCTURA</span>
                </div>
                <MetricRow label="D/E Ratio" value={`${(m.deuda_patrimonio || 0).toFixed(2)}x`} />
                <MetricRow label="Cobertura" value={fmtX(m.cobertura_intereses)} />
                <MetricRow label="Deuda/Activos" value={pct(m.deuda_activos)} />
              </div>
            </div>
          </div>

          {/* ═══════ 4. ALERTAS CRÍTICAS ═════════════════════════ */}
          {overrides.length > 0 && (
            <div style={{ ...st.sectionBox, backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
              <div style={{ ...st.sectionNum, backgroundColor: C.danger, color: C.white }}>!</div>
              <div style={{ ...st.sectionTitle, color: C.danger }}>ALERTAS CRITICAS IDENTIFICADAS</div>

              <div style={st.alertasBox}>
                {overrides.map((o: any, i: number) => (
                  <div key={o.id} style={st.alertaItem}>
                    <span style={st.alertaBullet}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 2 }}>
                        {o.nombre}
                      </div>
                      <div style={{ fontSize: 8, color: C.gray, lineHeight: 1.5 }}>
                        {limpiarJerga(o.texto_consultor)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ 5. PLAN DE ACCIÓN + HOJA DE RUTA 90 DÍAS ═══ */}
          <div style={st.sectionBox}>
            <div style={st.sectionNum}>03</div>
            <div style={st.sectionTitle}>PLAN DE ACCION Y HOJA DE RUTA</div>
            <div style={{ fontSize: 8, color: C.gray, marginBottom: 10 }}>
              Estrategias de Prioridad Alta &middot; {metasAlta.length} metas identificadas
            </div>

            {/* Metas ALTA */}
            {metasAlta.slice(0, 4).map((meta, i) => (
              <div key={meta.id} style={st.metaAltaRow}>
                <span style={st.metaNum}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.navy }}>{meta.nombre}</span>
                    <span style={{
                      fontSize: 7, fontWeight: 700, padding: '1px 5px', borderRadius: 6,
                      backgroundColor: C.warning, color: C.white, textTransform: 'uppercase',
                    }}>ALTA</span>
                  </div>
                  {meta.estrategias && meta.estrategias.length > 0 && (
                    <div style={{ fontSize: 8, color: C.gray, lineHeight: 1.5, marginTop: 3 }}>
                      {limpiarJerga(meta.estrategias[0])}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.success, whiteSpace: 'nowrap' }}>
                  +{compactNumber(meta.impacto_eva_calculado)}
                </span>
              </div>
            ))}

            {/* Hoja de Ruta 90 días */}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Hoja de Ruta a 90 Dias
              </div>
              <div style={st.rutaGrid}>
                <div style={st.rutaCard}>
                  <div style={{ ...st.rutaHeader, backgroundColor: C.danger }}>DIAS 1-30</div>
                  <div style={st.rutaTitle}>Diagnostico</div>
                  <ul style={st.rutaList}>
                    <li>Revisar estado financiero actual</li>
                    <li>Identificar fugas de efectivo</li>
                    <li>Negociar plazos con proveedores</li>
                    <li>Cobrar cartera vencida</li>
                  </ul>
                </div>
                <div style={st.rutaCard}>
                  <div style={{ ...st.rutaHeader, backgroundColor: C.warning }}>DIAS 31-60</div>
                  <div style={st.rutaTitle}>Reconstruccion</div>
                  <ul style={st.rutaList}>
                    <li>Implementar estrategias de costos</li>
                    <li>Reducir inventario obsoleto</li>
                    <li>Renegociar deuda bancaria</li>
                    <li>Ajustar precios de venta</li>
                  </ul>
                </div>
                <div style={st.rutaCard}>
                  <div style={{ ...st.rutaHeader, backgroundColor: C.success }}>DIAS 61-90</div>
                  <div style={st.rutaTitle}>Crecimiento</div>
                  <ul style={st.rutaList}>
                    <li>Medir impacto del plan de accion</li>
                    <li>Revisar margen bruto alcanzado</li>
                    <li>Formalizar procesos de cobro</li>
                    <li>Preparar segundo trimestre</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ 6. PIE — FIRMA ══════════════════════════════ */}
          <div style={st.footer}>
            <div style={st.footerLine} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.navy }}>
                  Consultor Financiero
                </div>
                <div style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>
                  Zenith GBV Financial Consulting
                </div>
                <div style={{ fontSize: 7, color: C.grayLight, marginTop: 4 }}>
                  www.zenithgbv.com &middot; consultoria@zenithgbv.com
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 7, color: C.grayLight, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Documento Confidencial
                </div>
                <div style={{ fontSize: 7, color: C.grayLight, marginTop: 2 }}>
                  {fechaHoy} &middot; {folio}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ═══════════════════════════════════════════════════════════════ */

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f2f5' }}>
      <span style={{ fontSize: 8, color: C.gray }}>{label}</span>
      <span style={{ fontSize: 8, fontWeight: 700, color: C.navy, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function fmtX(v: number | null | undefined) {
  if (v == null) return 'N/A';
  return `${v.toFixed(1)}x`;
}

/* ═══════════════════════════════════════════════════════════════
   ESTILOS INLINE (PDF-safe)
   ═══════════════════════════════════════════════════════════════ */
const st: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: 'Inter, Helvetica, Arial, sans-serif',
    color: C.navy,
    padding: '24px 28px',
    backgroundColor: C.white,
    fontSize: 9,
  },

  /* Cabecera */
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottom: `2px solid ${C.gold}`,
    marginBottom: 8,
  },
  brand: {
    fontSize: 13,
    fontWeight: 800,
    color: C.navy,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 7,
    fontWeight: 600,
    color: C.gray,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  docSub: {
    fontSize: 8,
    fontWeight: 600,
    color: C.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  subHeader: {
    fontSize: 8,
    color: C.gray,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: `1px solid ${C.border}`,
  },

  /* Secciones */
  sectionBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    backgroundColor: C.bg,
  },
  sectionNum: {
    display: 'inline-block',
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: C.gold,
    color: C.white,
    fontSize: 8,
    fontWeight: 800,
    textAlign: 'center',
    lineHeight: '18px',
    marginRight: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    display: 'inline',
    fontSize: 10,
    fontWeight: 800,
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* Score */
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: 7,
    fontWeight: 600,
  },
  scoreText: {
    fontSize: 8,
    fontWeight: 700,
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectorText: {
    fontSize: 8,
    color: C.gray,
    marginTop: 2,
  },

  /* Veredicto */
  veredictoBox: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1.5px solid',
    flex: 1,
    maxWidth: 280,
  },

  /* EVA */
  evaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    padding: '10px 0',
    backgroundColor: C.white,
    borderRadius: 6,
    border: `1px solid ${C.border}`,
  },
  evaCard: {
    textAlign: 'center',
    minWidth: 100,
  },
  evaLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: C.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  evaValue: {
    fontSize: 16,
    fontWeight: 800,
  },

  /* Pilares / Semáforos */
  pilarGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginTop: 8,
  },
  pilarCard: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: C.white,
    border: `1px solid ${C.border}`,
  },
  pilarDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  pilarName: {
    fontSize: 8,
    fontWeight: 800,
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Alertas */
  alertasBox: {
    marginTop: 8,
  },
  alertaItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '6px 0',
    borderBottom: '1px solid #fecaca',
  },
  alertaBullet: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: C.danger,
    color: C.white,
    fontSize: 8,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  /* Metas ALTA */
  metaAltaRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '6px 8px',
    marginBottom: 4,
    backgroundColor: C.white,
    borderRadius: 4,
    border: `1px solid ${C.border}`,
  },
  metaNum: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: C.navy,
    color: C.white,
    fontSize: 8,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  /* Hoja de ruta 90 días */
  rutaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
  },
  rutaCard: {
    borderRadius: 6,
    overflow: 'hidden',
    border: `1px solid ${C.border}`,
    backgroundColor: C.white,
  },
  rutaHeader: {
    padding: '4px 8px',
    color: C.white,
    fontSize: 7,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  rutaTitle: {
    padding: '6px 8px 2px',
    fontSize: 9,
    fontWeight: 700,
    color: C.navy,
  },
  rutaList: {
    margin: '0 0 6px 20px',
    padding: 0,
    listStyle: 'disc',
  },

  /* Footer */
  footer: {
    marginTop: 16,
    paddingTop: 10,
  },
  footerLine: {
    height: 2,
    backgroundColor: C.gold,
    marginBottom: 10,
  },
};
