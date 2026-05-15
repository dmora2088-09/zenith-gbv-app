import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useDiagnostico } from '@/context/DiagnosticoContext';
import { DICCIONARIO } from '@/config/diccionario';
import InputMiles from '@/components/ui/InputMiles';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Building2,
  Calculator,
  Scale,
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Zap,
  CheckCircle2,
  Info,
  RotateCcw,
} from 'lucide-react';
import type {
  IngestaFormData,
  Paso1aNegocio,
  Paso1bAjustes,
  Paso1cEstadoResultados,
  Paso1dBalance,
  Paso1eOperativos,
} from '@/types/motor';

const T = DICCIONARIO.wizard;

/* ═══════════════════════════════════════════════════════════════
   TIPOS
   ═══════════════════════════════════════════════════════════════ */

interface WizardManualProps {
  onVolver: () => void;
}

/** Estado del formulario — local al wizard */
interface WizardFormState {
  p1a: Paso1aNegocio;
  p1b: Paso1bAjustes;
  p1c: Paso1cEstadoResultados;
  p1d: Paso1dBalance;
  p1e: Paso1eOperativos;
}

type PasoWizard = 1 | 2 | 3 | 4 | 5;

/* ═══════════════════════════════════════════════════════════════
   ESTADO INICIAL (defaults)
   ═══════════════════════════════════════════════════════════════ */

function crearEstadoInicial(): WizardFormState {
  return {
    p1a: {
      nombre_empresa: '',
      periodo_analizar: new Date().getFullYear(),
      sector_id: '07',
      numero_empleados: 0,
      ventas_aprox: 0,
      moneda: 'MXN',
      num_periodos: 1,
      regimen: 'PM_30',
      tasa_impuesto: 0.30,
      tasa_isr_manual: null,
      es_informal: false,
      sector_tipo: 'industria',
      es_micro: false,
    },
    p1b: {
      retiros_propietario: 0,
      gastos_personales_empresa: 0,
      ventas_no_facturadas: 0,
      sueldo_imputado: 0,
      deuda_fintech: 0,
      deuda_tarjeta: 0,
      deuda_agiotista: 0,
      deuda_sombra: 0,
    },
    p1c: {
      ventas: 0,
      cogs: 0,
      gastos_adm: 0,
      gastos_vta: 0,
      da: 0,
      ing_no_op: 0,
      gto_no_op: 0,
      gastos_financieros: 0,
      capex: 0,
    },
    p1d: {
      caja_bancos: 0,
      cuentas_por_cobrar: 0,
      inventarios: 0,
      otros_activos_corrientes: 0,
      activos_fijos_netos: 0,
      otros_activos_no_corrientes: 0,
      cuentas_por_pagar: 0,
      deuda_financiera_cp: 0,
      otros_pasivos_corrientes: 0,
      deuda_financiera_lp: 0,
      otros_pasivos_nc: 0,
      capital_social: 0,
      utilidades_retenidas: 0,
      patrimonio: 0,
      activo_total: 0,
      pasivo_total: 0,
      deuda_total: 0,
    },
    p1e: {
      credito_pct: 0.50,
      Kd: 0.16,
      prima_pyme: 0.05,
      dso_manual: null,
      doh_manual: null,
      dpo_manual: null,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTES COMPARTIDOS
   ═══════════════════════════════════════════════════════════════ */

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
function LabelWithTip({ label, tip, opcional }: { label: string; tip?: string; opcional?: boolean }) {
  return (
    <span className="flex items-center">
      {label}
      {tip && <InfoTip text={tip} />}
      {opcional && <span className="text-[10px] text-[#9ba5b3] font-normal ml-1">(opcional)</span>}
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

/** Input numerico del wizard */
function WizInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  tip,
  opcional,
  step = 1,
  min,
  max,
  leyenda,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  tip?: string;
  opcional?: boolean;
  step?: number;
  min?: number;
  max?: number;
  leyenda?: React.ReactNode;
  disabled?: boolean;
}) {
  const display = value === 0 && placeholder ? '' : value.toString();
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        <LabelWithTip label={label} tip={tip} opcional={opcional} />
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9ba5b3]">{prefix}</span>}
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={display}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            if (disabled) return;
            const raw = e.target.value;
            if (raw === '' || raw === '-') { onChange(0); return; }
            const parsed = step < 1 ? parseFloat(raw) : parseInt(raw, 10);
            onChange(isNaN(parsed) ? 0 : parsed);
          }}
          className={`zn-input w-full ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-8' : ''} ${disabled ? 'opacity-50 cursor-not-allowed bg-pearl' : ''}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9ba5b3]">{suffix}</span>}
      </div>
      {leyenda && <Leyenda>{leyenda}</Leyenda>}
    </div>
  );
}

/** Input monetario del wizard — muestra comas separadoras de miles */
function WizInputMiles({
  label,
  value,
  onChange,
  prefix,
  placeholder,
  tip,
  opcional,
  leyenda,
  disabled,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  placeholder?: string;
  tip?: string;
  opcional?: boolean;
  leyenda?: React.ReactNode;
  disabled?: boolean;
  min?: number;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        <LabelWithTip label={label} tip={tip} opcional={opcional} />
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9ba5b3] z-10">{prefix}</span>}
        <InputMiles
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          className={`w-full ${prefix ? 'pl-6' : ''}`}
        />
      </div>
      {leyenda && <Leyenda>{leyenda}</Leyenda>}
    </div>
  );
}

/** Input de texto del wizard */
function WizTextInput({
  label,
  value,
  onChange,
  placeholder,
  tip,
  leyenda,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tip?: string;
  leyenda?: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        <LabelWithTip label={label} tip={tip} />
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="zn-input w-full"
      />
      {leyenda && <Leyenda>{leyenda}</Leyenda>}
    </div>
  );
}

/** Toggle booleano */
function WizToggle({
  label,
  value,
  onChange,
  textOn,
  textOff,
  tip,
  leyenda,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  textOn: string;
  textOff: string;
  tip?: string;
  leyenda?: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        <LabelWithTip label={label} tip={tip} />
      </label>
      <button
        onClick={() => onChange(!value)}
        className={`w-full h-9 rounded-md text-xs font-medium border transition-all ${
          value
            ? 'bg-warning-light text-warning-dark border-warning/30'
            : 'bg-white text-navy-700 border-[#d1d8e2] hover:border-navy-300'
        }`}
      >
        {value ? textOn : textOff}
      </button>
      {leyenda && <Leyenda>{leyenda}</Leyenda>}
    </div>
  );
}

/** Selector de opciones como botones */
function WizSelector<T extends string | number>({
  label,
  value,
  onChange,
  options,
  tip,
  leyenda,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  tip?: string;
  leyenda?: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        <LabelWithTip label={label} tip={tip} />
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`min-w-[80px] flex-1 h-9 rounded-md text-xs font-medium border transition-all whitespace-nowrap px-2 ${
              value === opt.value
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-navy-700 border-[#d1d8e2] hover:border-navy-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {leyenda && <Leyenda>{leyenda}</Leyenda>}
    </div>
  );
}

/** Slider con valor numerico */
function WizSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  tip,
  leyenda,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  tip?: string;
  leyenda?: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        <LabelWithTip label={label} tip={tip} />
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-navy-900 h-1.5 bg-[#e8ebf0] rounded-full appearance-none cursor-pointer"
        />
        <span className="text-sm font-semibold text-navy-900 w-16 text-right">
          {value.toFixed(step < 1 ? 1 : 0)}{suffix}
        </span>
      </div>
      {leyenda && <Leyenda>{leyenda}</Leyenda>}
    </div>
  );
}

/** Input opcional de dias (puede dejarse vacio para calculo automatico) */
function WizDiasInput({
  label,
  value,
  onChange,
  placeholder,
  tip,
  leyenda,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
  tip?: string;
  leyenda?: React.ReactNode;
}) {
  const display = value === null ? '' : value.toString();
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        <LabelWithTip label={label} tip={tip} opcional />
      </label>
      <input
        type="number"
        value={display}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') { onChange(null); return; }
          const parsed = parseInt(raw, 10);
          onChange(isNaN(parsed) ? null : parsed);
        }}
        className="zn-input w-full"
      />
      {leyenda && <Leyenda>{leyenda}</Leyenda>}
    </div>
  );
}

