/**
 * ================================================================
 * Zenith GBV — Excel Parser
 *
 * Paridad 1:1 con ingesta_excel.js
 * Recibe un archivo .xlsx (File), lee las 3 hojas del Machote,
 * extrae variables de la columna C (nombres) y B (valores),
 * y devuelve un IngestaFormData completo.
 * ================================================================ */

import * as XLSX from 'xlsx';
import type { IngestaFormData } from '@/types/motor';

/* ── Whitelist de variables a extraer (paridad con ingesta_excel.js) ── */
const _VARS_INPUT = new Set([
  // Perfil de Empresa
  'nombre_empresa', 'periodo_analizar', 'numero_empleados', 'ventas_aprox',
  'regimen', 'tasa_impuesto', 'kd', 'prima_pyme', 'sector_id',
  'retiros_propietario', 'gastos_personales', 'ventas_no_facturadas',
  'tasa_isr_manual',
  // Estado de Resultados
  'ventas', 'cogs', 'gastos_adm', 'gastos_vta', 'da',
  'ing_no_op', 'gto_no_op', 'gastos_financieros', 'sueldo_imputado',
  // Balance General
  'caja_bancos', 'cuentas_por_cobrar', 'inventarios',
  'otros_activos_corrientes', 'activos_fijos_netos', 'otros_activos_no_corrientes',
  'cuentas_por_pagar', 'deuda_financiera_cp', 'otros_pasivos_corrientes',
  'deuda_financiera_lp', 'otros_pasivos_nc',
  'capital_social', 'utilidades_retenidas',
]);

const HOJAS_REQUERIDAS = ['Perfil de Empresa', 'Estado de Resultados', 'Balance General'];

/**
 * Parsea un archivo .xlsx del Machote de Ingesta y devuelve IngestaFormData.
 *
 * Paridad con IngestaExcel.procesarExcel() de ingesta_excel.js:
 *   1. Verifica .xlsx y carga workbook
 *   2. Lee 3 hojas requeridas
 *   3. Extrae { nombreVar: valor } de columnas C (nombre) y B (valor)
 *   4. Valida campos obligatorios
 *   5. Verifica balance cuadrado (celda B51)
 *   6. Construye datosCliente con derivados
 *   7. Valida JS: Activos ≈ Pasivos + Patrimonio (tolerancia $1)
 *   8. Convierte a IngestaFormData (5 pasos)
 */
