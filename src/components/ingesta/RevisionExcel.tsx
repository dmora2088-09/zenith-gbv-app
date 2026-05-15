import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useDiagnostico } from '@/context/DiagnosticoContext';
import { useFormatters } from '@/hooks/useFormatters';
import { formatearMiles } from '@/lib/formato';
import { DICCIONARIO } from '@/config/diccionario';
import type { IngestaFormData } from '@/types/motor';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileSpreadsheet,
  Building2,
  Calculator,
  Scale,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Clock,
  Percent,
  Zap,
  Info,
  Globe,
} from 'lucide-react';

/** Referencia local al diccionario para legibilidad */
const T = DICCIONARIO.revisionExcel;

/**
 * ================================================================
 * Zenith GBV — RevisionExcel v4 (Fase 2.4)
 *
 * Todos los textos UI se consumen desde DICCIONARIO.
 * El equipo de negocio puede editar src/config/diccionario.ts
 * sin tocar el codigo de los componentes.
 * ================================================================ */

interface RevisionExcelProps {
  fileName: string;
  onVolver: () => void;
}

interface CamposComplementarios {
  moneda: 'MXN' | 'USD';
  num_periodos: 1 | 2 | 3;
  es_informal: boolean;
  deuda_fintech: number;
  deuda_tarjeta: number;
  deuda_agiotista: number;
  credito_pct: number;
  Kd: number;
  prima_pyme: number;
  dso_manual: string;
  doh_manual: string;
  dpo_manual: string;
}

/** Lee ventas_credito_pct del benchmark del sector (motor.js).
 *  Devuelve valor decimal (0..1) o null si no disponible. */
function leerBenchmarkCreditoRaw(sectorId: string): number | null {
  try {
    const bm = (window as any).MotorVBM?.BENCHMARKS?.[sectorId];
    if (bm?.ventas_credito_pct != null) return bm.ventas_credito_pct;
    if (bm?.dias_cobro_pct != null) return bm.dias_cobro_pct;
  } catch { /* motor no disponible */ }
  return null;
}

/** Wrapper para el useState: devuelve decimal (0..1) o fallback. */
function leerBenchmarkCredito(sectorId: string): number | null {
  return leerBenchmarkCreditoRaw(sectorId);
}

/** Icono Info con tooltip */
function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info
            size={13}
            className="text-[#b0b8c4] hover:text-steel-500 cursor-help transition-colors flex-shrink-0 ml-1"
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px]">
          <p className="text-[11px] leading-relaxed text-pretty">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Label con tooltip opcional */
function LabelWithTip({ label, tip }: { label: string; tip?: string }) {
  return (
    <span className="flex items-center">
      {label}
      {tip && <InfoTip text={tip} />}
    </span>
  );
}