/** Selector de sectores — lee dinamicamente de window.MotorVBM.BENCHMARKS */
interface SectorOption { id: string; nombre: string; }

function useSectoresDinamicos(): readonly SectorOption[] {
  return useMemo(() => {
    try {
      const b = (window as any).MotorVBM?.BENCHMARKS;
      if (!b || typeof b !== 'object') return T.sectoresDefault;
      const sectores: SectorOption[] = [];
      for (const [key, val] of Object.entries(b)) {
        if (val && typeof val === 'object') {
          const nombre = (val as any).sector_nombre || (val as any).nombre || key;
          sectores.push({ id: key, nombre });
        }
      }
      return sectores.length > 0 ? (sectores as readonly SectorOption[]) : T.sectoresDefault;
    } catch {
      return T.sectoresDefault;
    }
  }, []);
}

function SectorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const sectores = useSectoresDinamicos();
  const C = T.paso1Negocio.campos;
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-navy-700 mb-1.5">
        <LabelWithTip label={C.sector.label} tip={C.sector.tooltip} />
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="zn-select w-full"
      >
        {sectores.map((s) => (
          <option key={s.id} value={s.id}>{s.nombre}</option>
        ))}
      </select>
      <Leyenda>{C.sector.leyenda}</Leyenda>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASO 1: DATOS DEL NEGOCIO
   ═══════════════════════════════════════════════════════════════ */