export function parsearExcel(archivo: File): Promise<IngestaFormData> {
  return new Promise((resolve, reject) => {
    // Validar extension
    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      reject(new Error(`Formato incorrecto: el archivo debe ser .xlsx (recibido: ${archivo.name})`));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, {
          type: 'array',
          cellFormula: false,
          cellDates: false,
        });

        // Verificar hojas requeridas
        for (const nombre of HOJAS_REQUERIDAS) {
          if (!wb.Sheets[nombre]) {
            throw new Error(
              `Hoja no encontrada: "${nombre}". Asegurate de usar el Machote oficial de Zenith GBV.`
            );
          }
        }

        // Extraer variables
        const vars: Record<string, unknown> = {};

        for (const nombreHoja of HOJAS_REQUERIDAS) {
          const ws = wb.Sheets[nombreHoja];
          const filas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          for (const fila of filas) {
            const row = fila as unknown[];
            const nombreVar = String(row[2] ?? '').trim(); // Columna C
            const valorBruto = row[1]; // Columna B

            if (_VARS_INPUT.has(nombreVar)) {
              vars[nombreVar] = valorBruto;
            }
          }
        }

        // Validar campos obligatorios
        const OBLIGATORIOS = ['nombre_empresa', 'sector_id', 'ventas'];
        for (const campo of OBLIGATORIOS) {
          if (vars[campo] === '' || vars[campo] === undefined) {
            throw new Error(`Campo obligatorio vacio: "${campo}". Verifica que la Hoja correspondiente este completamente llena.`);
          }
        }

        // Verificar balance (celda B51 de Balance General)
        const wsBalance = wb.Sheets['Balance General'];
        const filasBalance = XLSX.utils.sheet_to_json(wsBalance, { header: 1, defval: '' });
        const celdaValidacion = String((filasBalance[50] as unknown[])?.[1] ?? '').trim();

        if (celdaValidacion.includes('ERROR') || celdaValidacion.includes('NO CUADRA')) {
          throw new Error(
            `El balance general no cuadra. Revisa que Activos = Pasivos + Patrimonio (Hoja "Balance General" -> celda B51)`
          );
        }

        // Helpers de conversion
        const num = (clave: string, def = 0): number => {
          const v = vars[clave];
          if (v === '' || v === null || v === undefined) return def;
          const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[$,\s]/g, ''));
          return isNaN(n) ? def : n;
        };

        const txt = (clave: string, def = ''): string => {
          const v = vars[clave];
          if (v === '' || v === null || v === undefined) return def;
          return String(v).trim();
        };

        // Sector ID (normalizar a 2 digitos)
        const sectorId = (() => {
          const raw = txt('sector_id', '01');
          const soloNumeros = raw.replace(/\D/g, '');
          if (soloNumeros && soloNumeros === raw) return soloNumeros.padStart(2, '0');
          return raw;
        })();

        // Normalizar porcentajes (si vienen como 30 en vez de 0.3)
        const tasaBruta = num('tasa_impuesto', 0.30);
        const tasa = tasaBruta > 1 ? tasaBruta / 100 : tasaBruta;

        const kdBruto = num('kd', 0.15);
        const kd = kdBruto > 1 ? kdBruto / 100 : kdBruto;

        const primaBruta = num('prima_pyme', 0.05);
        const prima = primaBruta > 1 ? primaBruta / 100 : primaBruta;

        // Determinar sector_tipo
        let sector_tipo: 'comercio' | 'industria' | 'servicios';
        if (sectorId.startsWith('01') || sectorId.startsWith('03') || sectorId.startsWith('04') || sectorId.startsWith('13') || sectorId.startsWith('16') || sectorId.startsWith('17')) {
          sector_tipo = 'comercio';
        } else if (sectorId.startsWith('02') || sectorId.startsWith('05') || sectorId.startsWith('06') || sectorId.startsWith('07') || sectorId.startsWith('08') || sectorId.startsWith('14') || sectorId.startsWith('15')) {
          sector_tipo = 'industria';
        } else {
          sector_tipo = 'servicios';
        }

        // Empresa informal (no viene en Excel, default false)
        const es_informal = false;
        const numEmpleados = num('numero_empleados', 1);
        const es_micro = numEmpleados <= 10;

        // Regimen — respetar el valor exacto del Excel
        const regimenRaw = txt('regimen', '');
        const tasa_isr_manual = num('tasa_isr_manual', 0);

        let regimen: 'PM_30' | 'RESICO_10' | 'RESICO_11' | 'RESICO_15' | 'RESICO_20' | 'RESICO_25' | 'PFAE_OTRO';

        if (regimenRaw === 'PFAE' || regimenRaw === 'PFAE_OTRO') {
          regimen = 'PFAE_OTRO';
        } else if (regimenRaw.startsWith('RESICO')) {
          /* RESICO genérico → tramo medio; RESICO_X → respetar */
          const match = regimenRaw.match(/RESICO_(\d+)/);
          if (match) {
            const tramo = parseInt(match[1]);
            if ([10, 11, 15, 20, 25].includes(tramo)) {
              regimen = `RESICO_${tramo}` as typeof regimen;
            } else {
              regimen = 'RESICO_15';
            }
          } else {
            regimen = 'RESICO_15';
          }
        } else if (regimenRaw === 'PM_30' || regimenRaw === 'ISR_PM') {
          regimen = 'PM_30';
        } else {
          /* Fallback solo si el Excel no trajo nada útil */
          regimen = 'PM_30';
        }

        // -- Construir datos del balance para derivados --
        const cajaBancos = num('caja_bancos');
        const cxc = num('cuentas_por_cobrar');
        const inventarios = num('inventarios');
        const otrosAC = num('otros_activos_corrientes');
        const activosFijos = num('activos_fijos_netos');
        const otrosANC = num('otros_activos_no_corrientes');
        const cxp = num('cuentas_por_pagar');
        const deudaCp = num('deuda_financiera_cp');
        const otrosPC = num('otros_pasivos_corrientes');
        const deudaLp = num('deuda_financiera_lp');
        const otrosPNC = num('otros_pasivos_nc');
        const capSocial = num('capital_social');
        const utilRet = num('utilidades_retenidas');

        const patrimonio = capSocial + utilRet;
        const activoTotal = cajaBancos + cxc + inventarios + otrosAC + activosFijos + otrosANC;
        const pasivoTotal = cxp + deudaCp + otrosPC + deudaLp + otrosPNC;
        const deudaTotal = deudaCp + deudaLp;

        // Validacion JS: balance cuadrado (tolerancia $1)
        const diferencia = Math.abs(activoTotal - (pasivoTotal + patrimonio));
        if (diferencia > 1 && activoTotal > 0) {
          throw new Error(
            `El balance no cuadra (diferencia: $${diferencia.toLocaleString('es-MX', { maximumFractionDigits: 0 })}).`
          );
        }

        // -- Construir IngestaFormData --
        const formData: IngestaFormData = {
          p1a: {
            nombre_empresa: txt('nombre_empresa', 'Sin nombre'),
            periodo_analizar: num('periodo_analizar', new Date().getFullYear() - 1),
            sector_id: sectorId,
            numero_empleados: numEmpleados,
            ventas_aprox: num('ventas_aprox', num('ventas')),
            moneda: 'MXN', // default, no viene en Excel
            num_periodos: 1, // default
            regimen,
            tasa_impuesto: regimen === 'PFAE_OTRO' && tasa_isr_manual > 0 ? tasa_isr_manual : tasa,
            tasa_isr_manual: regimen === 'PFAE_OTRO' ? tasa_isr_manual || null : null,
            es_informal,
            sector_tipo,
            es_micro,
          },
          p1b: {
            retiros_propietario: num('retiros_propietario'),
            gastos_personales_empresa: num('gastos_personales'),
            ventas_no_facturadas: num('ventas_no_facturadas'),
            sueldo_imputado: num('sueldo_imputado'),
            deuda_fintech: 0, // no vienen en Excel
            deuda_tarjeta: 0,
            deuda_agiotista: 0,
            deuda_sombra: 0,
          },
          p1c: {
            ventas: num('ventas'),
            cogs: num('cogs'),
            gastos_adm: num('gastos_adm'),
            gastos_vta: num('gastos_vta'),
            da: num('da'),
            ing_no_op: num('ing_no_op'),
            gto_no_op: num('gto_no_op'),
            gastos_financieros: num('gastos_financieros'),
            capex: 0, // no viene en Excel
          },
          p1d: {
            caja_bancos: cajaBancos,
            cuentas_por_cobrar: cxc,
            inventarios,
            otros_activos_corrientes: otrosAC,
            activos_fijos_netos: activosFijos,
            otros_activos_no_corrientes: otrosANC,
            cuentas_por_pagar: cxp,
            deuda_financiera_cp: deudaCp,
            otros_pasivos_corrientes: otrosPC,
            deuda_financiera_lp: deudaLp,
            otros_pasivos_nc: otrosPNC,
            capital_social: capSocial,
            utilidades_retenidas: utilRet,
            patrimonio,
            activo_total: activoTotal,
            pasivo_total: pasivoTotal,
            deuda_total: deudaTotal,
          },
          p1e: {
            credito_pct: 0.50, // defaults, no vienen en Excel
            Kd: kd,
            prima_pyme: prima,
            dso_manual: null,
            doh_manual: null,
            dpo_manual: null,
          },
        };

        resolve(formData);

      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo. Intenta de nuevo.'));
    reader.readAsArrayBuffer(archivo);
  });
}
