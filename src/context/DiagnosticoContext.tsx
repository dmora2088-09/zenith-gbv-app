import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  IngestaFormData,
  IngestaInputsPlano,
  DiagnosticoResult,
  DiagnosticoOutput,
} from '@/types/motor';
import {
  ensamblarInputs,
  ejecutarDiagnostico as motorEjecutarDiagnostico,
  motorCargado,
  esperarMotor,
} from '@/engine/motorAdapter';

export type DiagnosticoStatus =
  | 'idle'
  | 'cargando_motor'
  | 'capturando'
  | 'listo'
  | 'calculando'
  | 'completado'
  | 'error';

interface DiagnosticoState {
  formData: IngestaFormData | null;
  inputs: IngestaInputsPlano | null;
  resultados: DiagnosticoResult | null;
  status: DiagnosticoStatus;
  errores: string[];
  motorReady: boolean;
}

interface DiagnosticoActions {
  guardarFormData: (data: IngestaFormData) => void;
  ejecutarDiagnostico: () => Promise<void>;
  actualizarPaso: <K extends keyof IngestaFormData>(
    paso: K,
    datos: IngestaFormData[K]
  ) => void;
  reset: () => void;
}

type DiagnosticoContextType = DiagnosticoState & DiagnosticoActions;

const DiagnosticoContext = createContext<DiagnosticoContextType | null>(null);

const initialState: DiagnosticoState = {
  formData: null,
  inputs: null,
  resultados: null,
  status: 'cargando_motor',
  errores: [],
  motorReady: false,
};

/**
 * Carga motor.js dinamicamente via script tag.
 * Esto permite que React renderice inmediatamente
 * mientras el motor se descarga en paralelo.
 */
function cargarMotorDinamico(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Si ya cargo, listo
    if (motorCargado()) {
      resolve();
      return;
    }

    // Crear script tag
    const script = document.createElement('script');
    script.src = '/motor.js';
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar motor.js'));

    document.head.appendChild(script);
  });
}

/* ═══════════════════════════════════════════════════════════════
   PROVIDER
   ═══════════════════════════════════════════════════════════════ */

export function DiagnosticoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DiagnosticoState>(initialState);
  const formDataRef = useRef<IngestaFormData | null>(null);

  // Cargar motor.js dinamicamente al montar
  useEffect(() => {
    cargarMotorDinamico()
      .then(() => {
        setState((s) => ({
          ...s,
          motorReady: true,
          status: s.formData ? 'listo' : 'idle',
        }));
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          status: 'error',
          errores: [err.message],
        }));
      });
  }, []);

  const guardarFormData = useCallback((data: IngestaFormData) => {
    const inputs = ensamblarInputs(data);
    formDataRef.current = data;
    setState((s) => ({
      ...s,
      formData: data,
      inputs,
      status: s.motorReady ? 'listo' : 'cargando_motor',
      errores: [],
    }));
  }, []);

  const actualizarPaso = useCallback(
    <K extends keyof IngestaFormData>(paso: K, datos: IngestaFormData[K]) => {
      setState((s) => {
        if (!s.formData) {
          const newForm = crearFormDataVacia();
          (newForm[paso] as IngestaFormData[K]) = datos;
          formDataRef.current = newForm;
          const inputs = ensamblarInputs(newForm);
          return {
            ...s,
            formData: newForm,
            inputs,
            status: s.motorReady ? 'capturando' : 'cargando_motor',
            errores: [],
          };
        }
        const newForm = { ...s.formData, [paso]: datos };
        formDataRef.current = newForm as IngestaFormData;
        const inputs = ensamblarInputs(newForm);
        return {
          ...s,
          formData: newForm,
          inputs,
          status: s.motorReady ? 'capturando' : 'cargando_motor',
          errores: [],
        };
      });
    },
    []
  );

  const ejecutarDiagnostico = useCallback(async () => {
    /* Leer formData siempre del ref (valor mas reciente, sin closure stale) */
    const currentForm = formDataRef.current;

    if (!currentForm) {
      setState((s) => ({
        ...s,
        errores: ['No hay datos del formulario para ejecutar'],
        status: 'error' as DiagnosticoStatus,
      }));
      return;
    }

    setState((s) => ({ ...s, status: 'calculando' as DiagnosticoStatus, errores: [] }));

    try {
      if (!motorCargado()) {
        await esperarMotor(5000);
      }

      const resultado: DiagnosticoOutput = motorEjecutarDiagnostico(currentForm);

      if ('error' in resultado && resultado.error === true) {
        setState((s) => ({
          ...s,
          resultados: null,
          errores: resultado.mensajes || ['Error desconocido en el motor'],
          status: 'error' as DiagnosticoStatus,
        }));
      } else {
        setState((s) => ({
          ...s,
          resultados: resultado as DiagnosticoResult,
          errores: [],
          status: 'completado' as DiagnosticoStatus,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error ejecutando diagnostico';
      setState((s) => ({
        ...s,
        resultados: null,
        errores: [msg],
        status: 'error' as DiagnosticoStatus,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ ...initialState, motorReady: state.motorReady });
  }, [state.motorReady]);

  const value: DiagnosticoContextType = {
    ...state,
    guardarFormData,
    ejecutarDiagnostico,
    actualizarPaso,
    reset,
  };

  return (
    <DiagnosticoContext.Provider value={value}>
      {children}
    </DiagnosticoContext.Provider>
  );
}

export function useDiagnostico(): DiagnosticoContextType {
  const ctx = useContext(DiagnosticoContext);
  if (!ctx) {
    throw new Error('useDiagnostico debe usarse dentro de <DiagnosticoProvider>');
  }
  return ctx;
}

/* ═══════════════════════════════════════════════════════════════
   HELPER: FormData vacia con defaults
   ═══════════════════════════════════════════════════════════════ */

function crearFormDataVacia(): IngestaFormData {
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