function StepNegocio({ data, onChange }: {
  data: Paso1aNegocio;
  onChange: (d: Partial<Paso1aNegocio>) => void;
}) {
  const C = T.paso1Negocio.campos;
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Nombre empresa */}
        <div className="md:col-span-2">
          <WizTextInput
            label={C.nombreEmpresa.label}
            value={data.nombre_empresa}
            onChange={(v) => onChange({ nombre_empresa: v })}
            placeholder={C.nombreEmpresa.placeholder}
            tip={C.nombreEmpresa.tooltip}
            leyenda={C.nombreEmpresa.leyenda}
          />
        </div>

        {/* Periodo */}
        <WizInput
          label={C.periodo.label}
          value={data.periodo_analizar}
          onChange={(v) => onChange({ periodo_analizar: v })}
          tip={C.periodo.tooltip}
          leyenda={C.periodo.leyenda}
        />

        {/* Empleados */}
        <WizInput
          label={C.empleados.label}
          value={data.numero_empleados}
          onChange={(v) => onChange({ numero_empleados: v, es_micro: v <= 10 })}
          tip={C.empleados.tooltip}
          leyenda={C.empleados.leyenda}
          min={0}
        />

        {/* Sector — poblado dinamicamente desde window.MotorVBM.BENCHMARKS */}
        <SectorSelect
          value={data.sector_id}
          onChange={(v) => onChange({ sector_id: v })}
        />

        {/* Ventas aprox */}
        <WizInputMiles
          label={C.ventasAprox.label}
          value={data.ventas_aprox}
          onChange={(v) => onChange({ ventas_aprox: v })}
          prefix="$"
          tip={C.ventasAprox.tooltip}
          leyenda={C.ventasAprox.leyenda}
          min={0}
        />

        {/* Moneda */}
        <WizSelector
          label={C.moneda.label}
          value={data.moneda}
          onChange={(v) => onChange({ moneda: v })}
          options={[
            { value: 'MXN' as const, label: 'MXN' },
            { value: 'USD' as const, label: 'USD' },
          ]}
          tip={C.moneda.tooltip}
          leyenda={C.moneda.leyenda}
        />

        {/* Num periodos */}
        <WizSelector
          label={C.periodos.label}
          value={data.num_periodos}
          onChange={(v) => onChange({ num_periodos: v as 1 | 2 | 3 })}
          options={[
            { value: 1 as const, label: `1 ${C.periodos.opcionPeriodo}` },
            { value: 2 as const, label: `2 ${C.periodos.opcionPeriodos}` },
            { value: 3 as const, label: `3 ${C.periodos.opcionPeriodos}` },
          ]}
          tip={C.periodos.tooltip}
          leyenda={C.periodos.leyenda}
        />

        {/* Regimen — 7 opciones: PM + 5 tramos RESICO + PFAE */}
        <WizSelector
          label={C.regimen.label}
          value={data.regimen}
          onChange={(v) => {
            const r = v as Paso1aNegocio['regimen'];
            const tasaMap: Record<string, number> = {
              PM_30: 0.30, RESICO_10: 0.010, RESICO_11: 0.011,
              RESICO_15: 0.015, RESICO_20: 0.020, RESICO_25: 0.025, PFAE_OTRO: 0,
            };
            onChange({ regimen: r, tasa_impuesto: tasaMap[r] ?? 0 });
          }}
          options={[
            { value: 'PM_30' as const, label: C.regimen.opcionPM30 },
            { value: 'RESICO_10' as const, label: C.regimen.opcionR10 },
            { value: 'RESICO_11' as const, label: C.regimen.opcionR11 },
            { value: 'RESICO_15' as const, label: C.regimen.opcionR15 },
            { value: 'RESICO_20' as const, label: C.regimen.opcionR20 },
            { value: 'RESICO_25' as const, label: C.regimen.opcionR25 },
            { value: 'PFAE_OTRO' as const, label: C.regimen.opcionPFAE },
          ]}
          tip={C.regimen.tooltip}
          leyenda={C.regimen.leyenda}
        />

        {/* Tasa impuesto — bloqueada salvo PFAE/Otro */}
        <WizInput
          label={C.tasaImpuesto.label}
          value={Math.round(data.tasa_impuesto * 10000) / 100}
          onChange={(v) => onChange({ tasa_impuesto: v / 100 })}
          suffix="%"
          step={0.5}
          min={0}
          max={50}
          disabled={data.regimen !== 'PFAE_OTRO'}
          tip={C.tasaImpuesto.tooltip}
          leyenda={data.regimen === 'PFAE_OTRO' ? C.tasaImpuesto.leyenda :
                   `Fijo: ${(data.tasa_impuesto * 100).toFixed(1).replace(/\.0$/, '')}% ${C.regimen.label}.`}
        />

        {/* Informal */}
        <WizToggle
          label={C.informal.label}
          value={data.es_informal}
          onChange={(v) => onChange({ es_informal: v })}
          textOn={C.informal.valorSi}
          textOff={C.informal.valorNo}
          tip={C.informal.tooltip}
          leyenda={C.informal.leyenda}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASO 2: ESTADO DE RESULTADOS
   ═══════════════════════════════════════════════════════════════ */