/** Texto de contexto tenue debajo de input */
function Leyenda({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-[#9ba5b3] mt-1.5 leading-relaxed text-pretty w-full">
      {children}
    </p>
  );
}

export default function RevisionExcel({ fileName, onVolver }: RevisionExcelProps) {
  const { formData, status, guardarFormData, ejecutarDiagnostico } = useDiagnostico();
  const { fmt } = useFormatters();
  const navigate = useNavigate();

  // ── Datos del Excel ────────────────────────────────────────
  const p1a = formData?.p1a;
  const p1b = formData?.p1b;
  const p1c = formData?.p1c;
  const p1d = formData?.p1d;
  const p1e = formData?.p1e;
  const sectorId = p1a?.sector_id ?? '07';

  // ── Valores pre-calculados (Año Comercial = 360 días) ─────
  const preCalc = useMemo(() => {
    const ventas = p1c?.ventas ?? 0;
    const cogs = p1c?.cogs ?? 0;
    const cxc = p1d?.cuentas_por_cobrar ?? 0;
    const inv = p1d?.inventarios ?? 0;
    const cxp = p1d?.cuentas_por_pagar ?? 0;

    const dso = ventas > 0 ? Math.round((cxc / ventas) * 360) : null;
    const doh = cogs > 0 ? Math.round((inv / cogs) * 360) : null;
    const dpo = cogs > 0 ? Math.round((cxp / cogs) * 360) : null;

    const creditoBenchmark = leerBenchmarkCreditoRaw(sectorId);

    return { dso, doh, dpo, creditoBenchmark };
  }, [p1c, p1d, sectorId]);

  /* Resolver nombre del sector desde BENCHMARKS del motor */
  const sectorNombre = useMemo(() => {
    try {
      const bench = (window as any).MotorVBM?.BENCHMARKS;
      if (bench) {
        for (const tipo of ['comercio', 'industria', 'servicios'] as const) {
          const s = bench[tipo]?.find((x: any) => x.id === sectorId);
          if (s) return `${s.id} - ${s.nombre}`;
        }
      }
    } catch { /* motor no cargado */ }
    return sectorId;
  }, [sectorId]);

  /* ── Macro del motor ──────────────────────────────────────
     Lee window.MotorVBM.MACRO con las llaves EXACTAS del motor:
     Rf, ERP, CRP, inflacion_INPC, t_ISR_PM, t_RESICO,
     Kd_default, primaPyME_formal, primaPyME_micro,
     TIIE_28, CETES_28, tipo_cambio_USD_MXN, fecha_corte
     ────────────────────────────────────────────────────────── */
  interface MacroItem {
    label: string;
    value: string;
    tooltip: string;
  }

  const macroItems: MacroItem[] | null = useMemo(() => {
    try {
      const m = (window as any).MotorVBM?.MACRO;
      if (!m) return null;
      const cfg = T.macro.parametros;

      function fmt(key: string, format: 'pct2' | 'pct1' | 'num' | 'text'): string | null {
        const v = m[key];
        if (v == null) return null;
        if (format === 'pct2' && typeof v === 'number') return `${(v * 100).toFixed(2)}%`;
        if (format === 'pct1' && typeof v === 'number') return `${(v * 100).toFixed(1)}%`;
        if (format === 'num' && typeof v === 'number') return v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return String(v);
      }

      const items: MacroItem[] = [];
      const add = (key: string) => {
        const c = (cfg as Record<string, { label: string; tooltip: string; formato: string }>)[key];
        if (!c) return;
        const val = fmt(key, c.formato as 'pct2' | 'pct1' | 'num' | 'text');
        if (val !== null) items.push({ label: c.label, value: val, tooltip: c.tooltip });
      };

      add('Rf');
      add('ERP');
      add('CRP');
      add('inflacion_INPC');
      add('Kd_default');
      add('t_ISR_PM');
      add('t_RESICO');
      add('primaPyME_formal');
      add('primaPyME_micro');
      add('TIIE_28');
      add('CETES_28');
      add('tipo_cambio_USD_MXN');
      add('fecha_corte');

      return items.length > 0 ? items : null;
    } catch {
      return null;
    }
  }, []);

  // ── Estado campos complementarios ──────────────────────────
  const [comp, setComp] = useState<CamposComplementarios>({
    moneda: p1a?.moneda ?? 'MXN',
    num_periodos: p1a?.num_periodos ?? 1,
    es_informal: p1a?.es_informal ?? false,
    deuda_fintech: p1b?.deuda_fintech ?? 0,
    deuda_tarjeta: p1b?.deuda_tarjeta ?? 0,
    deuda_agiotista: p1b?.deuda_agiotista ?? 0,
    credito_pct: (p1e?.credito_pct ?? leerBenchmarkCredito(sectorId) ?? 0.50) * 100,
    Kd: (p1e?.Kd ?? 0.16) * 100,
    prima_pyme: (p1e?.prima_pyme ?? 0.05) * 100,
    dso_manual: p1e?.dso_manual?.toString() ?? '',
    doh_manual: p1e?.doh_manual?.toString() ?? '',
    dpo_manual: p1e?.dpo_manual?.toString() ?? '',
  });

  const updateComp = <K extends keyof CamposComplementarios>(
    field: K,
    value: CamposComplementarios[K]
  ) => setComp((c) => ({ ...c, [field]: value }));

  const handleEjecutar = async () => {
    if (!formData) return;

    /* Fusionar datos del Excel (formData) con campos complementarios (comp).
       Los porcentajes de la UI (0-100) se convierten a decimales (0-1)
       para el motor. Los dias vacios se pasan como null. */
    const newForm: IngestaFormData = {
      ...formData,
      p1a: {
        ...formData.p1a,
        moneda: comp.moneda,
        num_periodos: comp.num_periodos,
        es_informal: comp.es_informal,
      },
      p1b: {
        ...formData.p1b,
        deuda_fintech: comp.deuda_fintech,
        deuda_tarjeta: comp.deuda_tarjeta,
        deuda_agiotista: comp.deuda_agiotista,
      },
      p1e: {
        ...formData.p1e,
        credito_pct: comp.credito_pct / 100,
        Kd: comp.Kd / 100,
        prima_pyme: comp.prima_pyme / 100,
        dso_manual: comp.dso_manual === '' ? null : Number(comp.dso_manual),
        doh_manual: comp.doh_manual === '' ? null : Number(comp.doh_manual),
        dpo_manual: comp.dpo_manual === '' ? null : Number(comp.dpo_manual),
      },
    };

    guardarFormData(newForm);
    await new Promise((r) => setTimeout(r, 150));
    await ejecutarDiagnostico();
    navigate('/dashboard');
  };

  const val = (n: number | undefined) => {
    if (n === undefined || isNaN(n) || n === 0) return T.genericos.noDisponible;
    return fmt(n);
  };
  const valN = (n: number | undefined) => {
    if (n === undefined || isNaN(n) || n === 0) return T.genericos.noDisponible;
    return n.toLocaleString('es-MX');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="w-8 h-8 rounded-lg border border-[#d1d8e2] flex items-center justify-center text-[#6b7a8d] hover:text-navy-900 hover:border-navy-300 transition-colors"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-navy-900 tracking-tight">
              {T.header.titulo}
            </h2>
            <p className="text-xs text-[#6b7a8d] flex items-center gap-1.5 mt-0.5">
              <FileSpreadsheet size={12} className="text-steel-500" />
              {fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Boton Parametros Macro */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#d1d8e2] text-navy-600 hover:bg-pearl hover:border-navy-300 transition-colors">
                <Globe size={12} />
                {T.header.botonMacro}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <Globe size={16} className="text-steel-500" />
                  {T.macro.tituloDialog}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6b7a8d] text-pretty w-full">
                  {T.macro.descripcionDialog}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-2 max-h-[400px] overflow-y-auto zn-scrollbar pr-1">
                {macroItems ? (
                  macroItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-3 py-2.5 rounded-md bg-pearl gap-3"
                    >
                      <span className="flex items-center text-xs font-medium text-navy-700">
                        {item.label}
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info
                                size={12}
                                className="text-[#b0b8c4] hover:text-steel-500 cursor-help transition-colors flex-shrink-0 ml-1"
                              />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[260px]">
                              <p className="text-[11px] leading-relaxed text-pretty">{item.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      <span className="text-xs font-bold font-mono text-navy-900 whitespace-nowrap">{item.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#9ba5b3] py-4 text-center">
                    {T.macro.errorCarga}
                  </p>
                )}
              </div>
              <p className="text-[10px] text-[#9ba5b3] text-center mt-2 pt-2 border-t border-[#e8ebf0] text-pretty w-full">
                {T.macro.fuente}
              </p>
            </DialogContent>
          </Dialog>

          {/* Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-light border border-success/20">
            <CheckCircle2 size={14} className="text-success" />
            <span className="text-xs font-semibold text-success">{T.header.badgeExito}</span>
          </div>
        </div>
      </div>

      {/* ===== PARTE SUPERIOR: Cards read-only ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Negocio */}
        <div className="zn-card overflow-hidden">
          <div className="zn-card-header bg-pearl/50">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-steel-500" />
              <span className="zn-card-title">{T.cards.negocio.titulo}</span>
            </div>
            <span className="text-[10px] font-medium text-[#9ba5b3] uppercase tracking-wider">
              {T.cards.negocio.fuente}
            </span>
          </div>
          <div className="zn-card-body space-y-2.5">
            <DataRow label={T.cards.negocio.labels.empresa} value={p1a?.nombre_empresa || T.genericos.noDisponible} />
            <DataRow label={T.cards.negocio.labels.periodo} value={p1a?.periodo_analizar?.toString() || T.genericos.noDisponible} />
            <DataRow label={T.cards.negocio.labels.sector} value={sectorNombre || T.genericos.noDisponible} />
            <DataRow label={T.cards.negocio.labels.empleados} value={valN(p1a?.numero_empleados)} />
            <DataRow label={T.cards.negocio.labels.ventasAprox} value={val(p1a?.ventas_aprox)} />
            <DataRow label={T.cards.negocio.labels.regimen} value={
  p1a?.regimen ? ((T.cards.negocio as unknown as Record<string, string>)[`regimen_${p1a.regimen}`] || p1a.regimen) : '-'
} />
            <DataRow label={T.cards.negocio.labels.moneda} value={p1a?.moneda || 'MXN'} />
            <DataRow label={T.cards.negocio.labels.estrato} value={p1a?.es_micro ? T.cards.negocio.labels.estratoMicro : T.cards.negocio.labels.estratoPyME} />
          </div>
        </div>

        {/* Estado de Resultados */}
        <div className="zn-card overflow-hidden">
          <div className="zn-card-header bg-pearl/50">
            <div className="flex items-center gap-2">
              <Calculator size={15} className="text-steel-500" />
              <span className="zn-card-title">{T.cards.estadoResultados.titulo}</span>
            </div>
            <span className="text-[10px] font-medium text-[#9ba5b3] uppercase tracking-wider">
              {T.cards.estadoResultados.fuente}
            </span>
          </div>
          <div className="zn-card-body space-y-2.5">
            <DataRow label={T.cards.estadoResultados.labels.ventas} value={val(p1c?.ventas)} highlight />
            <DataRow label={T.cards.estadoResultados.labels.costoVentas} value={val(p1c?.cogs)} />
            <DataRow label={T.cards.estadoResultados.labels.gastosAdm} value={val(p1c?.gastos_adm)} />
            <DataRow label={T.cards.estadoResultados.labels.gastosVta} value={val(p1c?.gastos_vta)} />
            <DataRow label={T.cards.estadoResultados.labels.depreciacion} value={val(p1c?.da)} />
            <DataRow label={T.cards.estadoResultados.labels.gastosFinancieros} value={val(p1c?.gastos_financieros)} />
            <div className="pt-2 border-t border-[#e8ebf0]">
              <DataRow
                label={T.cards.estadoResultados.labels.utilidadBruta}
                value={p1c?.ventas && p1c?.cogs ? fmt(p1c.ventas - p1c.cogs) : T.genericos.noDisponible}
                bold
              />
            </div>
          </div>
        </div>

        {/* Balance General */}
        <div className="zn-card overflow-hidden">
          <div className="zn-card-header bg-pearl/50">
            <div className="flex items-center gap-2">
              <Scale size={15} className="text-steel-500" />
              <span className="zn-card-title">{T.cards.balanceGeneral.titulo}</span>
            </div>
            <span className="text-[10px] font-medium text-[#9ba5b3] uppercase tracking-wider">
              {T.cards.balanceGeneral.fuente}
            </span>
          </div>
          <div className="zn-card-body space-y-2.5">
            <DataRow label={T.cards.balanceGeneral.labels.cajaBancos} value={val(p1d?.caja_bancos)} />
            <DataRow label={T.cards.balanceGeneral.labels.cuentasCobrar} value={val(p1d?.cuentas_por_cobrar)} />
            <DataRow label={T.cards.balanceGeneral.labels.inventarios} value={val(p1d?.inventarios)} />
            <DataRow label={T.cards.balanceGeneral.labels.activosFijos} value={val(p1d?.activos_fijos_netos)} />
            <div className="pt-1 border-t border-[#f0f2f5]" />
            <DataRow label={T.cards.balanceGeneral.labels.deudaCP} value={val(p1d?.deuda_financiera_cp)} />
            <DataRow label={T.cards.balanceGeneral.labels.deudaLP} value={val(p1d?.deuda_financiera_lp)} />
            <DataRow label={T.cards.balanceGeneral.labels.cuentasPagar} value={val(p1d?.cuentas_por_pagar)} />
            <DataRow label={T.cards.balanceGeneral.labels.patrimonio} value={val(p1d?.patrimonio)} highlight />
          </div>
        </div>
      </div>

      {/* ===== PARTE INFERIOR: Campos Complementarios ===== */}
      <div className="zn-card">
        <div className="zn-card-header">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-steel-500" />
            <span className="zn-card-title">Datos Complementarios Requeridos</span>
          </div>
        </div>

        <div className="zn-card-body">
          {/* Seccion: Configuracion del Negocio */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 size={12} className="text-steel-500" />
              {T.configNegocio.tituloSeccion}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy-700 mb-1.5">
                  {T.configNegocio.moneda.label}
                </label>
                <div className="flex gap-2">
                  {(['MXN', 'USD'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateComp('moneda', m)}
                      className={`flex-1 h-9 rounded-md text-xs font-medium border transition-all ${comp.moneda === m ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-700 border-[#d1d8e2] hover:border-navy-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <Leyenda>{T.configNegocio.moneda.leyenda}</Leyenda>
              </div>

              <div>
                <label className="block text-xs font-medium text-navy-700 mb-1.5">
                  {T.configNegocio.periodos.label}
                </label>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => updateComp('num_periodos', n)}
                      className={`flex-1 h-9 rounded-md text-xs font-medium border transition-all ${comp.num_periodos === n ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-700 border-[#d1d8e2] hover:border-navy-300'}`}
                    >
                      {n} {n === 1 ? T.configNegocio.periodos.opcionPeriodo : T.configNegocio.periodos.opcionPeriodos}
                    </button>
                  ))}
                </div>
                <Leyenda>{T.configNegocio.periodos.leyenda}</Leyenda>
              </div>

              <div>
                <label className="block text-xs font-medium text-navy-700 mb-1.5">
                  {T.configNegocio.informal.label}
                </label>
                <button
                  onClick={() => updateComp('es_informal', !comp.es_informal)}
                  className={`w-full h-9 rounded-md text-xs font-medium border transition-all ${comp.es_informal ? 'bg-warning-light text-warning-dark border-warning/30' : 'bg-white text-navy-700 border-[#d1d8e2] hover:border-navy-300'}`}
                >
                  {comp.es_informal ? T.configNegocio.informal.valorSi : T.configNegocio.informal.valorNo}
                </button>
                <Leyenda>{T.configNegocio.informal.leyenda}</Leyenda>
              </div>
            </div>
          </div>

          {/* Seccion: Deuda Sombra */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-warning" />
              {T.deudaSombra.tituloSeccion}
              <InfoTip text={T.deudaSombra.tooltipSeccion} />
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CompInput
                label={<LabelWithTip label={T.deudaSombra.deudaFintech.label} tip={T.deudaSombra.deudaFintech.tooltip} />}
                value={comp.deuda_fintech}
                onChange={(v) => updateComp('deuda_fintech', v)}
                prefix="$"
              >
                <Leyenda>{T.deudaSombra.deudaFintech.leyenda}</Leyenda>
              </CompInput>

              <CompInput
                label={<LabelWithTip label={T.deudaSombra.deudaTarjeta.label} tip={T.deudaSombra.deudaTarjeta.tooltip} />}
                value={comp.deuda_tarjeta}
                onChange={(v) => updateComp('deuda_tarjeta', v)}
                prefix="$"
              >
                <Leyenda>{T.deudaSombra.deudaTarjeta.leyenda}</Leyenda>
              </CompInput>

              <CompInput
                label={<LabelWithTip label={T.deudaSombra.deudaAgiotista.label} tip={T.deudaSombra.deudaAgiotista.tooltip} />}
                value={comp.deuda_agiotista}
                onChange={(v) => updateComp('deuda_agiotista', v)}
                prefix="$"
              >
                <Leyenda>{T.deudaSombra.deudaAgiotista.leyenda}</Leyenda>
              </CompInput>
            </div>
            {comp.deuda_fintech + comp.deuda_tarjeta + comp.deuda_agiotista > 0 && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md bg-warning-light border border-warning/20">
                <span className="text-xs text-warning-dark font-medium">
                  {T.deudaSombra.badgeTotal}: {fmt(comp.deuda_fintech + comp.deuda_tarjeta + comp.deuda_agiotista)}
                </span>
              </div>
            )}
          </div>

          {/* Seccion: Parametros del Costo de Capital */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Percent size={12} className="text-steel-500" />
              {T.parametrosWACC.tituloSeccion}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Slider credito_pct */}
              <div>
                <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
                  <LabelWithTip label={T.parametrosWACC.ventasCredito.label} tip={T.parametrosWACC.ventasCredito.tooltip} />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={0} max={100}
                    value={comp.credito_pct}
                    onChange={(e) => updateComp('credito_pct', Number(e.target.value))}
                    className="flex-1 accent-navy-900 h-1.5 bg-[#e8ebf0] rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-navy-900 w-12 text-right">{comp.credito_pct}%</span>
                </div>
                <Leyenda>
                  {preCalc.creditoBenchmark !== null
                    ? <>{T.parametrosWACC.ventasCredito.leyendaSugerido}: <strong>{(preCalc.creditoBenchmark * 100).toFixed(0)}%</strong></>
                    : T.parametrosWACC.ventasCredito.leyendaRango
                  }
                </Leyenda>
              </div>

              {/* Kd */}
              <CompInput
                label={<LabelWithTip label={T.parametrosWACC.tasaInteres.label} tip={T.parametrosWACC.tasaInteres.tooltip} />}
                value={comp.Kd}
                onChange={(v) => updateComp('Kd', v)}
                suffix="%"
                step={0.1}
              >
                <Leyenda>{T.parametrosWACC.tasaInteres.leyenda}</Leyenda>
              </CompInput>

              {/* Prima PyME */}
              <CompInput
                label={<LabelWithTip label={T.parametrosWACC.primaPyME.label} tip={T.parametrosWACC.primaPyME.tooltip} />}
                value={comp.prima_pyme}
                onChange={(v) => updateComp('prima_pyme', v)}
                suffix="%"
                step={0.1}
              >
                <Leyenda>{T.parametrosWACC.primaPyME.leyenda}</Leyenda>
              </CompInput>
            </div>
          </div>

          {/* Seccion: Dias del Ciclo de Efectivo */}
          <div className="mb-2">
            <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock size={12} className="text-steel-500" />
              {T.diasCiclo.tituloSeccion}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dias de Cobro */}
              <CompInput
                label={<LabelWithTip label={T.diasCiclo.diasCobro.label} tip={T.diasCiclo.diasCobro.tooltip} />}
                value={comp.dso_manual === '' ? '' : Number(comp.dso_manual)}
                onChange={(v) => updateComp('dso_manual', v === 0 ? '' : String(v))}
                placeholder={preCalc.dso !== null ? `${T.diasCiclo.diasCobro.placeholderAuto}: ${preCalc.dso}` : T.diasCiclo.diasCobro.placeholderAuto}
                optional
              >
                <Leyenda>
                  {preCalc.dso !== null
                    ? <>{T.diasCiclo.diasCobro.leyendaCalculado}: <strong>{preCalc.dso} dias</strong> {T.diasCiclo.diasCobro.formula}</>
                    : T.diasCiclo.diasCobro.leyendaManual
                  }
                </Leyenda>
              </CompInput>

              {/* Dias de Inventario */}
              <CompInput
                label={<LabelWithTip label={T.diasCiclo.diasInventario.label} tip={T.diasCiclo.diasInventario.tooltip} />}
                value={comp.doh_manual === '' ? '' : Number(comp.doh_manual)}
                onChange={(v) => updateComp('doh_manual', v === 0 ? '' : String(v))}
                placeholder={preCalc.doh !== null ? `${T.diasCiclo.diasInventario.placeholderAuto}: ${preCalc.doh}` : T.diasCiclo.diasInventario.placeholderAuto}
                optional
              >
                <Leyenda>
                  {preCalc.doh !== null
                    ? <>{T.diasCiclo.diasInventario.leyendaCalculado}: <strong>{preCalc.doh} dias</strong> {T.diasCiclo.diasInventario.formula}</>
                    : T.diasCiclo.diasInventario.leyendaManual
                  }
                </Leyenda>
              </CompInput>

              {/* Dias de Pago */}
              <CompInput
                label={<LabelWithTip label={T.diasCiclo.diasPago.label} tip={T.diasCiclo.diasPago.tooltip} />}
                value={comp.dpo_manual === '' ? '' : Number(comp.dpo_manual)}
                onChange={(v) => updateComp('dpo_manual', v === 0 ? '' : String(v))}
                placeholder={preCalc.dpo !== null ? `${T.diasCiclo.diasPago.placeholderAuto}: ${preCalc.dpo}` : T.diasCiclo.diasPago.placeholderAuto}
                optional
              >
                <Leyenda>
                  {preCalc.dpo !== null
                    ? <>{T.diasCiclo.diasPago.leyendaCalculado}: <strong>{preCalc.dpo} dias</strong> {T.diasCiclo.diasPago.formula}</>
                    : T.diasCiclo.diasPago.leyendaManual
                  }
                </Leyenda>
              </CompInput>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Boton Ejecutar ===== */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onVolver} className="zn-btn-secondary">
          <ArrowLeft size={14} className="mr-1.5" /> {T.header.botonVolver}
        </button>
        <button
          onClick={handleEjecutar}
          disabled={status === 'calculando'}
          className="zn-btn-primary px-8"
        >
          {status === 'calculando' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              {T.header.estadoCalculando}
            </>
          ) : (
            <>
              <Zap size={15} className="mr-2" />
              {T.header.botonEjecutar}
              <ChevronRight size={14} className="ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ═══════════════════════════════════════════════════════════════ */

function DataRow({ label, value, highlight, bold }: {
  label: string; value: string; highlight?: boolean; bold?: boolean;
}) {
  /* Si el valor parece un numero entero grande, formatear con comas */
  const numericVal = parseFloat(value.replace(/,/g, ''));
  const display = !isNaN(numericVal) && numericVal >= 1000 && value.match(/^\d{4,}$/)
    ? formatearMiles(numericVal)
    : value;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#6b7a8d]">{label}</span>
      <span className={`text-xs font-mono ${highlight ? 'font-bold text-navy-900' : bold ? 'font-semibold text-navy-800' : 'text-navy-700'}`}>
        {display}
      </span>
    </div>
  );
}

interface CompInputProps {
  label: React.ReactNode;
  value: number | string;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  optional?: boolean;
  step?: number;
  children?: React.ReactNode;
}

function CompInput({ label, value, onChange, prefix, suffix, placeholder, optional, step = 1, children }: CompInputProps) {
  const display = typeof value === 'string' ? value : (value === 0 && placeholder ? '' : value.toString());
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        {label}
        {optional && <span className="text-[10px] text-[#9ba5b3] font-normal ml-1">{T.genericos.opcional}</span>}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9ba5b3]">{prefix}</span>}
        <input
          type="number" step={step} value={display} placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '' || raw === '-') { onChange(0); return; }
            const parsed = step < 1 ? parseFloat(raw) : parseInt(raw, 10);
            onChange(isNaN(parsed) ? 0 : parsed);
          }}
          className={`zn-input w-full ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-8' : ''}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9ba5b3]">{suffix}</span>}
      </div>
      {children}
    </div>
  );
}
