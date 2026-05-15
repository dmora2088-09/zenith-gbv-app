import React from "react";

type SemaforoEstado = "Crítico" | "En Riesgo" | "Estable" | "Óptimo" | string;

type EstrategiaAlta = {
  fase: string;
  estrategia: string;
  kpi: string;
};

type ReporteEjecutivoData = {
  nombreEmpresa: string;
  fecha: string;
  folio: string;
  score: number;
  veredicto: string;
  evaActual: string;
  evaProyectado: string;
  deltaEva: string;
  semaforoRentabilidad: SemaforoEstado;
  semaforoLiquidez: SemaforoEstado;
  semaforoEstructura: SemaforoEstado;
  roic: string;
  wacc: string;
  margenNeto: string;
  razonCorriente: string;
  diasCaja: string;
  deRatio: string;
  cobertura: string;
  alertas: string[];
  estrategiasPrioridadAlta: EstrategiaAlta[];
  consultor?: string;
};

type ReporteEjecutivoPrintProps = {
  data: ReporteEjecutivoData;
};

const getSemaforoClass = (estado: SemaforoEstado) => {
  const normalized = estado.toLowerCase();
  if (normalized.includes("crítico") || normalized.includes("critico")) {
    return { dot: "bg-red-600", badge: "bg-red-50 text-red-700 border-red-200" };
  }
  if (normalized.includes("riesgo")) {
    return { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (normalized.includes("estable")) {
    return { dot: "bg-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (normalized.includes("óptimo") || normalized.includes("optimo")) {
    return { dot: "bg-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  return { dot: "bg-slate-500", badge: "bg-slate-50 text-slate-700 border-slate-200" };
};

const MetricLine = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-1.5 text-[10px]">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

const SemaforoCard = ({ title, estado, children }: { title: string; estado: SemaforoEstado; children: React.ReactNode }) => {
  const styles = getSemaforoClass(estado);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
            <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#0A192F]">{title}</h3>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${styles.badge}`}>
          {estado}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default function ReporteEjecutivoPrint({ data }: ReporteEjecutivoPrintProps) {
  const consultor = data.consultor || "Consultor Financiero — Zenith GBV Financial Consulting";
  return (
    <main className="mx-auto min-h-[297mm] w-[210mm] bg-white text-black print:mx-0 print:min-h-[297mm] print:w-[210mm]">
      <div className="flex min-h-[297mm] flex-col px-[18mm] py-[14mm] font-sans">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo-azul.png" alt="Zenith GBV" className="h-12 w-12 object-contain" />
              <div>
                <p className="text-[13px] font-bold tracking-[0.18em] text-[#0A192F]">ZENITH GBV</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">Financial Consulting</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">Reporte Ejecutivo</p>
              <h1 className="mt-1 text-[20px] font-bold leading-tight text-[#0A192F]">Diagnóstico de Valor</h1>
              <div className="mt-4 space-y-1 text-[10px] text-slate-600">
                <p><span className="font-semibold text-slate-900">Elaborado para:</span> {data.nombreEmpresa}</p>
                <p><span className="font-semibold text-slate-900">Fecha:</span> {data.fecha}</p>
                <p><span className="font-semibold text-slate-900">Folio:</span> {data.folio}</p>
              </div>
            </div>
          </div>
        </header>
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-[#D4AF37]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">01</p>
              <h2 className="text-[16px] font-bold text-[#0A192F]">Resumen Ejecutivo</h2>
            </div>
          </div>
          <div className="rounded-[24px] bg-[#0A192F] p-6 text-white shadow-sm">
            <div className="grid grid-cols-[1.15fr_0.85fr] gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Score Global</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-[56px] font-black leading-none tracking-tight">{data.score}</span>
                  <span className="mb-2 text-[18px] font-semibold text-slate-300">/100</span>
                </div>
                <p className="mt-4 max-w-[95%] text-[14px] font-semibold leading-snug text-white">{data.veredicto}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">Lectura de Valor</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400">EVA Actual</p>
                    <p className="mt-1 text-[18px] font-bold text-white">{data.evaActual}</p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400">EVA Proyectado</p>
                    <p className="mt-1 text-[18px] font-bold text-white">{data.evaProyectado}</p>
                  </div>
                  <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">Delta EVA</p>
                    <p className="mt-1 text-[15px] font-black text-white">{data.deltaEva}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-[#D4AF37]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">02</p>
              <h2 className="text-[16px] font-bold text-[#0A192F]">Semáforos Financieros</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SemaforoCard title="Rentabilidad" estado={data.semaforoRentabilidad}>
              <MetricLine label="ROIC" value={data.roic} />
              <MetricLine label="WACC" value={data.wacc} />
              <MetricLine label="Margen Neto" value={data.margenNeto} />
            </SemaforoCard>
            <SemaforoCard title="Liquidez" estado={data.semaforoLiquidez}>
              <MetricLine label="Razón Corriente" value={data.razonCorriente} />
              <MetricLine label="Días de Caja" value={data.diasCaja} />
            </SemaforoCard>
            <SemaforoCard title="Estructura" estado={data.semaforoEstructura}>
              <MetricLine label="D/E Ratio" value={data.deRatio} />
              <MetricLine label="Cobertura" value={data.cobertura} />
            </SemaforoCard>
          </div>
        </section>
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-[#D4AF37]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">03</p>
              <h2 className="text-[16px] font-bold text-[#0A192F]">Alertas Críticas</h2>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            {data.alertas.length > 0 ? (
              <ul className="space-y-3">
                {data.alertas.map((alerta, index) => (
                  <li key={`${alerta}-${index}`} className="flex gap-3">
                    <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-[#0A192F]" />
                    <p className="text-[11px] leading-relaxed text-slate-700">{alerta}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500">No se identificaron alertas críticas en el diagnóstico actual.</p>
            )}
          </div>
        </section>
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-[#D4AF37]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">04</p>
              <h2 className="text-[16px] font-bold text-[#0A192F]">Hoja de Ruta a 90 Días</h2>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0A192F] text-white">
                  <th className="w-[22%] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em]">Fase</th>
                  <th className="w-[53%] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em]">Estrategia</th>
                  <th className="w-[25%] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.18em]">KPI</th>
                </tr>
              </thead>
              <tbody>
                {data.estrategiasPrioridadAlta.length > 0 ? (
                  data.estrategiasPrioridadAlta.map((item, index) => (
                    <tr key={`${item.fase}-${item.estrategia}-${index}`} className="border-b border-slate-100 last:border-b-0">
                      <td className="bg-slate-50 px-4 py-3 align-top text-[10px] font-bold text-[#0A192F]">{item.fase}</td>
                      <td className="px-4 py-3 align-top text-[10px] leading-relaxed text-slate-700">{item.estrategia}</td>
                      <td className="px-4 py-3 align-top text-[10px] font-semibold leading-relaxed text-slate-800">{item.kpi}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-5 text-center text-[11px] text-slate-500">No hay estrategias de prioridad alta activadas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <div className="flex-1" />
        <footer className="mt-8 border-t border-slate-200 pt-6">
          <div className="grid grid-cols-2 gap-10">
            <div>
              <div className="mb-2 h-px w-full bg-slate-400" />
              <p className="text-center text-[10px] font-semibold text-slate-800">{consultor}</p>
              <p className="mt-1 text-center text-[9px] uppercase tracking-[0.14em] text-slate-400">Consultor Financiero</p>
            </div>
            <div>
              <div className="mb-2 h-px w-full bg-slate-400" />
              <p className="text-center text-[10px] font-semibold text-slate-800">{data.nombreEmpresa}</p>
              <p className="mt-1 text-center text-[9px] uppercase tracking-[0.14em] text-slate-400">Cliente</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-[8px] text-slate-400">
            <p>Confidencial — Uso exclusivo de {data.nombreEmpresa} y Zenith GBV Financial Consulting</p>
            <p>{data.folio}</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