function StepEstadoResultados({ data, onChange }: {
  data: Paso1cEstadoResultados;
  onChange: (d: Partial<Paso1cEstadoResultados>) => void;
}) {
  const C = T.paso2EstadoResultados.campos;
  const ventas = data.ventas;
  const cogs = data.cogs;
  const utilidadBruta = ventas - cogs;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Utilidad Bruta preview */}
      {ventas > 0 && cogs > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-pearl border border-[#e8ebf0]">
          <div>
            <span className="text-xs font-medium text-[#6b7a8d]">Utilidad Bruta Estimada</span>
            <p className="text-[10px] text-[#9ba5b3] mt-0.5">Ventas — Costo de Ventas</p>
          </div>
          <span className="text-lg font-bold text-navy-900 font-mono">
            ${utilidadBruta.toLocaleString('es-MX')}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ventas */}
        <WizInputMiles
          label={C.ventas.label}
          value={data.ventas}
          onChange={(v) => onChange({ ventas: v })}
          prefix="$"
          tip={C.ventas.tooltip}
          leyenda={C.ventas.leyenda}
          min={0}
        />

        {/* COGS */}
        <WizInputMiles
          label={C.cogs.label}
          value={data.cogs}
          onChange={(v) => onChange({ cogs: v })}
          prefix="$"
          tip={C.cogs.tooltip}
          leyenda={C.cogs.leyenda}
          min={0}
        />

        {/* Gastos Adm */}
        <WizInputMiles
          label={C.gastosAdm.label}
          value={data.gastos_adm}
          onChange={(v) => onChange({ gastos_adm: v })}
          prefix="$"
          tip={C.gastosAdm.tooltip}
          leyenda={C.gastosAdm.leyenda}
          min={0}
        />

        {/* Gastos Vta */}
        <WizInputMiles
          label={C.gastosVta.label}
          value={data.gastos_vta}
          onChange={(v) => onChange({ gastos_vta: v })}
          prefix="$"
          tip={C.gastosVta.tooltip}
          leyenda={C.gastosVta.leyenda}
          min={0}
        />

        {/* D&A */}
        <WizInputMiles
          label={C.da.label}
          value={data.da}
          onChange={(v) => onChange({ da: v })}
          prefix="$"
          tip={C.da.tooltip}
          leyenda={C.da.leyenda}
          min={0}
        />

        {/* Ingresos no op */}
        <WizInputMiles
          label={C.ingNoOp.label}
          value={data.ing_no_op}
          onChange={(v) => onChange({ ing_no_op: v })}
          prefix="$"
          tip={C.ingNoOp.tooltip}
          leyenda={C.ingNoOp.leyenda}
          min={0}
          opcional
        />

        {/* Gastos no op */}
        <WizInputMiles
          label={C.gtoNoOp.label}
          value={data.gto_no_op}
          onChange={(v) => onChange({ gto_no_op: v })}
          prefix="$"
          tip={C.gtoNoOp.tooltip}
          leyenda={C.gtoNoOp.leyenda}
          min={0}
          opcional
        />

        {/* Gastos financieros */}
        <WizInputMiles
          label={C.gastosFinancieros.label}
          value={data.gastos_financieros}
          onChange={(v) => onChange({ gastos_financieros: v })}
          prefix="$"
          tip={C.gastosFinancieros.tooltip}
          leyenda={C.gastosFinancieros.leyenda}
          min={0}
        />

        {/* CAPEX */}
        <div className="md:col-span-2">
          <WizInputMiles
            label={C.capex.label}
            value={data.capex}
            onChange={(v) => onChange({ capex: v })}
            prefix="$"
            tip={C.capex.tooltip}
            leyenda={C.capex.leyenda}
            min={0}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASO 3: BALANCE GENERAL
   ═══════════════════════════════════════════════════════════════ */

function StepBalance({ data, onChange }: {
  data: Paso1dBalance;
  onChange: (d: Partial<Paso1dBalance>) => void;
}) {
  const C = T.paso3Balance;
  const f = C.campos;

  // Calcular totales
  const activo_total =
    data.caja_bancos + data.cuentas_por_cobrar + data.inventarios +
    data.otros_activos_corrientes + data.activos_fijos_netos + data.otros_activos_no_corrientes;
  const pasivo_total =
    data.deuda_financiera_cp + data.otros_pasivos_corrientes + data.cuentas_por_pagar +
    data.deuda_financiera_lp + data.otros_pasivos_nc;
  const patrimonio = data.capital_social + data.utilidades_retenidas;
  const balanceCuadra = Math.abs(activo_total - (pasivo_total + patrimonio)) < 1;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Indicador de balance */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
        balanceCuadra
          ? 'bg-success-light border-success/20'
          : 'bg-warning-light border-warning/20'
      }`}>
        <div className="flex items-center gap-2">
          {balanceCuadra ? (
            <CheckCircle2 size={16} className="text-success" />
          ) : (
            <AlertTriangle size={16} className="text-warning" />
          )}
          <div>
            <span className={`text-xs font-semibold ${balanceCuadra ? 'text-success' : 'text-warning-dark'}`}>
              {balanceCuadra ? C.totales.ecuacionOk : C.totales.ecuacionError}
            </span>
            <p className="text-[10px] text-[#6b7a8d] mt-0.5">{C.totales.ecuacion}</p>
          </div>
        </div>
        {!balanceCuadra && (
          <span className="text-xs font-mono font-semibold text-warning-dark">
            Diff: ${Math.abs(activo_total - (pasivo_total + patrimonio)).toLocaleString('es-MX')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* SECCION: ACTIVOS */}
        <div className="md:col-span-2">
          <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#e8ebf0] mb-3">
            <span className="w-2 h-2 rounded-full bg-success" />
            {C.seccionActivos}
            <span className="ml-auto text-[10px] font-mono text-navy-900">${activo_total.toLocaleString('es-MX')}</span>
          </h4>
        </div>

        <WizInputMiles label={f.cajaBancos.label} value={data.caja_bancos} onChange={(v) => onChange({ caja_bancos: v })} prefix="$" tip={f.cajaBancos.tooltip} leyenda={f.cajaBancos.leyenda} min={0} />
        <WizInputMiles label={f.cuentasCobrar.label} value={data.cuentas_por_cobrar} onChange={(v) => onChange({ cuentas_por_cobrar: v })} prefix="$" tip={f.cuentasCobrar.tooltip} leyenda={f.cuentasCobrar.leyenda} min={0} />
        <WizInputMiles label={f.inventarios.label} value={data.inventarios} onChange={(v) => onChange({ inventarios: v })} prefix="$" tip={f.inventarios.tooltip} leyenda={f.inventarios.leyenda} min={0} />
        <WizInputMiles label={f.otrosActivosCorrientes.label} value={data.otros_activos_corrientes} onChange={(v) => onChange({ otros_activos_corrientes: v })} prefix="$" tip={f.otrosActivosCorrientes.tooltip} leyenda={f.otrosActivosCorrientes.leyenda} min={0} opcional />
        <WizInputMiles label={f.activosFijosNetos.label} value={data.activos_fijos_netos} onChange={(v) => onChange({ activos_fijos_netos: v })} prefix="$" tip={f.activosFijosNetos.tooltip} leyenda={f.activosFijosNetos.leyenda} min={0} />
        <WizInputMiles label={f.otrosActivosNoCorrientes.label} value={data.otros_activos_no_corrientes} onChange={(v) => onChange({ otros_activos_no_corrientes: v })} prefix="$" tip={f.otrosActivosNoCorrientes.tooltip} leyenda={f.otrosActivosNoCorrientes.leyenda} min={0} opcional />

        {/* SECCION: PASIVOS */}
        <div className="md:col-span-2 mt-2">
          <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#e8ebf0] mb-3">
            <span className="w-2 h-2 rounded-full bg-warning" />
            {C.seccionPasivos}
            <span className="ml-auto text-[10px] font-mono text-navy-900">${pasivo_total.toLocaleString('es-MX')}</span>
          </h4>
        </div>

        <WizInputMiles label={f.cuentasPagar.label} value={data.cuentas_por_pagar} onChange={(v) => onChange({ cuentas_por_pagar: v })} prefix="$" tip={f.cuentasPagar.tooltip} leyenda={f.cuentasPagar.leyenda} min={0} />
        <WizInputMiles label={f.deudaCortoPlazo.label} value={data.deuda_financiera_cp} onChange={(v) => onChange({ deuda_financiera_cp: v })} prefix="$" tip={f.deudaCortoPlazo.tooltip} leyenda={f.deudaCortoPlazo.leyenda} min={0} />
        <WizInputMiles label={f.otrosPasivosCorrientes.label} value={data.otros_pasivos_corrientes} onChange={(v) => onChange({ otros_pasivos_corrientes: v })} prefix="$" tip={f.otrosPasivosCorrientes.tooltip} leyenda={f.otrosPasivosCorrientes.leyenda} min={0} opcional />
        <WizInputMiles label={f.deudaLargoPlazo.label} value={data.deuda_financiera_lp} onChange={(v) => onChange({ deuda_financiera_lp: v })} prefix="$" tip={f.deudaLargoPlazo.tooltip} leyenda={f.deudaLargoPlazo.leyenda} min={0} />
        <WizInputMiles label={f.otrosPasivosNoCorrientes.label} value={data.otros_pasivos_nc} onChange={(v) => onChange({ otros_pasivos_nc: v })} prefix="$" tip={f.otrosPasivosNoCorrientes.tooltip} leyenda={f.otrosPasivosNoCorrientes.leyenda} min={0} opcional />

        {/* SECCION: PATRIMONIO */}
        <div className="md:col-span-2 mt-2">
          <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#e8ebf0] mb-3">
            <span className="w-2 h-2 rounded-full bg-steel-400" />
            {C.seccionPatrimonio}
            <span className="ml-auto text-[10px] font-mono text-navy-900">${patrimonio.toLocaleString('es-MX')}</span>
          </h4>
        </div>

        <WizInputMiles label={f.capitalSocial.label} value={data.capital_social} onChange={(v) => onChange({ capital_social: v })} prefix="$" tip={f.capitalSocial.tooltip} leyenda={f.capitalSocial.leyenda} min={0} />
        <WizInputMiles label={f.utilidadesRetenidas.label} value={data.utilidades_retenidas} onChange={(v) => onChange({ utilidades_retenidas: v })} prefix="$" tip={f.utilidadesRetenidas.tooltip} leyenda={f.utilidadesRetenidas.leyenda} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASO 4: AJUSTES DEL PROPIETARIO
   ═══════════════════════════════════════════════════════════════ */

function StepAjustes({ data, onChange }: {
  data: Paso1bAjustes;
  onChange: (d: Partial<Paso1bAjustes>) => void;
}) {
  const C = T.paso4Ajustes;
  const f = C.campos;
  const deudaSombra = data.deuda_fintech + data.deuda_tarjeta + data.deuda_agiotista;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Retiros */}
        <WizInputMiles
          label={f.retiros.label}
          value={data.retiros_propietario}
          onChange={(v) => onChange({ retiros_propietario: v })}
          prefix="$"
          tip={f.retiros.tooltip}
          leyenda={f.retiros.leyenda}
          min={0}
          opcional
        />

        {/* Gastos personales */}
        <WizInputMiles
          label={f.gastosPersonales.label}
          value={data.gastos_personales_empresa}
          onChange={(v) => onChange({ gastos_personales_empresa: v })}
          prefix="$"
          tip={f.gastosPersonales.tooltip}
          leyenda={f.gastosPersonales.leyenda}
          min={0}
          opcional
        />

        {/* Ventas no facturadas */}
        <WizInputMiles
          label={f.ventasNoFacturadas.label}
          value={data.ventas_no_facturadas}
          onChange={(v) => onChange({ ventas_no_facturadas: v })}
          prefix="$"
          tip={f.ventasNoFacturadas.tooltip}
          leyenda={f.ventasNoFacturadas.leyenda}
          min={0}
          opcional
        />

        {/* Sueldo imputado */}
        <WizInputMiles
          label={f.sueldoImputado.label}
          value={data.sueldo_imputado}
          onChange={(v) => onChange({ sueldo_imputado: v })}
          prefix="$"
          tip={f.sueldoImputado.tooltip}
          leyenda={f.sueldoImputado.leyenda}
          min={0}
          opcional
        />
      </div>

      {/* Deuda Sombra */}
      <div className="pt-4 border-t border-[#e8ebf0]">
        <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-warning" />
          {C.resumenDeudaSombra}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <WizInput
            label={f.deudaFintech.label}
            value={data.deuda_fintech}
            onChange={(v) => onChange({ deuda_fintech: v })}
            prefix="$"
            tip={f.deudaFintech.tooltip}
            leyenda={f.deudaFintech.leyenda}
            min={0}
            opcional
          />
          <WizInput
            label={f.deudaTarjeta.label}
            value={data.deuda_tarjeta}
            onChange={(v) => onChange({ deuda_tarjeta: v })}
            prefix="$"
            tip={f.deudaTarjeta.tooltip}
            leyenda={f.deudaTarjeta.leyenda}
            min={0}
            opcional
          />
          <WizInput
            label={f.deudaAgiotista.label}
            value={data.deuda_agiotista}
            onChange={(v) => onChange({ deuda_agiotista: v })}
            prefix="$"
            tip={f.deudaAgiotista.tooltip}
            leyenda={f.deudaAgiotista.leyenda}
            min={0}
            opcional
          />
        </div>
        {deudaSombra > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-warning-light border border-warning/20">
            <span className="text-xs text-warning-dark font-medium">
              {C.resumenDeudaSombra}: ${deudaSombra.toLocaleString('es-MX')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASO 5: PARAMETROS OPERATIVOS
   ═══════════════════════════════════════════════════════════════ */

function StepOperativos({ data, onChange, p1c, p1d }: {
  data: Paso1eOperativos;
  onChange: (d: Partial<Paso1eOperativos>) => void;
  p1c: Paso1cEstadoResultados;
  p1d: Paso1dBalance;
}) {
  const C = T.paso5Operativos;
  const f = C.campos;

  // Pre-calculados (Año Comercial = 360 días)
  const dso = p1c.ventas > 0 ? Math.round((p1d.cuentas_por_cobrar / p1c.ventas) * 360) : null;
  const doh = p1c.cogs > 0 ? Math.round((p1d.inventarios / p1c.cogs) * 360) : null;
  const dpo = p1c.cogs > 0 ? Math.round((p1d.cuentas_por_pagar / p1c.cogs) * 360) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Costo de Capital */}
      <div>
        <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <SlidersHorizontal size={12} className="text-steel-500" />
          {C.seccionCostoCapital}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Ventas a credito */}
          <WizSlider
            label={f.ventasCredito.label}
            value={Math.round(data.credito_pct * 100)}
            onChange={(v) => onChange({ credito_pct: v / 100 })}
            min={0}
            max={100}
            step={1}
            suffix="%"
            tip={f.ventasCredito.tooltip}
            leyenda={f.ventasCredito.leyendaRango}
          />

          {/* Kd */}
          <WizInput
            label={f.tasaInteres.label}
            value={Math.round(data.Kd * 100)}
            onChange={(v) => onChange({ Kd: v / 100 })}
            suffix="%"
            step={1}
            min={0}
            max={100}
            tip={f.tasaInteres.tooltip}
            leyenda={f.tasaInteres.leyenda}
          />

          {/* Prima PyME */}
          <WizInput
            label={f.primaPyME.label}
            value={Math.round(data.prima_pyme * 100)}
            onChange={(v) => onChange({ prima_pyme: v / 100 })}
            suffix="%"
            step={1}
            min={1}
            max={8}
            tip={f.primaPyME.tooltip}
            leyenda={f.primaPyME.leyenda}
          />
        </div>
      </div>

      {/* Ciclo de Efectivo */}
      <div className="pt-4 border-t border-[#e8ebf0]">
        <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <RotateCcw size={12} className="text-steel-500" />
          {C.seccionCicloEfectivo}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <WizDiasInput
            label={f.diasCobro.label}
            value={data.dso_manual}
            onChange={(v) => onChange({ dso_manual: v })}
            placeholder={dso !== null ? `${f.diasCobro.placeholderAuto}: ${dso}` : f.diasCobro.placeholderAuto}
            tip={f.diasCobro.tooltip}
            leyenda={dso !== null ? <>{f.diasCobro.leyendaCalculado}: <strong>{dso} dias</strong> {f.diasCobro.formula}</> : f.diasCobro.leyendaManual}
          />
          <WizDiasInput
            label={f.diasInventario.label}
            value={data.doh_manual}
            onChange={(v) => onChange({ doh_manual: v })}
            placeholder={doh !== null ? `${f.diasInventario.placeholderAuto}: ${doh}` : f.diasInventario.placeholderAuto}
            tip={f.diasInventario.tooltip}
            leyenda={doh !== null ? <>{f.diasInventario.leyendaCalculado}: <strong>{doh} dias</strong> {f.diasInventario.formula}</> : f.diasInventario.leyendaManual}
          />
          <WizDiasInput
            label={f.diasPago.label}
            value={data.dpo_manual}
            onChange={(v) => onChange({ dpo_manual: v })}
            placeholder={dpo !== null ? `${f.diasPago.placeholderAuto}: ${dpo}` : f.diasPago.placeholderAuto}
            tip={f.diasPago.tooltip}
            leyenda={dpo !== null ? <>{f.diasPago.leyendaCalculado}: <strong>{dpo} dias</strong> {f.diasPago.formula}</> : f.diasPago.leyendaManual}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WIZARD MANUAL — COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */

const PASOS_CONFIG = [
  { num: 1 as PasoWizard, titulo: T.paso1Negocio.titulo, icon: <Building2 size={14} /> },
  { num: 2 as PasoWizard, titulo: T.paso2EstadoResultados.titulo, icon: <Calculator size={14} /> },
  { num: 3 as PasoWizard, titulo: T.paso3Balance.titulo, icon: <Scale size={14} /> },
  { num: 4 as PasoWizard, titulo: T.paso4Ajustes.titulo, icon: <AlertTriangle size={14} /> },
  { num: 5 as PasoWizard, titulo: T.paso5Operativos.titulo, icon: <SlidersHorizontal size={14} /> },
];

export default function WizardManual({ onVolver }: WizardManualProps) {
  const navigate = useNavigate();
  const { guardarFormData, ejecutarDiagnostico, status } = useDiagnostico();

  const [paso, setPaso] = useState<PasoWizard>(1);
  const [visited, setVisited] = useState<Set<number>>(new Set([1]));
  const [form, setForm] = useState<WizardFormState>(crearEstadoInicial);
  const [ejecutando, setEjecutando] = useState(false);

  // Actualizar campo de un paso
  const updateP1a = useCallback((d: Partial<Paso1aNegocio>) => {
    setForm((f) => ({ ...f, p1a: { ...f.p1a, ...d } }));
  }, []);
  const updateP1b = useCallback((d: Partial<Paso1bAjustes>) => {
    setForm((f) => ({ ...f, p1b: { ...f.p1b, ...d } }));
  }, []);
  const updateP1c = useCallback((d: Partial<Paso1cEstadoResultados>) => {
    setForm((f) => ({ ...f, p1c: { ...f.p1c, ...d } }));
  }, []);
  const updateP1d = useCallback((d: Partial<Paso1dBalance>) => {
    setForm((f) => ({ ...f, p1d: { ...f.p1d, ...d } }));
  }, []);
  const updateP1e = useCallback((d: Partial<Paso1eOperativos>) => {
    setForm((f) => ({ ...f, p1e: { ...f.p1e, ...d } }));
  }, []);

  // Validacion basica por paso
  const validarPaso = (p: PasoWizard): boolean => {
    switch (p) {
      case 1:
        return form.p1a.nombre_empresa.trim().length > 0 && form.p1a.periodo_analizar > 2000;
      case 2:
        return form.p1c.ventas > 0;
      case 3: {
        const d = form.p1d;
        const activo = d.caja_bancos + d.cuentas_por_cobrar + d.inventarios + d.otros_activos_corrientes + d.activos_fijos_netos + d.otros_activos_no_corrientes;
        const pasivo = d.deuda_financiera_cp + d.otros_pasivos_corrientes + d.cuentas_por_pagar + d.deuda_financiera_lp + d.otros_pasivos_nc;
        const patrimonio = d.capital_social + d.utilidades_retenidas;
        return activo > 0 && Math.abs(activo - (pasivo + patrimonio)) < 1;
      }
      case 4:
        return true; // Todo opcional
      case 5:
        return form.p1e.credito_pct >= 0 && form.p1e.Kd > 0;
      default:
        return true;
    }
  };

  const puedeAvanzar = validarPaso(paso);
  const esUltimoPaso = paso === 5;

  const avanzar = () => {
    if (!puedeAvanzar || esUltimoPaso) return;
    const next = (paso + 1) as PasoWizard;
    setPaso(next);
    setVisited((v) => new Set([...v, next]));
  };

  const retroceder = () => {
    if (paso === 1) {
      onVolver();
      return;
    }
    setPaso((paso - 1) as PasoWizard);
  };

  const irAPaso = (p: PasoWizard) => {
    if (visited.has(p) || p < paso) {
      setPaso(p);
      setVisited((v) => new Set([...v, p]));
    }
  };

  const handleFinalizar = async () => {
    setEjecutando(true);
    try {
      /* Ensamblar el form completo en una sola operacion
         (evita race condition de 5 setState batchados) */
      const formCompleto: IngestaFormData = {
        p1a: form.p1a,
        p1b: form.p1b,
        p1c: form.p1c,
        p1d: form.p1d,
        p1e: form.p1e,
      };
      guardarFormData(formCompleto);

      /* Esperar a que React actualice el estado y el contexto
         tenga formData e inputs listos para ejecutarDiagnostico */
      await new Promise((r) => setTimeout(r, 150));

      // Ejecutar diagnostico
      await ejecutarDiagnostico();

      // Navegar al dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error ejecutando diagnostico:', err);
    } finally {
      setEjecutando(false);
    }
  };

  // Render del paso actual
  const renderPaso = () => {
    switch (paso) {
      case 1:
        return <StepNegocio data={form.p1a} onChange={updateP1a} />;
      case 2:
        return <StepEstadoResultados data={form.p1c} onChange={updateP1c} />;
      case 3:
        return <StepBalance data={form.p1d} onChange={updateP1d} />;
      case 4:
        return <StepAjustes data={form.p1b} onChange={updateP1b} />;
      case 5:
        return <StepOperativos data={form.p1e} onChange={updateP1e} p1c={form.p1c} p1d={form.p1d} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 text-xs text-[#6b7a8d] hover:text-navy-900 transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          Volver
        </button>
        <h2 className="text-lg font-bold text-navy-900 tracking-tight">
          {T.header.titulo}
        </h2>
        <p className="text-xs text-[#6b7a8d] mt-1">{T.header.subtitulo}</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Linea de progreso */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#e8ebf0] -translate-y-1/2 mx-6" />
          <div
            className="absolute top-1/2 left-6 h-0.5 bg-navy-900 -translate-y-1/2 transition-all duration-300"
            style={{ width: `calc(${(paso - 1) / 4} * (100% - 3rem))` }}
          />

          {PASOS_CONFIG.map((p) => {
            const activo = p.num === paso;
            const completado = p.num < paso;
            const visitable = visited.has(p.num) || p.num < paso;
            return (
              <button
                key={p.num}
                onClick={() => irAPaso(p.num)}
                disabled={!visitable}
                className={`relative z-10 flex flex-col items-center gap-1.5 transition-all ${
                  !visitable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    activo
                      ? 'bg-navy-900 text-white shadow-md'
                      : completado
                        ? 'bg-navy-900 text-white'
                        : 'bg-white text-[#9ba5b3] border-2 border-[#d1d8e2]'
                  }`}
                >
                  {completado ? <CheckCircle2 size={14} /> : p.num}
                </div>
                <span className={`text-[10px] font-medium ${activo ? 'text-navy-900' : 'text-[#9ba5b3]'}`}>
                  {p.titulo}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card del paso */}
      <div className="zn-card mb-6">
        <div className="zn-card-header">
          <div className="flex items-center gap-2">
            {PASOS_CONFIG[paso - 1].icon}
            <span className="zn-card-title">
              {T.header.pasoActual} {paso} {T.header.de} 5: {PASOS_CONFIG[paso - 1].titulo}
            </span>
          </div>
          <span className="text-[11px] text-[#9ba5b3]">
            {paso === 1 && T.paso1Negocio.subtitulo}
            {paso === 2 && T.paso2EstadoResultados.subtitulo}
            {paso === 3 && T.paso3Balance.subtitulo}
            {paso === 4 && T.paso4Ajustes.subtitulo}
            {paso === 5 && T.paso5Operativos.subtitulo}
          </span>
        </div>
        <div className="zn-card-body">
          {renderPaso()}
        </div>
      </div>

      {/* Navegacion */}
      <div className="flex items-center justify-between">
        <button
          onClick={retroceder}
          className="zn-btn-secondary"
        >
          <ChevronLeft size={14} className="mr-1.5" />
          {paso === 1 ? 'Cancelar' : T.header.botonAnterior}
        </button>

        {!esUltimoPaso ? (
          <button
            onClick={avanzar}
            disabled={!puedeAvanzar}
            className={`zn-btn-primary ${!puedeAvanzar ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {T.header.botonSiguiente}
            <ChevronRight size={14} className="ml-1.5" />
          </button>
        ) : (
          <button
            onClick={handleFinalizar}
            disabled={ejecutando || !puedeAvanzar || status === 'calculando'}
            className={`zn-btn-primary px-8 ${(ejecutando || status === 'calculando') ? 'opacity-60 cursor-wait' : ''}`}
          >
            {ejecutando || status === 'calculando' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {T.header.estadoValidando}
              </>
            ) : (
              <>
                <Zap size={15} className="mr-2" />
                {T.header.botonFinalizar}
                <ChevronRight size={14} className="ml-2" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
