import { usePDF } from 'react-to-pdf';
import { useDiagnostico } from '@/context/DiagnosticoContext';
import { useFormatters } from '@/hooks/useFormatters';
import { limpiarJerga } from '@/lib/limpiarJerga';
import { FileDown } from 'lucide-react';

/**
 * ================================================================
 * Reporte Tecnico (PDF) — Para el Consultor
 *
 * Enfoque: Exhaustivo y riguroso. Multipagina.
 * Contenido: Todas las metricas, plan de accion completo,
 *   estrategias detalladas, glosario, cuadro de mando.
 * Diseño: Minimalista Navy/Oro, tablas profesionales.
 * ================================================================ */

export default function ExportarReporteTecnico() {
  const { resultados, inputs } = useDiagnostico();
  const { pct, compactNumber } = useFormatters();

  const { toPDF, targetRef } = usePDF({
    filename: `Zenith_Diagnostico_${resultados?.empresa?.replace(/\s+/g, '_') || 'Tecnico'}.pdf`,
    page: { margin: 24, format: 'letter' },
  });

  if (!resultados) return null;

  const m = resultados.metricas;
  const c = resultados.clasificaciones;

  /* Ordenar metas por impacto EVA */
  const metasOrdenadas = [...resultados.metas_activas]
    .sort((a, b) => b.impacto_eva_calculado - a.impacto_eva_calculado);

  /* Overrides con catalogo */
  const overridesCompletos = (resultados.overrides_activos || [])
    .map((oid: string) => {
      const cat = (window as any).MotorVBM?.CATALOGO_METAS?.find((x: any) => x.id === oid);
      return cat ? { id: oid, ...cat } : null;
    })
    .filter(Boolean);

  const colorScore =
    resultados.score_global >= 75 ? '#10b981' :
    resultados.score_global >= 50 ? '#f59e0b' : '#ef4444';

  /* Helpers de formato */
  const fmtPct = (v: number | null | undefined) => v == null ? 'N/A' : pct(v);
  const fmtNum = (v: number | null | undefined) => v == null ? 'N/A' : compactNumber(v);
  const fmtDias = (v: number | null | undefined) => v == null ? 'N/A' : `${Math.round(v)} dias`;
  const fmtX = (v: number | null | undefined) => v == null ? 'N/A' : `${v.toFixed(2)}x`;
  const fmtBool = (v: boolean | null | undefined) => v == null ? 'N/A' : (v ? 'Si' : 'No');

  return (
    <>
      <button
        onClick={() => toPDF()}
        className="flex items-center gap-2 text-xs font-semibold text-navy-700 hover:text-navy-900 px-3 py-2 rounded-md hover:bg-navy-50 transition-colors border border-[#e8ebf0]"
      >
        <FileDown size={14} />
        Diagnostico Tecnico (PDF)
      </button>

      <div ref={targetRef} className="hidden-pdf-report">
        <div style={S.page}>

          {/* PORTADA */}
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo-inicio-azul.png" alt="Zenith" style={{ height: 32 }} />
              <div>
                <div style={S.brand}>Zenith GBV</div>
                <div style={S.brandSub}>Consultoria Financiera &middot; Reporte de Diagnostico</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#6b7a8d' }}>Periodo: {resultados.periodo}</div>
              <div style={{ fontSize: 9, color: '#6b7a8d' }}>{new Date().toLocaleDateString('es-MX')}</div>
            </div>
          </div>

          {/* EMPRESA */}
          <div style={S.empresaBox}>
            <div style={S.empresaNombre}>{resultados.empresa}</div>
            <div style={S.empresaMeta}>{resultados.sector} &middot; {resultados.estrato} &middot; Score: {resultados.score_global}/100</div>
            <div style={{ ...S.scoreBadge, borderColor: colorScore, color: colorScore, marginTop: 8 }}>
              {resultados.veredicto}
            </div>
          </div>

          {/* KPIs MASTER */}
          <div style={S.grid2}>
            <KPICard label="EVA" value={fmtNum(m.eva)} color={m.eva >= 0 ? '#10b981' : '#ef4444'} />
            <KPICard label="ROIC" value={fmtPct(m.roic)} color={c.roic === 'verde' ? '#10b981' : c.roic === 'amarillo' ? '#f59e0b' : '#ef4444'} />
            <KPICard label="WACC" value={fmtPct(m.wacc)} color="#0f2b4c" />
            <KPICard label="NOPAT" value={fmtNum(m.nopat)} color="#0f2b4c" />
            <KPICard label="Capital Invertido" value={fmtNum(m.capital_invertido)} color="#0f2b4c" />
            <KPICard label="Spread ROIC-WACC" value={fmtPct(m.roic - m.wacc)} color={m.roic > m.wacc ? '#10b981' : '#ef4444'} />
          </div>

          {/* RENTABILIDAD */}
          <SectionTitle title="Analisis de Rentabilidad" />
          <table style={S.table}>
            <thead>
              <tr style={{ backgroundColor: '#0f2b4c' }}>
                <th style={{ ...S.th, width: '40%' }}>Metrica</th>
                <th style={S.th}>Valor</th>
                <th style={S.th}>Clasif.</th>
                <th style={S.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              <TR label="Ventas" value={fmtNum(m.ventas)} clasif="-" />
              <TR label="Margen Bruto" value={fmtPct(m.margen_bruto)} clasif={c.margen_bruto} />
              <TR label="Margen EBITDA" value={fmtPct(m.margen_ebitda)} clasif={c.margen_ebitda} />
              <TR label="Margen Operativo (EBIT)" value={fmtPct(m.margen_operativo)} clasif={c.margen_operativo} />
              <TR label="Margen Neto" value={fmtPct(m.margen_neto)} clasif={c.margen_neto} />
              <TR label="EBITDA" value={fmtNum(m.ebitda)} clasif="-" />
              <TR label="NOPAT" value={fmtNum(m.nopat)} clasif="-" />
              <TR label="ROIC" value={fmtPct(m.roic)} clasif={c.roic} />
              <TR label="WACC" value={fmtPct(m.wacc)} clasif="-" />
              <TR label="ROE" value={fmtPct(m.roe)} clasif="-" />
              <TR label="ROA" value={fmtPct(m.roa)} clasif="-" />
              <TR label="Z-Score Altman" value={m.z_score?.toFixed(2) || 'N/A'} clasif={m.z_score == null ? 'na' : m.z_score < 1.8 ? 'rojo' : m.z_score < 3 ? 'amarillo' : 'verde'} />
              <TR label="Punto de Equilibrio ($)" value={fmtNum(m.punto_equilibrio_pesos)} clasif="-" />
              <TR label="Punto de Equilibrio (dias)" value={m.punto_equilibrio_dias ? `${Math.round(m.punto_equilibrio_dias)} dias` : 'N/A'} clasif="-" />
            </tbody>
          </table>

          {/* LIQUIDEZ */}
          <SectionTitle title="Analisis de Liquidez" />
          <table style={S.table}>
            <thead><tr style={{ backgroundColor: '#0f2b4c' }}>
              <th style={{ ...S.th, width: '40%' }}>Metrica</th>
              <th style={S.th}>Valor</th>
              <th style={S.th}>Clasif.</th>
              <th style={S.th}>Estado</th>
            </tr></thead>
            <tbody>
              <TR label="CCC (Ciclo de Efectivo)" value={fmtDias(m.ccc)} clasif={c.ccc} />
              <TR label="DSO (Dias de Cobro)" value={fmtDias(m.dso)} clasif={c.dso} />
              <TR label="DOH (Dias de Inventario)" value={fmtDias(m.doh)} clasif={c.doh} />
              <TR label="DPO (Dias de Pago)" value={fmtDias(m.dpo)} clasif={c.dpo} />
              <TR label="Dias de Caja" value={fmtDias(m.dias_caja)} clasif="-" />
              <TR label="Razon Corriente" value={m.razon_corriente?.toFixed(2) || 'N/A'} clasif={c.razon_corriente} />
              <TR label="Prueba Acida" value={m.prueba_acida?.toFixed(2) || 'N/A'} clasif={c.prueba_acida} />
              <TR label="KTNO" value={fmtNum(m.ktno)} clasif="-" />
              <TR label="Velocidad de Efectivo" value={m.velocidad_efectivo?.toFixed(2) || 'N/A'} clasif="-" />
            </tbody>
          </table>

          {/* ESTRUCTURA */}
          <SectionTitle title="Analisis de Estructura" />
          <table style={S.table}>
            <thead><tr style={{ backgroundColor: '#0f2b4c' }}>
              <th style={{ ...S.th, width: '40%' }}>Metrica</th>
              <th style={S.th}>Valor</th>
              <th style={S.th}>Clasif.</th>
              <th style={S.th}>Estado</th>
            </tr></thead>
            <tbody>
              <TR label="Deuda / Activos" value={fmtPct(m.deuda_activos)} clasif={c.deuda_activos} />
              <TR label="Deuda Neta / EBITDA" value={fmtX(m.deuda_neta_ebitda)} clasif="-" />
              <TR label="Deuda / Patrimonio" value={fmtPct(m.deuda_patrimonio)} clasif={c.deuda_patrimonio} />
              <TR label="Cobertura de Intereses" value={fmtX(m.cobertura_intereses)} clasif={c.cobertura_intereses} />
              <TR label="Ke (Costo de Capital)" value={fmtPct(m.ke)} clasif="-" />
              <TR label="Kd (Costo de Deuda)" value={fmtPct(m.kd)} clasif="-" />
              <TR label="Deuda Total" value={fmtNum(m.deuda_total)} clasif="-" />
              <TR label="Deuda Neta" value={fmtNum(m.deuda_neta)} clasif="-" />
              <TR label="Activo Total" value={fmtNum(m.activo_total)} clasif="-" />
              <TR label="Patrimonio" value={fmtNum(m.patrimonio)} clasif="-" />
            </tbody>
          </table>

          {/* OVERRIDES / ALERTAS */}
          {overridesCompletos.length > 0 && (
            <>
              <SectionTitle title="Alertas de Supervivencia" color="#dc2626" />
              {overridesCompletos.map((o: any, i: number) => (
                <div key={o.id} style={{ ...S.accionBox, borderColor: '#fecaca', backgroundColor: '#fef2f2', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#dc2626', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f2b4c' }}>{o.nombre}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8, backgroundColor: '#dc2626', color: 'white', textTransform: 'uppercase' }}>CRITICA</span>
                  </div>
                  <p style={{ fontSize: 9, color: '#4a5568', lineHeight: 1.5, marginLeft: 26 }}>
                    <strong>Diagnostico:</strong> {o.texto_consultor}
                  </p>
                  {o.estrategias && o.estrategias.length > 0 && (
                    <div style={{ marginLeft: 26, marginTop: 4 }}>
                      <strong style={{ fontSize: 8, color: '#0f2b4c', textTransform: 'uppercase' }}>Estrategias:</strong>
                      <ul style={{ margin: '4px 0 0 12px', padding: 0, listStyle: 'disc' }}>
                        {o.estrategias.map((e: string, j: number) => (
                          <li key={j} style={{ fontSize: 8, color: '#4a5568', lineHeight: 1.5 }}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* PLAN DE ACCION COMPLETO */}
          <SectionTitle title="Plan de Accion Completo" />
          <div style={{ fontSize: 9, color: '#6b7a8d', marginBottom: 10 }}>
            {metasOrdenadas.length} metas activas &middot; Impacto total: {compactNumber(metasOrdenadas.reduce((s, mx) => s + mx.impacto_eva_calculado, 0))}
          </div>

          {metasOrdenadas.map((meta, i) => (
            <div key={meta.id} style={{ ...S.accionBox, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#0f2b4c', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#0f2b4c', flex: 1 }}>{meta.nombre}</span>
                <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8, backgroundColor: meta.prioridad === 'alta' ? '#f59e0b' : meta.prioridad === 'media' ? '#fef3c7' : '#e8ebf0', color: meta.prioridad === 'alta' ? 'white' : meta.prioridad === 'media' ? '#b45309' : '#6b7a8d', textTransform: 'uppercase' }}>{meta.prioridad}</span>
              </div>
              <p style={{ fontSize: 8, color: '#4a5568', lineHeight: 1.5, marginLeft: 26 }}>
                <strong>Impacto EVA:</strong> {compactNumber(meta.impacto_eva_calculado)} &middot;
                <strong> Pilar:</strong> {meta.pilar} &middot;
                <strong> Metrica:</strong> {meta.meta_metrica || 'N/A'}
              </p>
              {meta.estrategias && meta.estrategias.length > 0 && (
                <ul style={{ margin: '4px 0 0 38px', padding: 0, listStyle: 'disc' }}>
                  {meta.estrategias.map((e: string, j: number) => (
                    <li key={j} style={{ fontSize: 8, color: '#4a5568', lineHeight: 1.5 }}>{limpiarJerga(e)}</li>
                  ))}
                </ul>
              )}
              <p style={{ fontSize: 8, color: '#6b7a8d', lineHeight: 1.4, marginLeft: 26, marginTop: 4, fontStyle: 'italic' }}>
                {limpiarJerga(meta.texto_consultor)}
              </p>
            </div>
          ))}

          {/* CUADRO DE MANDO: DATOS DE ENTRADA */}
          {inputs && (
            <>
              <SectionTitle title="Cuadro de Mando — Datos de Entrada" />
              {/* Estado de Resultados */}
              <table style={S.table}>
                <thead><tr style={{ backgroundColor: '#0f2b4c' }}>
                  <th style={{ ...S.th, width: '50%' }}>Concepto</th>
                  <th style={S.th}>Valor (MXN)</th>
                </tr></thead>
                <tbody>
                  {[
                    ['Ventas', inputs.ventas],
                    ['Costo de Ventas', inputs.cogs],
                    ['Gastos de Administracion', inputs.gastos_administracion],
                    ['Gastos de Venta', inputs.gastos_ventas],
                    ['Depreciacion y Amortizacion', inputs.depreciacion_amortizacion],
                    ['Gastos Financieros', inputs.gastos_financieros],
                    ['Ingresos No Operativos', inputs.ingresos_no_operativos],
                    ['Gastos No Operativos', inputs.gastos_no_operativos],
                    ['CAPEX', inputs.capex],
                  ].map(([label, val]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #f0f2f5' }}>
                      <td style={{ padding: '4px 8px', fontSize: 8, color: '#4a5568' }}>{label}</td>
                      <td style={{ padding: '4px 8px', fontSize: 8, fontWeight: 600, color: '#0f2b4c', fontFamily: 'monospace', textAlign: 'right' }}>{compactNumber(val as number)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Balance General */}
              <table style={{ ...S.table, marginTop: 10 }}>
                <thead><tr style={{ backgroundColor: '#0f2b4c' }}>
                  <th style={{ ...S.th, width: '50%' }}>Concepto</th>
                  <th style={S.th}>Valor (MXN)</th>
                </tr></thead>
                <tbody>
                  {[
                    ['Caja y Bancos', inputs.caja_bancos],
                    ['Cuentas por Cobrar', inputs.cuentas_por_cobrar],
                    ['Inventarios', inputs.inventarios],
                    ['Activos Fijos Netos', inputs.activos_fijos_netos],
                    ['Cuentas por Pagar', inputs.cuentas_por_pagar],
                    ['Deuda CP', inputs.deuda_financiera_cp],
                    ['Deuda LP', inputs.deuda_financiera_lp],
                    ['Capital Social', inputs.capital_social],
                    ['Utilidades Retenidas', inputs.utilidades_retenidas],
                  ].map(([label, val]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #f0f2f5' }}>
                      <td style={{ padding: '4px 8px', fontSize: 8, color: '#4a5568' }}>{label}</td>
                      <td style={{ padding: '4px 8px', fontSize: 8, fontWeight: 600, color: '#0f2b4c', fontFamily: 'monospace', textAlign: 'right' }}>{compactNumber(val as number)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Parametros de Negocio */}
              <table style={{ ...S.table, marginTop: 10 }}>
                <thead><tr style={{ backgroundColor: '#0f2b4c' }}>
                  <th style={{ ...S.th, width: '50%' }}>Parametro</th>
                  <th style={S.th}>Valor</th>
                </tr></thead>
                <tbody>
                  {[
                    ['Regimen Fiscal', inputs.regimen],
                    ['Tasa de Impuesto', `${(inputs.tasa_impuesto * 100).toFixed(1)}%`],
                    ['Prima PyME', `${(inputs.prima_pyme * 100).toFixed(1)}%`],
                    ['Kd (Tasa de Deuda)', `${(inputs.Kd * 100).toFixed(1)}%`],
                    ['Numero de Empleados', inputs.numero_empleados.toString()],
                    ['Es Informal', fmtBool(inputs.es_informal)],
                    ['Es Microempresa', fmtBool(inputs.es_micro)],
                    ['Deuda Sombra', fmtNum(inputs.deuda_sombra)],
                    ['Deuda FinTech', fmtNum(inputs.deuda_fintech)],
                    ['Atrasos SAT', fmtBool(inputs.atrasos_sat)],
                  ].map(([label, val]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #f0f2f5' }}>
                      <td style={{ padding: '4px 8px', fontSize: 8, color: '#4a5568' }}>{label}</td>
                      <td style={{ padding: '4px 8px', fontSize: 8, fontWeight: 600, color: '#0f2b4c', fontFamily: 'monospace', textAlign: 'right' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* GLOSARIO */}
          <SectionTitle title="Glosario de Terminos" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {GLOSARIO.map(([term, def]) => (
              <div key={term} style={{ padding: '6px 8px', backgroundColor: '#fafbfd', borderRadius: 4, border: '1px solid #e8ebf0' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#0f2b4c', marginBottom: 2 }}>{term}</div>
                <div style={{ fontSize: 7, color: '#6b7a8d', lineHeight: 1.4 }}>{def}</div>
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div style={{ marginTop: 24, paddingTop: 12, borderTop: '2px solid #d4a843', fontSize: 7, color: '#9ba5b3', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
            Zenith GBV &middot; Consultoria Financiera &middot; Documento Confidencial &middot; {new Date().toLocaleDateString('es-MX')}
          </div>

        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES Y ESTILOS
   ═══════════════════════════════════════════════════════════════ */

function KPICard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 10, borderRadius: 6, border: '1px solid #e8ebf0', backgroundColor: '#fafbfd' }}>
      <div style={{ fontSize: 7, fontWeight: 600, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function SectionTitle({ title, color = '#0f2b4c' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${color}30` }}>
      <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</span>
    </div>
  );
}

function TR({ label, value, clasif }: { label: string; value: string; clasif: string }) {
  const dotColor = clasif === 'verde' ? '#10b981' : clasif === 'amarillo' ? '#f59e0b' : clasif === 'rojo' ? '#ef4444' : '#9ba5b3';
  return (
    <tr style={{ borderBottom: '1px solid #f0f2f5' }}>
      <td style={{ padding: '4px 8px', fontSize: 8, color: '#4a5568' }}>{label}</td>
      <td style={{ padding: '4px 8px', fontSize: 8, fontWeight: 700, color: '#0f2b4c', fontFamily: 'monospace' }}>{value}</td>
      <td style={{ padding: '4px 8px' }}>
        {clasif !== '-' && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, display: 'inline-block' }} />}
      </td>
      <td style={{ padding: '4px 8px', fontSize: 7, color: '#9ba5b3', textTransform: 'capitalize' }}>{clasif !== '-' ? clasif : ''}</td>
    </tr>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'Inter, Helvetica, Arial, sans-serif', color: '#0f2b4c', padding: 28, backgroundColor: '#ffffff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '2px solid #d4a843', marginBottom: 16 },
  brand: { fontSize: 14, fontWeight: 800, color: '#0f2b4c' },
  brandSub: { fontSize: 7, fontWeight: 600, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: 1.5 },
  empresaBox: { marginBottom: 14 },
  empresaNombre: { fontSize: 18, fontWeight: 800, color: '#0f2b4c' },
  empresaMeta: { fontSize: 8, color: '#6b7a8d', marginTop: 2 },
  scoreBadge: { fontSize: 10, fontWeight: 700, padding: '3px 10px', border: '1.5px solid', borderRadius: 12, display: 'inline-block' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: 10, fontSize: 8 },
  th: { padding: '5px 8px', textAlign: 'left', color: 'white', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  accionBox: { padding: '8px 10px', borderRadius: 4, border: '1px solid #e8ebf0', backgroundColor: '#fafbfd' },
};

const GLOSARIO: [string, string][] = [
  ['EVA', 'Valor Economico Agregado: Ganancia real despues de cubrir el costo de todo el capital (deuda + patrimonio).'],
  ['ROIC', 'Retorno sobre Capital Invertido: Mide la rentabilidad operativa sobre el capital total invertido en el negocio.'],
  ['WACC', 'Costo Promedio Ponderado de Capital: Tasa minima de retorno que el negocio debe generar para crear valor.'],
  ['NOPAT', 'Utilidad Operativa Neta despues de Impuestos: Ganancia operativa limpia, sin considerar estructura de financiamiento.'],
  ['CCC', 'Ciclo de Conversion de Efectivo: Dias que tarda el negocio en convertir su inversion en inventario en efectivo real.'],
  ['EBITDA', 'Utilidades antes de Intereses, Impuestos, Depreciacion y Amortizacion.'],
  ['KTNO', 'Capital de Trabajo Neto Operativo: Activos corrientes operativos menos pasivos corrientes operativos.'],
  ['Z-Score', 'Indice de Altman que predice probabilidad de quiebra. < 1.8 es zona de peligro.'],
  ['Ke', 'Costo de Patrimonio (Equity): Retorno que exigen los accionistas por invertir en el negocio.'],
  ['Kd', 'Costo de Deuda: Tasa de interes promedio que paga el negocio por su financiamiento.'],
  ['Spread', 'Diferencia ROIC - WACC. Positivo = crea valor. Negativo = destruye valor.'],
  ['DSO', 'Dias de Cobro: Promedio de dias que tarda la empresa en cobrar a sus clientes.'],
  ['DOH', 'Dias de Inventario: Promedio de dias que el inventario permanece en bodega antes de venderse.'],
  ['DPO', 'Dias de Pago: Promedio de dias que tarda la empresa en pagar a sus proveedores.'],
];
