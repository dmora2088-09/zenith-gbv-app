/* ================================================================
   motor.js — VBM Advisor
   Motor de Diagnóstico Financiero PyME México
   Versión 1.0 | Benchmarks Abril 2026
   ================================================================
   ÍNDICE:
   §1  Parámetros Macro (Abril 2026)
   §2  Benchmarks Sectoriales — 20 sub-sectores
   §3  Parámetros WACC por sector
   §4  Catálogo de Metas — 45 metas VBM
   §5  Funciones de Normalización
   §6  Funciones de Cálculo Financiero
   §7  Funciones de Clasificación V / A / R
   §8  Motor de Diagnóstico (función principal)
   §9  Overrides Universales
   §10 Activación de Metas
   §11 FODA Ponderado y Score Global
   §12 Utilidades de Soporte
   ================================================================ */

"use strict";

/* ================================================================
   §1 — PARÁMETROS MACRO (ABRIL 2026)
   Fuente: Banxico, Damodaran ene-2026, INEGI mar-2026
   Recalibrar trimestralmente.
   ================================================================ */
const MACRO = {
  Rf:            0.0950,   // Bono M 10Y — promedio 1T-2T 2026
  ERP:           0.0670,   // Equity Risk Premium México (4.23 + 2.46 CRP)
  CRP:           0.0246,   // Country Risk Premium México (Damodaran ene-2026)
  primaPyME_formal: 0.0300, // Size premium pequeña/mediana formal
  primaPyME_micro:  0.0500, // Size premium micro o informal
  Kd_default:    0.1500,   // Tasa de interés deuda PyME default
  t_ISR_PM:      0.30,     // ISR Personas Morales
  t_RESICO:      0.25,     // ISR RESICO (efectivo aproximado)
  TIIE_28:       0.070071,
  CETES_28:      0.0660,
  inflacion_INPC: 0.0459,
  tipo_cambio_USD_MXN: 17.27,
  fecha_corte: "Abril 2026"
};


/* ================================================================
   §2 — BENCHMARKS SECTORIALES — 20 SUB-SECTORES
   Estructura por métrica: { r: umbral_rojo, v: umbral_verde }
   Convención:
     "mayor_es_mejor" → Rojo si valor < r  |  Verde si valor > v
     "menor_es_mejor" → Rojo si valor > r  |  Verde si valor < v
   ================================================================ */
const BENCHMARKS = {

  /* ─── COMERCIO AL MENUDEO ─────────────────────────────────── */

  "01": {
    nombre: "Abarrotes, Mini-súper y Tiendas de Conveniencia",
    scian: "461",
    universo_pyme: 1000000,
    credito_pct_default: 0.05,
    confianza: "Alto",
    metricas: {
      margen_bruto:        { r: 0.16,  v: 0.19,  dir: "mayor" },
      margen_ebitda:       { r: 0.025, v: 0.04,  dir: "mayor" },
      margen_operativo:    { r: 0.01,  v: 0.02,  dir: "mayor" },
      margen_neto:         { r: 0.005, v: 0.012, dir: "mayor" },
      roic:                { r: 0.06,  v: 0.10,  dir: "mayor" },
      ccc:                 { r: 15,    v: 5,     dir: "menor" },
      dso:                 { r: 5,     v: 2,     dir: "menor" },
      doh:                 { r: 45,    v: 30,    dir: "menor" },
      dpo:                 { r: 15,    v: 25,    dir: "mayor" },
      razon_corriente:     { r: 1.0,   v: 1.3,   dir: "mayor" },
      prueba_acida:        { r: 0.4,   v: 0.7,   dir: "mayor" },
      deuda_activos:       { r: 0.55,  v: 0.40,  dir: "menor" },
      deuda_patrimonio:    { r: 1.2,   v: 0.7,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "CCC típicamente negativo. Modelo OXXO/FEMSA. Mermas 2–5% destruyen ROIC."
  },

  "02": {
    nombre: "Ropa, Calzado y Accesorios",
    scian: "463",
    universo_pyme: 295000,
    credito_pct_default: 0.15,
    confianza: "Medio-Alto",
    metricas: {
      margen_bruto:        { r: 0.28,  v: 0.35,  dir: "mayor" },
      margen_ebitda:       { r: 0.04,  v: 0.07,  dir: "mayor" },
      margen_operativo:    { r: 0.03,  v: 0.05,  dir: "mayor" },
      margen_neto:         { r: 0.015, v: 0.03,  dir: "mayor" },
      roic:                { r: 0.08,  v: 0.13,  dir: "mayor" },
      ccc:                 { r: 150,   v: 100,   dir: "menor" },
      dso:                 { r: 20,    v: 10,    dir: "menor" },
      doh:                 { r: 180,   v: 120,   dir: "menor" },
      dpo:                 { r: 30,    v: 50,    dir: "mayor" },
      razon_corriente:     { r: 1.2,   v: 1.8,   dir: "mayor" },
      prueba_acida:        { r: 0.5,   v: 0.9,   dir: "mayor" },
      deuda_activos:       { r: 0.50,  v: 0.35,  dir: "menor" },
      deuda_patrimonio:    { r: 1.0,   v: 0.6,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "Estacionalidad fuerte. Riesgo de obsolescencia de inventario es la patología #1."
  },

  "03": {
    nombre: "Electrónica, Cómputo y Telefonía",
    scian: "466",
    universo_pyme: 145000,
    credito_pct_default: 0.25,
    confianza: "Medio",
    metricas: {
      margen_bruto:        { r: 0.15,  v: 0.22,  dir: "mayor" },
      margen_ebitda:       { r: 0.025, v: 0.05,  dir: "mayor" },
      margen_operativo:    { r: 0.015, v: 0.035, dir: "mayor" },
      margen_neto:         { r: 0.008, v: 0.02,  dir: "mayor" },
      roic:                { r: 0.07,  v: 0.11,  dir: "mayor" },
      ccc:                 { r: 90,    v: 60,    dir: "menor" },
      dso:                 { r: 30,    v: 15,    dir: "menor" },
      doh:                 { r: 90,    v: 60,    dir: "menor" },
      dpo:                 { r: 30,    v: 50,    dir: "mayor" },
      razon_corriente:     { r: 1.1,   v: 1.5,   dir: "mayor" },
      prueba_acida:        { r: 0.5,   v: 0.9,   dir: "mayor" },
      deuda_activos:       { r: 0.55,  v: 0.40,  dir: "menor" },
      deuda_patrimonio:    { r: 1.2,   v: 0.7,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "Competencia con e-commerce. Obsolescencia 5–10% anual. Prueba ácida vital."
  },

  "04": {
    nombre: "Ferretería, Tlapalería y Materiales de Construcción",
    scian: "467",
    universo_pyme: 173000,
    credito_pct_default: 0.35,
    confianza: "Alto",
    metricas: {
      margen_bruto:        { r: 0.20,  v: 0.26,  dir: "mayor" },
      margen_ebitda:       { r: 0.05,  v: 0.09,  dir: "mayor" },
      margen_operativo:    { r: 0.04,  v: 0.07,  dir: "mayor" },
      margen_neto:         { r: 0.02,  v: 0.04,  dir: "mayor" },
      roic:                { r: 0.09,  v: 0.14,  dir: "mayor" },
      ccc:                 { r: 100,   v: 70,    dir: "menor" },
      dso:                 { r: 25,    v: 10,    dir: "menor" },
      doh:                 { r: 100,   v: 70,    dir: "menor" },
      dpo:                 { r: 30,    v: 50,    dir: "mayor" },
      razon_corriente:     { r: 1.3,   v: 1.8,   dir: "mayor" },
      prueba_acida:        { r: 0.5,   v: 0.9,   dir: "mayor" },
      deuda_activos:       { r: 0.50,  v: 0.35,  dir: "menor" },
      deuda_patrimonio:    { r: 1.0,   v: 0.6,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "CCC más largo del comercio. Crédito a contratistas sin interés = subsidio con costo de capital."
  },

  "05": {
    nombre: "Farmacias y Productos de Salud",
    scian: "464",
    universo_pyme: 56000,
    credito_pct_default: 0.05,
    confianza: "Medio",
    metricas: {
      margen_bruto:        { r: 0.14,  v: 0.19,  dir: "mayor" },
      margen_ebitda:       { r: 0.025, v: 0.04,  dir: "mayor" },
      margen_operativo:    { r: 0.015, v: 0.03,  dir: "mayor" },
      margen_neto:         { r: 0.01,  v: 0.02,  dir: "mayor" },
      roic:                { r: 0.07,  v: 0.11,  dir: "mayor" },
      ccc:                 { r: 45,    v: 25,    dir: "menor" },
      dso:                 { r: 15,    v: 5,     dir: "menor" },
      doh:                 { r: 60,    v: 35,    dir: "menor" },
      dpo:                 { r: 30,    v: 45,    dir: "mayor" },
      razon_corriente:     { r: 1.1,   v: 1.4,   dir: "mayor" },
      prueba_acida:        { r: 0.4,   v: 0.7,   dir: "mayor" },
      deuda_activos:       { r: 0.55,  v: 0.40,  dir: "menor" },
      deuda_patrimonio:    { r: 1.2,   v: 0.7,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "Sector resiliente. Control de caducidades en DOH es diferencial clave entre Verde y Rojo."
  },

  "06": {
    nombre: "Otros Comercios al Menudeo",
    scian: "465/468/469",
    universo_pyme: 375000,
    credito_pct_default: 0.15,
    confianza: "Medio-Bajo",
    metricas: {
      margen_bruto:        { r: 0.18,  v: 0.24,  dir: "mayor" },
      margen_ebitda:       { r: 0.03,  v: 0.06,  dir: "mayor" },
      margen_operativo:    { r: 0.02,  v: 0.04,  dir: "mayor" },
      margen_neto:         { r: 0.015, v: 0.03,  dir: "mayor" },
      roic:                { r: 0.07,  v: 0.12,  dir: "mayor" },
      ccc:                 { r: 90,    v: 60,    dir: "menor" },
      dso:                 { r: 20,    v: 10,    dir: "menor" },
      doh:                 { r: 100,   v: 70,    dir: "menor" },
      dpo:                 { r: 30,    v: 50,    dir: "mayor" },
      razon_corriente:     { r: 1.2,   v: 1.7,   dir: "mayor" },
      prueba_acida:        { r: 0.5,   v: 0.9,   dir: "mayor" },
      deuda_activos:       { r: 0.50,  v: 0.35,  dir: "menor" },
      deuda_patrimonio:    { r: 1.0,   v: 0.6,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "Cajón heterogéneo. Subclasificar cuando sea posible."
  },

  /* ─── MANUFACTURA E INDUSTRIA ─────────────────────────────── */

  "07": {
    nombre: "Alimentos y Bebidas Procesados",
    scian: "311/312",
    universo_pyme: 220000,
    credito_pct_default: 0.60,
    confianza: "Alto",
    metricas: {
      margen_bruto:        { r: 0.22,  v: 0.30,  dir: "mayor" },
      margen_ebitda:       { r: 0.08,  v: 0.13,  dir: "mayor" },
      margen_operativo:    { r: 0.05,  v: 0.09,  dir: "mayor" },
      margen_neto:         { r: 0.02,  v: 0.05,  dir: "mayor" },
      roic:                { r: 0.08,  v: 0.14,  dir: "mayor" },
      ccc:                 { r: 90,    v: 60,    dir: "menor" },
      dso:                 { r: 60,    v: 40,    dir: "menor" },
      doh:                 { r: 70,    v: 45,    dir: "menor" },
      dpo:                 { r: 30,    v: 45,    dir: "mayor" },
      razon_corriente:     { r: 1.2,   v: 1.6,   dir: "mayor" },
      prueba_acida:        { r: 0.7,   v: 1.0,   dir: "mayor" },
      deuda_activos:       { r: 0.55,  v: 0.40,  dir: "menor" },
      deuda_patrimonio:    { r: 1.5,   v: 1.0,   dir: "menor" },
      cobertura_intereses: { r: 2.0,   v: 4.0,   dir: "mayor" },
    },
    nota: "DOH alto implica destrucción física de producto perecedero. Sector más regulado (COFEPRIS)."
  },

  "08": {
    nombre: "Textil y Confección",
    scian: "313/314/315/316",
    universo_pyme: 72000,
    credito_pct_default: 0.70,
    confianza: "Medio",
    metricas: {
      margen_bruto:        { r: 0.18,  v: 0.26,  dir: "mayor" },
      margen_ebitda:       { r: 0.05,  v: 0.10,  dir: "mayor" },
      margen_operativo:    { r: 0.03,  v: 0.07,  dir: "mayor" },
      margen_neto:         { r: 0.01,  v: 0.04,  dir: "mayor" },
      roic:                { r: 0.06,  v: 0.12,  dir: "mayor" },
      ccc:                 { r: 140,   v: 90,    dir: "menor" },
      dso:                 { r: 70,    v: 45,    dir: "menor" },
      doh:                 { r: 110,   v: 70,    dir: "menor" },
      dpo:                 { r: 30,    v: 50,    dir: "mayor" },
      razon_corriente:     { r: 1.1,   v: 1.5,   dir: "mayor" },
      prueba_acida:        { r: 0.5,   v: 0.8,   dir: "mayor" },
      deuda_activos:       { r: 0.60,  v: 0.45,  dir: "menor" },
      deuda_patrimonio:    { r: 1.8,   v: 1.2,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "Crisis estructural por competencia asiática. Sector en contracción (EMIM 2025: -6.8%)."
  },

  "09": {
    nombre: "Metalmecánica y Metalurgia",
    scian: "331/332",
    universo_pyme: 122000,
    credito_pct_default: 0.80,
    confianza: "Medio",
    metricas: {
      margen_bruto:        { r: 0.18,  v: 0.26,  dir: "mayor" },
      margen_ebitda:       { r: 0.07,  v: 0.12,  dir: "mayor" },
      margen_operativo:    { r: 0.04,  v: 0.08,  dir: "mayor" },
      margen_neto:         { r: 0.02,  v: 0.05,  dir: "mayor" },
      roic:                { r: 0.07,  v: 0.13,  dir: "mayor" },
      ccc:                 { r: 120,   v: 80,    dir: "menor" },
      dso:                 { r: 75,    v: 50,    dir: "menor" },
      doh:                 { r: 90,    v: 60,    dir: "menor" },
      dpo:                 { r: 35,    v: 55,    dir: "mayor" },
      razon_corriente:     { r: 1.2,   v: 1.6,   dir: "mayor" },
      prueba_acida:        { r: 0.6,   v: 0.9,   dir: "mayor" },
      deuda_activos:       { r: 0.55,  v: 0.40,  dir: "menor" },
      deuda_patrimonio:    { r: 1.5,   v: 1.0,   dir: "menor" },
      cobertura_intereses: { r: 2.0,   v: 4.0,   dir: "mayor" },
    },
    nota: "DSO extendido por OEMs grandes. Factoraje financiero crítico para gestionar CCC."
  },

  "10": {
    nombre: "Muebles y Productos de Madera",
    scian: "321/337",
    universo_pyme: 38000,
    credito_pct_default: 0.50,
    confianza: "Medio-Bajo",
    metricas: {
      margen_bruto:        { r: 0.22,  v: 0.30,  dir: "mayor" },
      margen_ebitda:       { r: 0.06,  v: 0.11,  dir: "mayor" },
      margen_operativo:    { r: 0.03,  v: 0.07,  dir: "mayor" },
      margen_neto:         { r: 0.01,  v: 0.04,  dir: "mayor" },
      roic:                { r: 0.06,  v: 0.11,  dir: "mayor" },
      ccc:                 { r: 130,   v: 90,    dir: "menor" },
      dso:                 { r: 65,    v: 45,    dir: "menor" },
      doh:                 { r: 95,    v: 60,    dir: "menor" },
      dpo:                 { r: 30,    v: 50,    dir: "mayor" },
      razon_corriente:     { r: 1.1,   v: 1.5,   dir: "mayor" },
      prueba_acida:        { r: 0.5,   v: 0.8,   dir: "mayor" },
      deuda_activos:       { r: 0.55,  v: 0.40,  dir: "menor" },
      deuda_patrimonio:    { r: 1.5,   v: 1.0,   dir: "menor" },
      cobertura_intereses: { r: 1.8,   v: 3.5,   dir: "mayor" },
    },
    nota: "Prueba ácida penaliza inventario de muebles terminados por baja liquidez inmediata."
  },

  "11": {
    nombre: "Construcción",
    scian: "236/237/238",
    universo_pyme: 22000,
    credito_pct_default: 0.95,
    confianza: "Medio-Alto",
    metricas: {
      margen_bruto:        { r: 0.12,  v: 0.20,  dir: "mayor" },
      margen_ebitda:       { r: 0.05,  v: 0.10,  dir: "mayor" },
      margen_operativo:    { r: 0.03,  v: 0.07,  dir: "mayor" },
      margen_neto:         { r: 0.01,  v: 0.04,  dir: "mayor" },
      roic:                { r: 0.05,  v: 0.11,  dir: "mayor" },
      ccc:                 { r: 180,   v: 120,   dir: "menor" },
      dso:                 { r: 120,   v: 75,    dir: "menor" },
      doh:                 { r: 120,   v: 80,    dir: "menor" },
      dpo:                 { r: 40,    v: 70,    dir: "mayor" },
      razon_corriente:     { r: 1.1,   v: 1.4,   dir: "mayor" },
      prueba_acida:        { r: 0.6,   v: 1.0,   dir: "mayor" },
      deuda_activos:       { r: 0.65,  v: 0.50,  dir: "menor" },
      deuda_patrimonio:    { r: 2.0,   v: 1.5,   dir: "menor" },
      cobertura_intereses: { r: 1.8,   v: 3.0,   dir: "mayor" },
    },
    nota: "CCC estructuralmente alto. Anticipos de cliente = cuasi-deuda sin costo. CCC>150 = apalancamiento tóxico."
  },

  "12": {
    nombre: "Otras Manufacturas Ligeras",
    scian: "323/326/327/339",
    universo_pyme: 90000,
    credito_pct_default: 0.70,
    confianza: "Medio",
    metricas: {
      margen_bruto:        { r: 0.20,  v: 0.28,  dir: "mayor" },
      margen_ebitda:       { r: 0.07,  v: 0.12,  dir: "mayor" },
      margen_operativo:    { r: 0.04,  v: 0.08,  dir: "mayor" },
      margen_neto:         { r: 0.02,  v: 0.05,  dir: "mayor" },
      roic:                { r: 0.07,  v: 0.13,  dir: "mayor" },
      ccc:                 { r: 110,   v: 75,    dir: "menor" },
      dso:                 { r: 70,    v: 45,    dir: "menor" },
      doh:                 { r: 85,    v: 55,    dir: "menor" },
      dpo:                 { r: 35,    v: 55,    dir: "mayor" },
      razon_corriente:     { r: 1.2,   v: 1.6,   dir: "mayor" },
      prueba_acida:        { r: 0.6,   v: 0.9,   dir: "mayor" },
      deuda_activos:       { r: 0.55,  v: 0.40,  dir: "menor" },
      deuda_patrimonio:    { r: 1.5,   v: 1.0,   dir: "menor" },
      cobertura_intereses: { r: 2.0,   v: 4.0,   dir: "mayor" },
    },
    nota: "Sector muy heterogéneo. Subclasificar cuando sea posible."
  },

  /* ─── SERVICIOS ───────────────────────────────────────────── */

  "13": {
    nombre: "Restaurantes, Cafeterías y Bares",
    scian: "722",
    universo_pyme: 637000,
    credito_pct_default: 0.00,
    confianza: "Alto",
    excepcion_razon_corriente: true, // Override O2 se suprime si CCC<=0 y Cobertura>2x
    metricas: {
      margen_bruto:        { r: 0.25,  v: 0.32,  dir: "mayor" },
      margen_ebitda:       { r: 0.05,  v: 0.10,  dir: "mayor" },
      margen_operativo:    { r: 0.03,  v: 0.08,  dir: "mayor" },
      margen_neto:         { r: 0.01,  v: 0.05,  dir: "mayor" },
      roic:                { r: 0.06,  v: 0.12,  dir: "mayor" },
      ccc:                 { r: 10,    v: 0,     dir: "menor" },
      dso:                 { r: 10,    v: 3,     dir: "menor" },
      doh:                 { r: 20,    v: 10,    dir: "menor" },
      dpo:                 { r: 20,    v: 35,    dir: "mayor" },
      razon_corriente:     { r: 0.8,   v: 1.2,   dir: "mayor" },
      prueba_acida:        { r: 0.5,   v: 0.9,   dir: "mayor" },
      deuda_activos:       { r: 0.60,  v: 0.40,  dir: "menor" },
      deuda_patrimonio:    { r: 1.5,   v: 0.7,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "Razón Corriente baja es NORMAL si CCC<=0 y Cobertura>2x. Alta mortalidad (~50% antes del 2° año)."
  },

  "14": {
    nombre: "Hoteles y Alojamiento Turístico",
    scian: "721",
    universo_pyme: 22000,
    credito_pct_default: 0.30,
    confianza: "Alto-Medio",
    metricas: {
      margen_bruto:        { r: 0.45,  v: 0.55,  dir: "mayor" },
      margen_ebitda:       { r: 0.15,  v: 0.25,  dir: "mayor" },
      margen_operativo:    { r: 0.08,  v: 0.15,  dir: "mayor" },
      margen_neto:         { r: 0.03,  v: 0.08,  dir: "mayor" },
      roic:                { r: 0.05,  v: 0.09,  dir: "mayor" },
      ccc:                 { r: 60,    v: 30,    dir: "menor" },
      dso:                 { r: 45,    v: 25,    dir: "menor" },
      doh:                 { r: 10,    v: 5,     dir: "menor" },
      dpo:                 { r: 25,    v: 45,    dir: "mayor" },
      razon_corriente:     { r: 1.0,   v: 1.5,   dir: "mayor" },
      prueba_acida:        { r: 0.7,   v: 1.2,   dir: "mayor" },
      deuda_activos:       { r: 0.65,  v: 0.45,  dir: "menor" },
      deuda_patrimonio:    { r: 2.0,   v: 1.0,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 2.5,   dir: "mayor" },
    },
    nota: "ROIC bajo calibrado por activos fijos intensivos. Apalancamiento + baja Cobertura = riesgo terminal."
  },

  "15": {
    nombre: "Servicios Profesionales (Contables, Legales, Consultoría)",
    scian: "541",
    universo_pyme: 650000,
    credito_pct_default: 0.90,
    sueldo_imputado_obligatorio: true,
    confianza: "Alto",
    metricas: {
      margen_bruto:        { r: 0.30,  v: 0.45,  dir: "mayor" },
      margen_ebitda:       { r: 0.10,  v: 0.20,  dir: "mayor" },
      margen_operativo:    { r: 0.08,  v: 0.18,  dir: "mayor" },
      margen_neto:         { r: 0.05,  v: 0.12,  dir: "mayor" },
      roic:                { r: 0.10,  v: 0.18,  dir: "mayor" },
      ccc:                 { r: 120,   v: 60,    dir: "menor" },
      dso:                 { r: 90,    v: 45,    dir: "menor" },
      doh:                 { r: null,  v: null,  dir: "na"    }, // No aplica
      dpo:                 { r: 25,    v: 45,    dir: "mayor" },
      razon_corriente:     { r: 1.2,   v: 2.0,   dir: "mayor" },
      prueba_acida:        { r: 1.0,   v: 1.8,   dir: "mayor" },
      deuda_activos:       { r: 0.40,  v: 0.20,  dir: "menor" },
      deuda_patrimonio:    { r: 0.8,   v: 0.3,   dir: "menor" },
      cobertura_intereses: { r: 2.0,   v: 4.0,   dir: "mayor" },
    },
    nota: "DSO crítico. Si tras sueldo imputado el Margen Operativo cae a Rojo → se compró un autoempleo."
  },

  "16": {
    nombre: "Salud Privada (Clínicas, Consultorios, Laboratorios)",
    scian: "621",
    universo_pyme: 295000,
    credito_pct_default: 0.65,
    sueldo_imputado_obligatorio: true,
    confianza: "Medio-Alto",
    metricas: {
      margen_bruto:        { r: 0.30,  v: 0.40,  dir: "mayor" },
      margen_ebitda:       { r: 0.10,  v: 0.18,  dir: "mayor" },
      margen_operativo:    { r: 0.06,  v: 0.14,  dir: "mayor" },
      margen_neto:         { r: 0.03,  v: 0.08,  dir: "mayor" },
      roic:                { r: 0.07,  v: 0.12,  dir: "mayor" },
      ccc:                 { r: 120,   v: 60,    dir: "menor" },
      dso:                 { r: 120,   v: 60,    dir: "menor" },
      doh:                 { r: 45,    v: 20,    dir: "menor" },
      dpo:                 { r: 30,    v: 60,    dir: "mayor" },
      razon_corriente:     { r: 1.2,   v: 1.8,   dir: "mayor" },
      prueba_acida:        { r: 0.9,   v: 1.5,   dir: "mayor" },
      deuda_activos:       { r: 0.60,  v: 0.35,  dir: "menor" },
      deuda_patrimonio:    { r: 1.5,   v: 0.6,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "Mix de pagadores define salud financiera. Aseguradoras: DSO 60-120 días."
  },

  "17": {
    nombre: "Educación Privada",
    scian: "611",
    universo_pyme: 48000,
    credito_pct_default: 1.00,
    sueldo_imputado_obligatorio: true,
    confianza: "Alto",
    metricas: {
      margen_bruto:        { r: 0.35,  v: 0.45,  dir: "mayor" },
      margen_ebitda:       { r: 0.08,  v: 0.14,  dir: "mayor" },
      margen_operativo:    { r: 0.05,  v: 0.09,  dir: "mayor" },
      margen_neto:         { r: 0.03,  v: 0.06,  dir: "mayor" },
      roic:                { r: 0.06,  v: 0.10,  dir: "mayor" },
      ccc:                 { r: 30,    v: 15,    dir: "menor" },
      dso:                 { r: 45,    v: 30,    dir: "menor" },
      doh:                 { r: 15,    v: 5,     dir: "menor" },
      dpo:                 { r: 20,    v: 40,    dir: "mayor" },
      razon_corriente:     { r: 1.0,   v: 1.5,   dir: "mayor" },
      prueba_acida:        { r: 0.8,   v: 1.2,   dir: "mayor" },
      deuda_activos:       { r: 0.45,  v: 0.25,  dir: "menor" },
      deuda_patrimonio:    { r: 0.6,   v: 0.3,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "Morosidad oculta en matrícula (DSO>30) destruye flujo. Ciclo ago-jun."
  },

  "18": {
    nombre: "Transporte y Logística",
    scian: "484/488/492/493",
    universo_pyme: 220000,
    credito_pct_default: 0.85,
    advertencia_ebitda: true, // CapEx reposición absorbe 40-70% del EBITDA
    confianza: "Alto",
    metricas: {
      margen_bruto:        { r: 0.18,  v: 0.24,  dir: "mayor" },
      margen_ebitda:       { r: 0.06,  v: 0.10,  dir: "mayor" },
      margen_operativo:    { r: 0.03,  v: 0.07,  dir: "mayor" },
      margen_neto:         { r: 0.01,  v: 0.03,  dir: "mayor" },
      roic:                { r: 0.05,  v: 0.09,  dir: "mayor" },
      ccc:                 { r: 90,    v: 60,    dir: "menor" },
      dso:                 { r: 90,    v: 60,    dir: "menor" },
      doh:                 { r: 20,    v: 10,    dir: "menor" },
      dpo:                 { r: 25,    v: 45,    dir: "mayor" },
      razon_corriente:     { r: 0.9,   v: 1.3,   dir: "mayor" },
      prueba_acida:        { r: 0.7,   v: 1.1,   dir: "mayor" },
      deuda_activos:       { r: 0.65,  v: 0.45,  dir: "menor" },
      deuda_patrimonio:    { r: 1.8,   v: 1.0,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 2.5,   dir: "mayor" },
    },
    nota: "⚠ EBITDA ENGAÑOSO: CapEx de reposición de flota absorbe 40-70%. Flota promedio: 19.8 años."
  },

  "19": {
    nombre: "Belleza, Estética y Cuidado Personal",
    scian: "812",
    universo_pyme: 310000,
    credito_pct_default: 0.00,
    sueldo_imputado_obligatorio: true,
    excepcion_razon_corriente: true,
    confianza: "Medio-Bajo",
    metricas: {
      margen_bruto:        { r: 0.35,  v: 0.45,  dir: "mayor" },
      margen_ebitda:       { r: 0.08,  v: 0.15,  dir: "mayor" },
      margen_operativo:    { r: 0.05,  v: 0.10,  dir: "mayor" },
      margen_neto:         { r: 0.03,  v: 0.07,  dir: "mayor" },
      roic:                { r: 0.08,  v: 0.14,  dir: "mayor" },
      ccc:                 { r: 15,    v: 0,     dir: "menor" },
      dso:                 { r: 10,    v: 3,     dir: "menor" },
      doh:                 { r: 45,    v: 20,    dir: "menor" },
      dpo:                 { r: 20,    v: 40,    dir: "mayor" },
      razon_corriente:     { r: 1.0,   v: 1.5,   dir: "mayor" },
      prueba_acida:        { r: 0.8,   v: 1.2,   dir: "mayor" },
      deuda_activos:       { r: 0.35,  v: 0.15,  dir: "menor" },
      deuda_patrimonio:    { r: 0.5,   v: 0.2,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "CCC típicamente negativo. Informalidad laboral infla MB: forzar sueldo imputado siempre."
  },

  "20": {
    nombre: "Mantenimiento, Reparación y Talleres Automotrices",
    scian: "811",
    universo_pyme: 262000,
    credito_pct_default: 0.20,
    confianza: "Medio",
    metricas: {
      margen_bruto:        { r: 0.25,  v: 0.32,  dir: "mayor" },
      margen_ebitda:       { r: 0.07,  v: 0.13,  dir: "mayor" },
      margen_operativo:    { r: 0.05,  v: 0.10,  dir: "mayor" },
      margen_neto:         { r: 0.03,  v: 0.06,  dir: "mayor" },
      roic:                { r: 0.07,  v: 0.12,  dir: "mayor" },
      ccc:                 { r: 45,    v: 20,    dir: "menor" },
      dso:                 { r: 40,    v: 15,    dir: "menor" },
      doh:                 { r: 50,    v: 25,    dir: "menor" },
      dpo:                 { r: 20,    v: 40,    dir: "mayor" },
      razon_corriente:     { r: 1.0,   v: 1.5,   dir: "mayor" },
      prueba_acida:        { r: 0.7,   v: 1.1,   dir: "mayor" },
      deuda_activos:       { r: 0.45,  v: 0.25,  dir: "menor" },
      deuda_patrimonio:    { r: 0.8,   v: 0.4,   dir: "menor" },
      cobertura_intereses: { r: 1.5,   v: 3.0,   dir: "mayor" },
    },
    nota: "DSO<5 días es precondición de saneamiento. Cargar refacciones a tarjeta + dar fiado = caos de CCC."
  }

}; // fin BENCHMARKS


/* ================================================================
   §3 — PARÁMETROS WACC POR SECTOR
   Fuente: Damodaran Global Betas ene-2026 + ajuste PyME México
   ================================================================ */
const WACC_PARAMS = {
  "01": { beta_U: 0.80, DE_optimo: 0.50, beta_L: 1.08, Ke: 0.1974, Kd: 0.16, WACC: 0.169 },
  "02": { beta_U: 0.85, DE_optimo: 0.54, beta_L: 1.15, Ke: 0.2021, Kd: 0.16, WACC: 0.172 },
  "03": { beta_U: 0.90, DE_optimo: 0.54, beta_L: 1.22, Ke: 0.2064, Kd: 0.16, WACC: 0.175 },
  "04": { beta_U: 1.05, DE_optimo: 0.54, beta_L: 1.42, Ke: 0.2201, Kd: 0.16, WACC: 0.184 },
  "05": { beta_U: 0.90, DE_optimo: 0.54, beta_L: 1.22, Ke: 0.2064, Kd: 0.16, WACC: 0.175 },
  "06": { beta_U: 0.78, DE_optimo: 0.54, beta_L: 1.05, Ke: 0.1955, Kd: 0.16, WACC: 0.168 },
  "07": { beta_U: 0.55, DE_optimo: 0.67, beta_L: 0.81, Ke: 0.1770, Kd: 0.155, WACC: 0.150 },
  "08": { beta_U: 0.75, DE_optimo: 0.67, beta_L: 1.10, Ke: 0.1970, Kd: 0.17,  WACC: 0.166 },
  "09": { beta_U: 1.05, DE_optimo: 0.67, beta_L: 1.54, Ke: 0.2280, Kd: 0.165, WACC: 0.183 },
  "10": { beta_U: 0.75, DE_optimo: 0.67, beta_L: 1.10, Ke: 0.1970, Kd: 0.165, WACC: 0.164 },
  "11": { beta_U: 0.75, DE_optimo: 0.90, beta_L: 1.22, Ke: 0.2050, Kd: 0.17,  WACC: 0.166 },
  "12": { beta_U: 0.85, DE_optimo: 0.67, beta_L: 1.25, Ke: 0.2075, Kd: 0.165, WACC: 0.171 },
  "13": { beta_U: 0.77, DE_optimo: 0.67, beta_L: 1.13, Ke: 0.2010, Kd: 0.16,  WACC: 0.166 },
  "14": { beta_U: 0.83, DE_optimo: 1.22, beta_L: 1.54, Ke: 0.2280, Kd: 0.155, WACC: 0.163 },
  "15": { beta_U: 0.77, DE_optimo: 0.25, beta_L: 0.90, Ke: 0.1850, Kd: 0.16,  WACC: 0.170 },
  "16": { beta_U: 0.62, DE_optimo: 0.82, beta_L: 0.97, Ke: 0.1900, Kd: 0.15,  WACC: 0.152 },
  "17": { beta_U: 0.95, DE_optimo: 0.30, beta_L: 1.15, Ke: 0.2020, Kd: 0.15,  WACC: 0.180 },
  "18": { beta_U: 0.85, DE_optimo: 1.20, beta_L: 1.56, Ke: 0.2300, Kd: 0.16,  WACC: 0.166 },
  "19": { beta_U: 0.90, DE_optimo: 0.20, beta_L: 1.03, Ke: 0.1940, Kd: 0.15,  WACC: 0.179 },
  "20": { beta_U: 0.95, DE_optimo: 0.40, beta_L: 1.22, Ke: 0.2060, Kd: 0.15,  WACC: 0.178 },
};


/* ================================================================
   §4 — CATÁLOGO DE METAS VBM — 45 METAS
   Estructura de cada meta:
   { id, pilar, nombre, condicion_fn(m), impacto_eva_fn(m,i), texto_consultor, texto_cliente }
   m = métricas calculadas, i = inputs del usuario
   ================================================================ */
const CATALOGO_METAS = [

  /* ════════════════ OVERRIDES (Alertas de Supervivencia) ════════════════ */

  {
    id: "O1",
    pilar: "estructura",
    prioridad: "critica",
    nombre: "Riesgo de Insolvencia: Cobertura de Intereses Crítica",
    condicion: (m) => m.cobertura_intereses !== null && m.cobertura_intereses < 1.5,
    meta_valor: 1.5,
    meta_metrica: "cobertura_intereses",
    impacto_eva: (m, i) => {
      if (!m.cobertura_intereses || !i.gastos_financieros) return 0;
      const ebit_adicional = i.gastos_financieros * (1.5 - m.cobertura_intereses);
      return ebit_adicional * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Llama hoy mismo a tu banco y pide una prórroga o una reducción de la tasa de interés de tu crédito. Lo peor que te pueden decir es que no.",
      "Vende cualquier activo que tengas parado: maquinaria sin usar, vehículos, inventario viejo. Convierte todo en efectivo ahora.",
      "Revisa cuáles deudas puedes cambiar de banco a uno con tasa más baja. NAFIN y Bancomext tienen créditos para PyMEs mucho más baratos que la banca comercial.",
      "Cancela gastos fijos que no generan ventas directas: suscripciones de software, pólizas sin uso, servicios que nadie ocupa.",
    ],
    texto_consultor: `La empresa no genera suficiente EBIT para cubrir 1.5× sus intereses. Esto activa covenants bancarios y cierra el acceso a nuevo crédito. Acción inmediata: renegociar plazos, reducir deuda o aumentar EBIT.`,
    texto_cliente: `Tu negocio gana menos de lo que necesita para pagar los intereses de sus deudas con margen de seguridad. Esto es una señal de alerta roja.`
  },

  {
    id: "O2",
    pilar: "liquidez",
    prioridad: "critica",
    nombre: "Insolvencia Técnica: Razón Corriente Crítica",
    condicion: (m, i, sector) => {
      if (m.razon_corriente >= 1.0) return false;
      // EXCEPCIÓN: Restaurantes (13), Abarrotes (01), Belleza (19) con CCC<=0 y Cobertura>2x
      const sectores_excepcion = ["01", "13", "19", "812", "461", "722"];
      const tieneExcepcion = sector && (sectores_excepcion.includes(sector) || (BENCHMARKS[sector] && BENCHMARKS[sector].excepcion_razon_corriente));
      if (tieneExcepcion && m.ccc <= 0 && m.cobertura_intereses > 2) return false;
      return true;
    },
    meta_valor: 1.0,
    meta_metrica: "razon_corriente",
    impacto_eva: (m, i) => {
      const ktno_adicional = (1.0 - m.razon_corriente) * i.pasivos_corrientes * 0.05 * (1 - i.tasa_impuesto);
      return Math.max(0, ktno_adicional);
    },
    estrategias: [
      "Haz una lista de todo lo que te deben tus clientes esta semana y sal a cobrar personalmente. Cada peso en la calle te está costando intereses.",
      "Habla con tus proveedores y pídeles más tiempo para pagar. La mayoría prefieren darte 30 días extra a perder un cliente.",
      "Deja de comprar inventario o materiales a crédito si no los puedes pagar. Compra solo lo que vas a vender en los próximos 15 días.",
      "Si tienes mercancía o equipo que puedas devolver o liquidar, hazlo ya. Necesitas efectivo en caja, no cosas guardadas.",
    ],
    texto_consultor: `Los activos circulantes no alcanzan a cubrir los pasivos de corto plazo. La empresa puede no pagar proveedores o nómina en los próximos meses. Requiere inyección de capital o liquidación urgente de inventario.`,
    texto_cliente: `Lo que tu negocio tiene disponible en el corto plazo no alcanza para pagar lo que debe en el corto plazo. Debes actuar de inmediato.`
  },

  {
    id: "O3",
    pilar: "estructura",
    prioridad: "critica",
    nombre: "Apalancamiento Insostenible: Deuda Neta / EBITDA > 4.5×",
    condicion: (m) => m.deuda_neta_ebitda !== null && m.deuda_neta_ebitda > 4.5,
    meta_valor: 4.5,
    meta_metrica: "deuda_neta_ebitda",
    impacto_eva: (m, i) => {
      if (!i.ebitda || i.ebitda <= 0) return 0;
      const deuda_exceso = (m.deuda_neta_ebitda - 4.5) * i.ebitda;
      return deuda_exceso * m.wacc * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Tu deuda es demasiado grande para lo que genera el negocio. Habla con todos tus acreedores y negocia una quita o un plan de pagos más largo.",
      "Identifica los 2 o 3 créditos más caros que tienes (tarjetas, FinTech) y liquídalos primero aunque tengas que sacrificar otros gastos.",
      "Revisa si puedes consolidar toda tu deuda en un solo crédito con tasa fija y plazo más largo. Bancos como BBVA o Santander tienen programas de restructura.",
      "Deja de pedir prestado para pagar lo que ya debes. Ese círculo vicioso destruye el negocio. Hay que atacar la deuda con flujo operativo.",
    ],
    texto_consultor: `El nivel de deuda neta supera 4.5× el EBITDA. Este ratio activa cláusulas de incumplimiento en créditos bancarios y hace virtualmente imposible obtener financiamiento adicional.`,
    texto_cliente: `Tu deuda es más de 4.5 veces lo que genera tu negocio antes de intereses e impuestos. Eso es demasiado riesgo.`
  },

  {
    id: "O4",
    pilar: "rentabilidad",
    prioridad: "critica",
    nombre: "Deterioro Estructural: EBITDA Negativo Sostenido",
    condicion: (m, i) => m.margen_ebitda < 0,
    meta_valor: 0,
    meta_metrica: "margen_ebitda",
    impacto_eva: (m, i) => {
      return Math.abs(m.ebitda || 0) * 0.5 * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "El negocio está perdiendo dinero en su operación básica. Antes de cualquier cosa, necesitas saber exactamente dónde se va cada peso: haz un presupuesto semanal.",
      "Identifica los 3 productos o servicios que más te cuestan y que menos venden. Elimínalos del catálogo. Menos opciones, más enfoque.",
      "Revisa tu precio de venta: puede que estés vendiendo más barato que lo que te cuesta producir. Sube precios aunque sea un 10% esta semana.",
      "Corta todo gasto que no sea absolutamente necesario para abrir mañana: personal de más, renta de espacios vacíos, vehículos sin uso.",
    ],
    texto_consultor: `EBITDA negativo: la operación destruye valor antes de intereses, impuestos y depreciación. El modelo de negocio debe ser restructurado.`,
    texto_cliente: `Tu negocio está perdiendo dinero en su operación básica. Cada día que pasa, el problema se acumula.`
  },

  {
    id: "O5",
    pilar: "liquidez",
    prioridad: "critica",
    nombre: "Crisis de Caja: Menos de 15 Días de Operación",
    condicion: (m) => m.dias_caja !== null && m.dias_caja < 15,
    meta_valor: 15,
    meta_metrica: "dias_caja",
    impacto_eva: (m, i) => {
      const caja_necesaria = ((i.cogs + i.opex) / 365) * (15 - (m.dias_caja || 0));
      return caja_necesaria * m.wacc;
    },
    estrategias: [
      "Con menos de 15 días de efectivo en caja, tienes una emergencia. Cobra todo lo que te deban hoy mismo, aunque sea ofreciendo un descuento del 5%.",
      "Contacta a tus 3 mejores clientes y ofréceles un descuento por pagar por adelantado el siguiente mes de servicio o producto.",
      "Habla con tu banco para activar una línea de crédito revolvente. Es para emergencias exactamente como esta.",
      "Suspende cualquier gasto que no sea nómina, renta y materias primas hasta que recuperes al menos 30 días de operación en caja.",
    ],
    texto_consultor: `La empresa tiene menos de 15 días de caja para operar. Cualquier retraso en cobros o pago de nómina genera incumplimiento inmediato.`,
    texto_cliente: `Tienes dinero en caja para operar menos de 15 días. Necesitas liquidez urgente.`
  },

  {
    id: "O6",
    pilar: "rentabilidad",
    prioridad: "critica",
    nombre: "Operación con Margen EBITDA Negativo",
    condicion: (m) => m.margen_ebitda < 0,
    meta_valor: 0,
    meta_metrica: "margen_ebitda",
    impacto_eva: (m, i) => 0,
    estrategias: [
      "Si después de pagar todo lo que cuesta operar el negocio queda negativo, necesitas revisar tu modelo de negocio desde la raíz.",
      "Sube tus precios ahora. Muchas PyMEs cobran lo que la competencia cobra, no lo que les cuesta. Haz el cálculo de lo que te cuesta realmente producir y ponle margen encima.",
      "Elimina líneas de productos o servicios que vendes a pérdida aunque sea por costumbre o por 'quedar bien' con clientes.",
      "Reduce la nómina si es necesario. Es la decisión más difícil, pero es mejor un equipo pequeño rentable que uno grande que quiebra.",
    ],
    texto_consultor: `Margen EBITDA negativo: la empresa destruye valor incluso antes de financiamiento e impuestos.`,
    texto_cliente: `El negocio no genera suficiente para cubrir ni sus costos operativos básicos.`
  },

  {
    id: "O7",
    pilar: "rentabilidad",
    prioridad: "critica",
    nombre: "Destrucción de Valor Sostenida: ROIC < WACC",
    condicion: (m) => m.roic < m.wacc,
    meta_valor_fn: (m) => m.wacc,
    meta_metrica: "roic",
    impacto_eva: (m, i) => m.eva < 0 ? Math.abs(m.eva) : 0,
    estrategias: [
      "Tu negocio trabaja todo el año para ganar menos de lo que costaría tener ese dinero en un fondo de inversión. Algo tiene que cambiar.",
      "Identifica cuál parte del negocio sí genera ganancia real y cuál la jala hacia abajo. A veces hay que cerrar una sucursal o una línea entera para salvar el resto.",
      "Revisa si el problema es que vendes poco (necesitas crecer) o que tus costos son muy altos (necesitas recortar). Son soluciones distintas.",
      "Habla con un contador o con tu consultor para hacer una revisión completa. Dos pares de ojos ven lo que tú ya no puedes ver por estar metido en el día a día.",
    ],
    texto_consultor: `El ROIC está por debajo del WACC. La empresa destruye valor económico aunque reporte utilidad contable. El patrimonio de los socios se erosiona silenciosamente.`,
    texto_cliente: `Tu negocio gana menos de lo que le cuesta usar su propio dinero. Aunque veas ganancias en papel, en realidad estás perdiendo valor.`
  },

  /* ════════════════ RENTABILIDAD ════════════════════════════════════════ */

  {
    id: "R01",
    pilar: "rentabilidad",
    prioridad: "alta",
    nombre: "Aumentar Margen Bruto al Benchmark Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.margen_bruto < b.metricas.margen_bruto.v;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.margen_bruto.v || 0,
    meta_metrica: "margen_bruto",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.margen_bruto.v || m.margen_bruto;
      const delta_mb = (bv - m.margen_bruto) * i.ventas;
      return delta_mb * (1 - i.tasa_impuesto) - (i.capital_invertido * m.wacc * 0);
    },
    estrategias: [
      "Revisa tu lista de precios. Si no la has subido en más de 6 meses y la inflación ha sido del 5% o más, ya estás perdiendo margen sin darte cuenta.",
      "Negocia descuentos por volumen con tus proveedores principales. Si les compras más concentrado, te van a dar mejor precio y eso sube tu margen directo.",
      "Elimina los productos o servicios que vendes con muy poco margen solo por 'completar el catálogo'. Enfócate en lo que sí deja ganancia.",
      "Reduce el desperdicio o las mermas en tu proceso. En muchos negocios, entre el 3% y el 8% del material se tira o se pierde, y eso sale directo de tu ganancia bruta.",
    ],
    texto_consultor: `El margen bruto está por debajo del benchmark sectorial Verde. Palancas: revisar política de precios, renegociar con proveedores, mejorar mix de productos, reducir mermas.`,
    texto_cliente: `Tu margen de ganancia por cada peso vendido está por debajo del promedio de tu industria.`
  },

  {
    id: "R02",
    pilar: "rentabilidad",
    prioridad: "alta",
    nombre: "Reducir Gastos de Operación (OPEX) para Alcanzar Margen Operativo Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.margen_operativo < b.metricas.margen_operativo.v;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.margen_operativo.v || 0,
    meta_metrica: "margen_operativo",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.margen_operativo.v || m.margen_operativo;
      const delta_opex = (bv - m.margen_operativo) * i.ventas;
      return delta_opex * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Haz una lista de todos tus gastos fijos del mes y táchalo que no sea absolutamente indispensable para que el negocio funcione mañana.",
      "Cancela suscripciones de software, servicios o membresías que el equipo ya no usa activamente. Revisa los estados de cuenta de los últimos 3 meses.",
      "Renegocia el contrato de renta de tu local. Si llevas más de 2 años en el mismo lugar, tienes poder de negociación para pedir mejores condiciones.",
      "Revisa si puedes hacer con 2 personas lo que hoy hacen 3, reorganizando funciones. A veces el problema no es cuánta gente tienes, sino cómo están organizadas.",
    ],
    texto_consultor: `El margen operativo (EBIT/Ventas) está por debajo del benchmark. Revisión de estructura de gastos administrativos y de ventas.`,
    texto_cliente: `Tus gastos de operación están consumiendo demasiado de tus ganancias brutas.`
  },

  {
    id: "R03",
    pilar: "rentabilidad",
    prioridad: "media",
    nombre: "Elevar NOPAT mediante Optimización Fiscal (Régimen Adecuado)",
    condicion: (m, i) => i.regimen === "ISR_PM" && i.ventas < 35000000,
    meta_valor: null,
    meta_metrica: "nopat",
    impacto_eva: (m, i) => {
      const ahorro_fiscal = m.ebit * (0.30 - 0.25);
      return ahorro_fiscal;
    },
    estrategias: [
      "Habla con tu contador sobre si el régimen fiscal en el que estás es el más conveniente para tu nivel de ingresos. Puede que estés pagando más impuestos de los que deberías.",
      "Si estás en ISR general y tus ingresos son menores a $3.5 millones al año, pregunta si el régimen RESICO te conviene. Puede ahorrarte dinero significativo.",
      "Asegúrate de estar deduciendo todos los gastos que legalmente puedes: gasolina, teléfono, internet, equipo de trabajo, papelería. Cada peso deducible reduce tu impuesto.",
      "Si tienes socios o familiares trabajando en el negocio sin sueldo formal, formaliza su pago. Además de hacer lo correcto, reduce la base gravable del negocio.",
    ],
    texto_consultor: `Empresa con ventas <$35M en régimen ISR PM. Evaluar RESICO (25% efectivo vs 30%) para elevar NOPAT ~7%. Requiere validación contable.`,
    texto_cliente: `Podrías pagar menos impuestos con el régimen fiscal correcto y así aumentar tu ganancia real.`
  },

  {
    id: "R04",
    pilar: "rentabilidad",
    prioridad: "alta",
    nombre: "Mejorar ROIC para Superar WACC (Crear Valor)",
    condicion: (m) => m.roic < m.wacc && m.roic > 0,
    meta_valor_fn: (m) => m.wacc + 0.02,
    meta_metrica: "roic",
    impacto_eva: (m, i) => {
      const delta_roic = (m.wacc + 0.02) - m.roic;
      return delta_roic * i.capital_invertido;
    },
    estrategias: [
      "El negocio está ganando menos de lo que costaría meter ese dinero en otro lado. La solución es clara: vender más con los mismos costos, o bajar costos con las mismas ventas.",
      "Identifica cuál de tus productos o servicios tiene el mejor margen y enfoca tu energía de ventas ahí. No todos los productos valen lo mismo para el negocio.",
      "Busca si hay algún activo que el negocio tiene y no está usando: una máquina, un espacio, un vehículo. Ponlo a trabajar o véndelo para liberar capital.",
      "Revisa si hay clientes que te dan mucho trabajo y poca ganancia. A veces perder a un cliente malo mejora el negocio.",
    ],
    texto_consultor: `ROIC está por debajo del WACC. Meta: llevar el spread ROIC-WACC al menos a +2 pp mediante incremento de NOPAT o reducción de Capital Invertido.`,
    texto_cliente: `Tu negocio necesita ser más rentable para que cada peso invertido en él valga más que en otra alternativa.`
  },

  {
    id: "R05",
    pilar: "rentabilidad",
    prioridad: "media",
    nombre: "Reducir COGS: Renegociar Proveedores o Mejorar Mix",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.margen_bruto < b.metricas.margen_bruto.r;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.margen_bruto.r || 0,
    meta_metrica: "margen_bruto",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.margen_bruto.r || m.margen_bruto;
      return (bv - m.margen_bruto) * i.ventas * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Cotiza con al menos 3 proveedores distintos para tus materiales o mercancía principal. La competencia entre ellos casi siempre baja el precio.",
      "Compra en volumen lo que sí sabes que vas a vender. El descuento por comprar más puede mejorar tu margen entre 2% y 5% de golpe.",
      "Revisa si puedes sustituir algún insumo caro por uno equivalente de menor costo sin que el cliente note la diferencia en calidad.",
      "Negocia con tu proveedor principal un acuerdo de largo plazo: tú te comprometes a comprarle todo el año y él te da precio preferencial.",
    ],
    texto_consultor: `Margen Bruto en zona Roja. Renegociación urgente de proveedores o revisión de estructura de costos directos.`,
    texto_cliente: `El costo de lo que vendes es demasiado alto. Debes conseguir mejores precios de tus proveedores.`
  },

  {
    id: "R06",
    pilar: "rentabilidad",
    prioridad: "media",
    nombre: "Imputar Sueldo Justo de Dirección para Diagnóstico Real",
    condicion: (m, i, sid) => {
      const sect = BENCHMARKS[sid];
      return sect && sect.sueldo_imputado_obligatorio && (!i.sueldo_imputado || i.sueldo_imputado === 0);
    },
    meta_valor: null,
    meta_metrica: "margen_operativo",
    impacto_eva: (m, i) => -(i.sueldo_imputado || 0) * (1 - i.tasa_impuesto),
    estrategias: [
      "Pónte un sueldo fijo como dueño. Si no lo haces, el negocio parece más rentable de lo que es, y un día se acaba el dinero sin saber por qué.",
      "Ese sueldo debe ser lo que pagarías a alguien más para hacer lo que tú haces. Si tú diriges el negocio, págalo como director general.",
      "Separa tu cuenta personal de la cuenta del negocio desde hoy. Son dos cosas distintas y mezclarlas te impide saber si el negocio realmente gana.",
      "Una vez que te pongas sueldo, mide si el negocio sigue siendo rentable. Si no lo es, tienes un autoempleo, no una empresa. Eso hay que solucionarlo.",
    ],
    texto_consultor: `El propietario no se asigna salario de mercado. Sin imputar Sueldo Justo de Dirección, el ROIC y Margen Operativo están artificialmente inflados. El diagnóstico no es válido sin este ajuste.`,
    texto_cliente: `No te estás pagando lo que vale tu trabajo. Cuando consideramos un sueldo justo para ti, el negocio puede ser menos rentable de lo que parece.`
  },

  {
    id: "R07",
    pilar: "rentabilidad",
    prioridad: "media",
    nombre: "Alcanzar Punto de Equilibrio en Ventas",
    condicion: (m, i) => i.ventas <= m.punto_equilibrio_pesos,
    meta_valor_fn: (m) => m.punto_equilibrio_pesos,
    meta_metrica: "ventas",
    impacto_eva: (m, i) => {
      if (!m.punto_equilibrio_pesos) return 0;
      const delta_ventas = m.punto_equilibrio_pesos - i.ventas;
      const margen_contrib = 1 - (i.cogs / i.ventas);
      return delta_ventas * margen_contrib * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Calcula cuánto necesitas vender cada día para pagar todos tus costos fijos. Si no llegas a eso, ese día el negocio perdió dinero.",
      "Sube tus ventas o baja tus costos fijos: esas son las únicas dos formas de mejorar el punto de equilibrio. No hay magia.",
      "Revisa si tu local es más grande de lo que necesitas. La renta suele ser el costo fijo más pesado y el más difícil de bajar, pero a veces sí se puede renegociar.",
      "Considera si puedes hacer algunas funciones desde casa o de forma remota para reducir gastos de instalaciones sin afectar la operación.",
    ],
    texto_consultor: `Las ventas actuales están por debajo del Punto de Equilibrio. La empresa opera con pérdida operativa. Meta: alcanzar PE en pesos y reducir días de PE.`,
    texto_cliente: `Todavía no vendes suficiente para cubrir todos tus costos fijos. Necesitas aumentar tus ventas.`
  },

  {
    id: "R08",
    pilar: "rentabilidad",
    prioridad: "baja",
    nombre: "Aumentar Ingresos No Operativos o Eliminar Gastos No Recurrentes",
    condicion: (m, i) => i.gastos_no_operativos > i.ingresos_no_operativos,
    meta_valor: null,
    meta_metrica: "margen_neto",
    impacto_eva: (m, i) => {
      const delta = (i.gastos_no_operativos - i.ingresos_no_operativos) * (1 - i.tasa_impuesto);
      return delta;
    },
    estrategias: [
      "Identifica qué gastos que no tienen que ver con la operación principal del negocio estás pagando. Si no te generan clientes ni producción, córtalos.",
      "Revisa si hay pérdidas por robos, mermas o activos dados de baja que puedas prevenir con mejor control interno.",
      "Si tienes ingresos por actividades secundarias (rentas, inversiones), asegúrate de que estén bien contabilizados para que no distorsionen la foto real del negocio.",
      "Cualquier gasto extraordinario que se repita cada año ya no es extraordinario. Presupuéstalo formalmente para no llevarte sorpresas.",
    ],
    texto_consultor: `Los gastos no operativos superan los ingresos no operativos, deprimiendo la utilidad neta sin relación con la operación central.`,
    texto_cliente: `Tienes gastos fuera de tu negocio principal que están reduciendo tu ganancia final.`
  },

  {
    id: "R09",
    pilar: "rentabilidad",
    prioridad: "media",
    nombre: "Elevar EBITDA al Nivel Benchmark Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.margen_ebitda < b.metricas.margen_ebitda.v && m.margen_ebitda >= 0;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.margen_ebitda.v || 0,
    meta_metrica: "margen_ebitda",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.margen_ebitda.v || m.margen_ebitda;
      return (bv - m.margen_ebitda) * i.ventas * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Tu generación de efectivo operativa está por debajo del promedio de negocios como el tuyo. Revisa precio y costos juntos, porque afectan el mismo resultado.",
      "Busca mejorar el EBITDA atacando por dos lados: subiendo ventas un 5% Y reduciendo gastos un 5% al mismo tiempo. El efecto combinado es poderoso.",
      "Implementa una revisión mensual de tus números. Lo que no se mide no se mejora, y muchos dueños no saben cómo están hasta que ya es tarde.",
      "Habla con negocios similares al tuyo o con tu consultor para entender cómo están operando los que sí tienen buenos márgenes. Siempre hay algo que aprender.",
    ],
    texto_consultor: `EBITDA por debajo del benchmark Verde. Revisión de estructura operativa para alcanzar el umbral sectorial.`,
    texto_cliente: `Tu generación de efectivo operativo está por debajo del promedio de negocios similares.`
  },

  {
    id: "R10",
    pilar: "rentabilidad",
    prioridad: "baja",
    nombre: "Blindaje Competitivo: Mantener Margen Bruto en Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.margen_bruto >= b.metricas.margen_bruto.v;
    },
    meta_valor_fn: (m, i, sid) => (BENCHMARKS[sid]?.metricas.margen_bruto.v || 0) + 0.02,
    meta_metrica: "margen_bruto",
    impacto_eva: (m, i) => 0,
    estrategias: [
      "Tu margen bruto está en buena zona. La tarea ahora es no dejarlo caer: revísalo cada mes para que ningún aumento de costo te agarre desprevenido.",
      "Establece una política clara: si el costo de algún insumo sube más de 5%, automáticamente revisas el precio de venta. No esperes a que el margen se erosione.",
      "Fideliza a tus mejores proveedores con pagos puntuales. Los proveedores dan mejores precios a los clientes que no se los complican.",
      "Documenta cuáles productos tienen el mejor margen y haz que tu equipo de ventas los priorice. No todos los productos valen lo mismo para el negocio.",
    ],
    texto_consultor: `Margen Bruto en zona Verde. Meta de Blindaje: proteger este nivel ante presiones de proveedores o competencia de precios. Establecer revisión trimestral.`,
    texto_cliente: `Tu margen de ganancia es bueno. La meta es protegerlo y que se mantenga así.`
  },

  {
    id: "R11",
    pilar: "rentabilidad",
    prioridad: "media",
    nombre: "Mejorar Z-Score Altman: Reducir Riesgo de Quiebra",
    condicion: (m) => m.z_score !== null && m.z_score < 2.6,
    meta_valor: 2.6,
    meta_metrica: "z_score",
    impacto_eva: (m, i) => {
      if (!m.z_score) return 0;
      return (2.6 - m.z_score) * i.activo_total * 0.01 * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "El indicador de riesgo de quiebra de tu negocio está en zona de alerta. Eso significa que necesitas mejorar tu capital de trabajo y tus utilidades retenidas.",
      "Deja de sacar todo el dinero que genera el negocio. Empieza a acumular reservas. Aunque sea un 10% de la ganancia mensual guardada ya hace diferencia.",
      "Reduce las deudas lo más rápido posible. Cada peso de deuda que pagas mejora este indicador y da más oxígeno al negocio.",
      "Busca asesoría con tu banco o contador si este número está en zona roja. A veces hay programas de apoyo o restructura que no conoces.",
    ],
    texto_consultor: `Z-Score Altman en zona de alerta o quiebra (<2.6). El modelo estadístico señala riesgo sistémico. Requiere mejora de Capital de Trabajo y Utilidades Retenidas.`,
    texto_cliente: `Un indicador estadístico señala que tu negocio tiene mayor riesgo del que debería. Necesitamos fortalecer sus bases financieras.`
  },

  {
    id: "R12",
    pilar: "rentabilidad",
    prioridad: "baja",
    nombre: "Maximizar NOPCAF: Flujo de Caja Real Post-CAPEX",
    condicion: (m, i) => i.capex > 0 && m.nopcaf < m.nopat * 0.7,
    meta_valor_fn: (m) => m.nopat * 0.8,
    meta_metrica: "nopcaf",
    impacto_eva: (m, i) => {
      const delta = m.nopat * 0.8 - m.nopcaf;
      return delta > 0 ? delta * 0.5 : 0;
    },
    estrategias: [
      "El dinero que realmente queda en el negocio después de pagar todo (incluyendo inversiones) es mucho menos que lo que muestran las ganancias en papel. Revisa cuánto estás invirtiendo en activos.",
      "Antes de comprar cualquier equipo o maquinaria nueva, pregúntate: ¿se paga solo en menos de 2 años con el flujo que me va a generar? Si no, espera.",
      "Mantén un registro de cuánto gastas en mantenimiento y reposición de equipo cada año. Ese gasto tiene que salir de tu flujo, no es 'gratis' por ser depreciación.",
      "Si el flujo real de caja es negativo aunque las ganancias sean positivas, estás creciendo a crédito. Eso es insostenible. Hay que parar y reorganizar.",
    ],
    texto_consultor: `El NOPCAF (Flujo Operativo Real) es significativamente inferior al NOPAT. El CAPEX y/o cambios en KTNO están consumiendo el flujo contable. ⚠️ El EBITDA exagera la generación de efectivo disponible.`,
    texto_cliente: `El dinero que realmente queda en tu negocio después de inversiones es mucho menor de lo que muestran las ganancias en papel.`
  },

  /* ════════════════ LIQUIDEZ ════════════════════════════════════════════ */

  {
    id: "L01",
    pilar: "liquidez",
    prioridad: "alta",
    nombre: "Reducir Ciclo de Conversión de Efectivo (CCC) al Benchmark Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      if (!b) return false;
      const bv = b.metricas.ccc.v;
      return m.ccc > bv;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.ccc.v || 0,
    meta_metrica: "ccc",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.ccc.v || m.ccc;
      const delta_ccc = m.ccc - bv;
      const capital_liberado = (i.ventas / 365) * delta_ccc;
      return capital_liberado * m.wacc;
    },
    estrategias: [
      "El ciclo de tu negocio tarda demasiado en convertirse en efectivo. Ataca los tres frentes: cobra más rápido, rota el inventario más rápido y paga a proveedores más lento.",
      "Cada día que un peso está en bodega o en cuentas por cobrar te cuesta dinero. Pon metas semanales de cobranza y rotación de inventario como si fueran ventas.",
      "Habla con tus 5 clientes más grandes sobre la posibilidad de acortar sus plazos de pago a cambio de un pequeño descuento. Para ellos es negocio y para ti es oxígeno.",
      "Revisa tu proceso de compras. Comprar demasiado inventario 'por si acaso' es uno de los errores más comunes en PyMEs y destruye el flujo de caja.",
    ],
    texto_consultor: `CCC sobre benchmark Verde. Reducir CCC libera capital de trabajo que reduce la necesidad de financiamiento o permite reinversión en crecimiento.`,
    texto_cliente: `Tu dinero tarda demasiado en completar el ciclo de compra-venta-cobro. Acelerar este ciclo libera efectivo sin pedir prestado.`
  },

  {
    id: "L02",
    pilar: "liquidez",
    prioridad: "alta",
    nombre: "Reducir DSO: Cobrar Más Rápido",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.dso > b.metricas.dso.v && m.dso > 0;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.dso.v || m.dso,
    meta_metrica: "dso",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.dso.v || m.dso;
      const credito = i.ventas * (i.credito_pct || BENCHMARKS[sid]?.credito_pct_default || 0.5);
      const capital_liberado = (credito / 365) * (m.dso - bv);
      return capital_liberado * m.wacc;
    },
    estrategias: [
      "Haz una lista de todos los clientes que te deben dinero, ordénala del más grande al más chico y empieza a cobrar hoy mismo. Lo más grande primero.",
      "Ofrece a tus clientes un 3% a 5% de descuento si pagan en los próximos 7 días. Ese descuento suele costar menos que lo que te cobrarían por un crédito.",
      "Implementa la regla de 'no más servicio o producto sin pago al corriente'. Es incómodo decirlo, pero los clientes que siempre deben son los que más daño hacen.",
      "Si algún cliente te debe más de 60 días, considera contratar un despacho de cobranza o vender esa factura a una empresa de factoraje para tener el efectivo ahora.",
    ],
    texto_consultor: `DSO sobre benchmark Verde. Implementar descuentos por pronto pago, factoraje, o políticas de cobranza activas. Cada día de DSO reducido libera capital.`,
    texto_cliente: `Tus clientes te pagan demasiado tarde. Cobrar más rápido es como conseguir un préstamo gratis.`
  },

  {
    id: "L03",
    pilar: "liquidez",
    prioridad: "alta",
    nombre: "Reducir DOH: Rotar Inventario Más Rápido",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && b.metricas.doh.dir !== "na" && m.doh > b.metricas.doh.v && i.inventarios > 0;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.doh.v || m.doh,
    meta_metrica: "doh",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.doh.v || m.doh;
      const capital_liberado = (i.cogs / 365) * (m.doh - bv);
      return capital_liberado * m.wacc;
    },
    estrategias: [
      "Revisa tu inventario y saca los productos que llevan más de 3 meses sin moverse. Ponlos en descuento, regálalos a clientes frecuentes o devuélvelos al proveedor. El inventario viejo es dinero muerto.",
      "Implementa el sistema de 'lo primero que entró es lo primero que sale' (PEPS). Suena básico, pero muchos negocios venden lo nuevo y se les llenan de viejo.",
      "Haz un conteo físico de tu inventario al menos una vez al mes. Muchas veces hay diferencias entre lo que dice el sistema y lo que hay en bodega, y esas diferencias cuestan dinero.",
      "Compra inventario más seguido y en cantidades más pequeñas, aunque el precio unitario sea un poco mayor. Lo que ahorras en capital inmovilizado suele ser más que el descuento por volumen.",
    ],
    texto_consultor: `DOH sobre benchmark Verde. El inventario inmoviliza capital con costo. Estrategias: just-in-time, eliminación de SKUs de baja rotación, ofertas de liquidación.`,
    texto_cliente: `Tu inventario tarda demasiado en venderse. El dinero atrapado en bodegas podría estar trabajando para ti.`
  },

  {
    id: "L04",
    pilar: "liquidez",
    prioridad: "media",
    nombre: "Aumentar DPO: Negociar Más Días con Proveedores",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.dpo < b.metricas.dpo.v;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.dpo.v || m.dpo,
    meta_metrica: "dpo",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.dpo.v || m.dpo;
      const capital_liberado = (i.cogs / 365) * (bv - m.dpo);
      return capital_liberado * m.wacc;
    },
    estrategias: [
      "Llama a tus proveedores principales y pide ampliar el plazo de pago de 15 a 30 días, o de 30 a 45. Explícales que vas a comprarles más a cambio. Muchos dicen que sí.",
      "Paga siempre en la fecha límite, ni un día antes ni uno después. Muchos dueños pagan anticipado por costumbre y pierden días valiosos de liquidez sin necesidad.",
      "Busca nuevos proveedores que den mejores plazos. A veces el proveedor de toda la vida no es el más conveniente financieramente.",
      "Si algún proveedor te ofrece descuento por pago anticipado, calcula si ese descuento vale más que tener el efectivo en tu caja. A veces no conviene.",
    ],
    texto_consultor: `DPO por debajo del benchmark Verde. Negociar plazos más amplios con proveedores sin sacrificar descuentos por volumen es financiamiento gratuito.`,
    texto_cliente: `Puedes negociar pagar a tus proveedores en más días. Eso te da más tiempo para usar ese dinero en tu operación.`
  },

  {
    id: "L05",
    pilar: "liquidez",
    prioridad: "media",
    nombre: "Aumentar Días de Caja: Construir Colchón de Liquidez",
    condicion: (m) => m.dias_caja !== null && m.dias_caja < 30,
    meta_valor: 30,
    meta_metrica: "dias_caja",
    impacto_eva: (m, i) => {
      const caja_necesaria = ((i.cogs + i.opex) / 365) * (30 - (m.dias_caja || 0));
      return caja_necesaria * m.wacc * -1; // Costo de oportunidad de construir reserva
    },
    estrategias: [
      "Tener menos de 30 días de efectivo en caja es como manejar sin gasolina de reserva. Empieza a acumular: destina el 10% de cada venta a una cuenta de emergencias.",
      "Define una regla de negocio: nunca dejes caer la caja por debajo de lo que necesitas para pagar 30 días de nómina y renta. Eso es tu piso mínimo.",
      "Cobra por adelantado cuando puedas. Si ofreces un servicio mensual, cobra los primeros días del mes, no al final. Ese cambio de timing puede darte semanas de alivio.",
      "Habla con tu banco para tener una línea de crédito preaprobada aunque no la uses. Es para emergencias. Cuesta poco tenerla y puede salvarte en una crisis.",
    ],
    texto_consultor: `Días de Caja por debajo de 30. Construir reserva equivalente a 30-45 días de gastos operativos es la primera línea de defensa ante shocks de demanda.`,
    texto_cliente: `Necesitas tener más dinero disponible como reserva. Lo ideal es tener al menos un mes de gastos en el banco.`
  },

  {
    id: "L06",
    pilar: "liquidez",
    prioridad: "media",
    nombre: "Mejorar Razón Corriente al Umbral Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.razon_corriente < b.metricas.razon_corriente.v && m.razon_corriente >= 1.0;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.razon_corriente.v || 1.0,
    meta_metrica: "razon_corriente",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.razon_corriente.v || m.razon_corriente;
      const activos_adicionales = (bv - m.razon_corriente) * i.pasivos_corrientes;
      return activos_adicionales * m.wacc * 0.05;
    },
    estrategias: [
      "Lo que entra en los próximos 30 días no alcanza bien para pagar lo que sale en los próximos 30 días. Hay que mover el foco a cobrar más rápido o negociar más plazo con los que te cobran.",
      "Haz un presupuesto de caja semanal: cuánto entra y cuánto sale cada semana del próximo mes. Eso te dice exactamente cuándo va a tronar el dinero antes de que pase.",
      "Revisa si hay pagos que puedes diferir unos días sin consecuencias: algunos proveedores, algunos servicios. Ganar 10 días puede ser la diferencia.",
      "Si tienes clientes que pagan en efectivo, procura que eso entre antes de que salgan tus compromisos más grandes del mes.",
    ],
    texto_consultor: `Razón Corriente en zona Amarilla. Mejorar el balance de corto plazo mediante manejo óptimo de KTNO.`,
    texto_cliente: `Tienes capacidad de cubrir tus deudas de corto plazo, pero con poco margen. Es prudente mejorar este colchón.`
  },

  {
    id: "L07",
    pilar: "liquidez",
    prioridad: "media",
    nombre: "Mejorar Prueba Ácida: Liquidez sin Depender del Inventario",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.prueba_acida < b.metricas.prueba_acida.v;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.prueba_acida.v || m.prueba_acida,
    meta_metrica: "prueba_acida",
    impacto_eva: (m, i) => 0,
    estrategias: [
      "Si quitamos el inventario de la ecuación, el negocio no tiene suficiente liquidez rápida. Necesitas cobrar más rápido o tener más efectivo disponible.",
      "El inventario es el activo más lento de convertir en efectivo. Si depende de él para pagar, estás en riesgo. La solución es tener más cobranza al corriente.",
      "Revisa si puedes reducir el inventario mínimo que manejas. Muchos negocios tienen el doble de lo que necesitan 'por si se acaba'. Esa práctica cuesta liquidez.",
      "Busca que al menos el 70% de tus activos líquidos sean efectivo o cuentas por cobrar, no inventario. El inventario no paga nóminas.",
    ],
    texto_consultor: `Prueba Ácida por debajo del benchmark. Sin contar el inventario, la empresa tiene dificultades para cubrir pasivos inmediatos. Reducir inventario y acelerar cobros.`,
    texto_cliente: `Si sacamos del cálculo tu inventario (que tarda en venderse), tu liquidez se ve débil.`
  },

  {
    id: "L08",
    pilar: "liquidez",
    prioridad: "alta",
    nombre: "Implementar Factoraje para Acelerar Cobros (DSO en Rojo)",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.dso > b.metricas.dso.r;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.dso.r || m.dso,
    meta_metrica: "dso",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.dso.r || m.dso;
      const credito = i.ventas * (i.credito_pct || BENCHMARKS[sid]?.credito_pct_default || 0.5);
      const capital_liberado = (credito / 365) * (m.dso - bv);
      const costo_factoraje = capital_liberado * 0.02; // ~2% mensual
      return (capital_liberado * m.wacc) - costo_factoraje;
    },
    estrategias: [
      "Tus clientes te pagan muy tarde y eso te está estrangulando. Una solución rápida: vende tus facturas a una empresa de factoraje como COVALTO, Xepelin o Konfío. Cobras hoy aunque el cliente pague en 60 días.",
      "El costo del factoraje (2% a 4% mensual) suele ser menor a lo que te cuesta pedir un préstamo de emergencia. Evalúalo como una herramienta permanente, no solo de crisis.",
      "Implementa un 'semáforo de clientes': los que siempre pagan a tiempo reciben más crédito; los que siempre se atrasan, pagan por adelantado o al contado.",
      "Fija un límite de crédito por cliente basado en su historial de pago. Si alguien llega a ese límite sin pagar, se detienen los envíos hasta regularizar.",
    ],
    texto_consultor: `DSO en zona Roja. Evaluar factoraje financiero (Konfío, BBVA Supplier, cadenas productivas) para monetizar cartera vencida. El costo del factoraje suele ser menor al costo del capital de trabajo.`,
    texto_cliente: `Tus clientes te pagan muy tarde. Hay servicios financieros que te permiten cobrar antes a cambio de una pequeña comisión.`
  },

  {
    id: "L09",
    pilar: "liquidez",
    prioridad: "media",
    nombre: "Reducir Inventario Obsoleto o de Baja Rotación",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && b.metricas.doh.dir !== "na" && m.doh > b.metricas.doh.r && i.inventarios > 0;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.doh.r || m.doh,
    meta_metrica: "doh",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.doh.r || m.doh;
      const capital_liberado = (i.cogs / 365) * (m.doh - bv);
      return capital_liberado * m.wacc;
    },
    estrategias: [
      "Ese inventario que lleva meses sin moverse es dinero dormido que además ocupa espacio. Ponlo en liquidación esta semana aunque sea al costo.",
      "Ofrece a tus clientes frecuentes una 'oferta especial de temporada' con el inventario viejo. La gente siempre responde a un buen descuento.",
      "Habla con tu proveedor para ver si te acepta devolver la mercancía que no se ha movido a cambio de crédito para comprar algo que sí vende.",
      "Aprende la regla 80/20 del inventario: el 20% de tus productos generan el 80% de tus ventas. Enfócate en ese 20% y minimiza el resto.",
    ],
    texto_consultor: `DOH en zona Roja. Realizar levantamiento de inventario para identificar SKUs de baja rotación. Liquidar con descuento es mejor que financiar inventario muerto.`,
    texto_cliente: `Tienes mucho inventario que no se vende rápido. Eso es dinero dormido que te cuesta.`
  },

  {
    id: "L10",
    pilar: "liquidez",
    prioridad: "baja",
    nombre: "Optimizar CCC Integral: Atacar los Tres Componentes Simultáneamente",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      if (!b) return false;
      return m.dso > b.metricas.dso.v && m.doh > (b.metricas.doh.v || 0) && m.dpo < b.metricas.dpo.v;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.ccc.v || 0,
    meta_metrica: "ccc",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.ccc.v || m.ccc;
      const capital_liberado = (i.ventas / 365) * (m.ccc - bv);
      return capital_liberado * m.wacc;
    },
    estrategias: [
      "Los tres componentes del flujo (cobros, inventario y pagos) están todos fuera de control al mismo tiempo. Necesitas un plan de 90 días atacando los tres frentes.",
      "Semana 1 y 2: sal a cobrar todo lo que te deben. Semana 3 y 4: liquida inventario viejo. Mes 2: negocia más días con proveedores. Mes 3: consolida y mide.",
      "Ponle números a cada meta: quiero cobrar $X en los próximos 30 días, reducir el inventario en $Y, y extender el plazo de pago de Z días. Lo que no tiene número no se cumple.",
      "Pide ayuda. A veces el dueño está tan metido en la operación que no ve el problema. Un contador o consultor que revise los números con ojos frescos puede ver la solución más rápido.",
    ],
    texto_consultor: `Los tres componentes del CCC (DSO, DOH, DPO) están fuera del benchmark. Se recomienda plan integral de 90 días atacando los tres simultáneamente.`,
    texto_cliente: `Tanto en cobros, inventario, como en pagos a proveedores hay oportunidad de mejora. Un plan integrado liberará mucho efectivo.`
  },

  {
    id: "L11",
    pilar: "liquidez",
    prioridad: "baja",
    nombre: "Separar Cuentas Personales y Empresariales (PyME Informal)",
    condicion: (m, i) => i.es_informal === true,
    meta_valor: null,
    meta_metrica: null,
    impacto_eva: (m, i) => {
      const retiros = i.retiros_propietario || 0;
      return retiros * 0.10 * (1 - i.tasa_impuesto); // Estimado de mejora por control
    },
    estrategias: [
      "Abre una cuenta bancaria exclusiva para el negocio si no la tienes. Hoy mismo. Es el primer paso y es gratis.",
      "Deja de pagar gastos personales con la tarjeta o chequera del negocio. Gasolina personal, comida, ropa: todo eso va de tu sueldo como dueño, no de la empresa.",
      "Cuando mezclas dinero personal y del negocio, no sabes si ganas o pierdes. Esa confusión es lo que lleva a muchos negocios a quebrar sin entender por qué.",
      "Lleva un registro aunque sea simple de lo que entra y sale del negocio cada semana. Una hoja de Excel básica es mejor que nada.",
    ],
    texto_consultor: `Empresa informal con mezcla de gastos personales y empresariales. La separación de cuentas es el primer paso para un diagnóstico válido y para acceder a crédito formal.`,
    texto_cliente: `Mezclar gastos personales con los del negocio hace imposible saber si tu empresa realmente gana dinero.`
  },

  {
    id: "L12",
    pilar: "liquidez",
    prioridad: "media",
    nombre: "Reducir Días de Caja Comprometida en Deuda de Corto Plazo",
    condicion: (m, i) => i.deuda_cp > i.caja * 0.7,
    meta_valor: null,
    meta_metrica: "dias_caja",
    impacto_eva: (m, i) => {
      const refinanciamiento = i.deuda_cp * 0.5;
      return refinanciamiento * m.wacc * 0.05;
    },
    estrategias: [
      "Tienes muchas deudas que vencen pronto y poco efectivo para pagarlas. Habla con tu banco esta semana para reestructurar y convertir deuda de corto plazo a largo plazo.",
      "La reestructura de deuda no es señal de quiebra, es una decisión inteligente. Mejor pagar cómodo en 3 años que ahogarte en 6 meses.",
      "Prioriza el pago de las deudas más caras primero (tarjetas de crédito, FinTech). Mientras más rápido las liquidas, más dinero te quedas.",
      "No contrates nueva deuda para pagar deuda existente si puedes evitarlo. Eso es pagar con dinero prestado y el hoyo se hace más grande.",
    ],
    texto_consultor: `Alta concentración de deuda en corto plazo versus caja disponible. Negociar refinanciamiento a largo plazo para reducir presión de liquidez inmediata.`,
    texto_cliente: `Tienes muchas deudas que vencen pronto y poca caja para hacerles frente. Hay que reestructurar esos pagos.`
  },

  /* ════════════════ ESTRUCTURA ══════════════════════════════════════════ */

  {
    id: "E01",
    pilar: "estructura",
    prioridad: "alta",
    nombre: "Reducir Apalancamiento: Deuda/Activos al Benchmark Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.deuda_activos > b.metricas.deuda_activos.r;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.deuda_activos.v || m.deuda_activos,
    meta_metrica: "deuda_activos",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.deuda_activos.v || m.deuda_activos;
      const deuda_exceso = (m.deuda_activos - bv) * i.activo_total;
      return deuda_exceso * (m.kd || MACRO.Kd_default) * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Más de la mitad de lo que vale tu negocio está financiado con deuda. La prioridad es reducir eso pagando deudas y no contratando nuevas.",
      "Establece una regla personal: por cada peso que entre de utilidad, al menos 30 centavos se van a pagar deuda. El resto puede usarse o reinvertirse.",
      "Habla con NAFIN o Bancomext sobre si calificas para créditos a menor tasa. Reemplazar deuda cara por deuda barata reduce el problema significativamente.",
      "Evita usar deuda para gastos operativos (nómina, renta, servicios). La deuda solo debe usarse para activos que generan más de lo que cuestan.",
    ],
    texto_consultor: `Deuda/Activos en zona Roja. La estructura de capital destruye valor vía costo de intereses que supera el ROIC. Plan de amortización acelerada o capitalización de pasivos.`,
    texto_cliente: `Demasiada parte de tu negocio está financiada con deuda. Eso es costoso y riesgoso.`
  },

  {
    id: "E02",
    pilar: "estructura",
    prioridad: "alta",
    nombre: "Optimizar WACC: Mejorar Estructura de Financiamiento",
    condicion: (m, i) => m.wacc > 0.20,
    meta_valor: 0.18,
    meta_metrica: "wacc",
    impacto_eva: (m, i) => {
      const delta_wacc = m.wacc - 0.18;
      return delta_wacc * i.capital_invertido;
    },
    estrategias: [
      "Tu negocio está pagando demasiado caro por el dinero que usa. Busca activamente créditos más baratos: NAFIN tiene tasas desde el 10% anual para PyMEs formales.",
      "Aumentar el capital propio (que los socios metan más dinero) reduce el WACC porque el capital propio no cobra intereses mensuales.",
      "Mejorar la formalidad del negocio (estados financieros claros, declaraciones al corriente, buró limpio) te da acceso a crédito más barato. La formalidad tiene premio.",
      "Revisa si tienes activos dados en garantía que ya podrías liberar. Los créditos con garantía son más baratos que los quirografarios.",
    ],
    texto_consultor: `WACC superior al 20%. Optimizar la mezcla Deuda/Capital puede reducir el costo del capital. Evaluar fuentes alternativas de financiamiento (fondos de garantía, crowdfunding, equity).`,
    texto_cliente: `El costo de usar el dinero de tu negocio es muy alto. Hay formas de financiarte más barato.`
  },

  {
    id: "E03",
    pilar: "estructura",
    prioridad: "alta",
    nombre: "Reestructurar Deuda Sombra: Eliminar Tasas Agiotistas",
    condicion: (m, i) => i.deuda_sombra > 0,
    meta_valor: 0,
    meta_metrica: "deuda_sombra",
    impacto_eva: (m, i) => {
      const ahorro_intereses = i.deuda_sombra * 0.40; // Tasa promedio deuda sombra ~40%
      const reemplazo = i.deuda_sombra * (m.kd || 0.16); // Reemplazar con deuda formal
      return (ahorro_intereses - reemplazo) * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Tienes deudas que no aparecen en los libros del negocio: tarjetas personales del dueño, préstamos con conocidos, créditos FinTech. Eso cobra hasta el 120% anual. Hay que eliminarlas primero que nada.",
      "Abre una línea de crédito formal con tu banco aunque sea pequeña. Cuesta mucho menos que un crédito de FinTech de emergencia y te quita la necesidad de buscar préstamos caros.",
      "El dinero prestado a tasas de agiotista o tarjetas revolventes destruye el negocio. Si tienes que usar ese tipo de crédito para operar, el problema real es que el negocio no genera suficiente flujo.",
      "Formaliza el negocio para que puedas acceder a crédito bancario normal. Un negocio informal paga tasas de 3x a 10x más caras por no poder acreditar ingresos.",
    ],
    texto_consultor: `Se detectó Deuda Sombra (FinTech alta tasa, tarjetas personales, agiotistas). Esta deuda tiene tasas 2-4× superiores al crédito formal y destruye el ROIC. Meta: eliminar en 90 días y sustituir con líneas formales.`,
    texto_cliente: `Tienes deudas con tasas de interés muy altas (tarjetas personales, prestamistas). Eso te cuesta mucho más de lo necesario.`
  },

  {
    id: "E04",
    pilar: "estructura",
    prioridad: "media",
    nombre: "Reducir Deuda/Patrimonio al Benchmark Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.deuda_patrimonio > b.metricas.deuda_patrimonio.v;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.deuda_patrimonio.v || m.deuda_patrimonio,
    meta_metrica: "deuda_patrimonio",
    impacto_eva: (m, i) => 0,
    estrategias: [
      "Por cada peso que deben los socios en el negocio, hay demasiados pesos de deuda bancaria. Hay que equilibrar eso aportando más capital propio o reduciendo deudas.",
      "Si los socios tienen capacidad, esta es la oportunidad de hacer una aportación de capital. Es más barato que pedir prestado.",
      "Deja de sacar dinero del negocio como dividendos hasta que la deuda esté en niveles sanos. Reinvierte las utilidades para fortalecer el capital.",
      "Revisa si hay socios que deberían de cobrar por su trabajo en el negocio. A veces la deuda con socios esconde 'sueldos no pagados' que distorsionan el balance.",
    ],
    texto_consultor: `Ratio Deuda/Patrimonio sobre el benchmark. El apalancamiento excesivo amplifica pérdidas en ciclos bajos. Reducir pasivos o capitalizar reservas.`,
    texto_cliente: `Por cada peso que pones tú en el negocio, debes demasiado a los bancos o proveedores.`
  },

  {
    id: "E05",
    pilar: "estructura",
    prioridad: "media",
    nombre: "Aumentar Cobertura de Intereses al Benchmark Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.cobertura_intereses < b.metricas.cobertura_intereses.v && m.cobertura_intereses >= 1.5;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.cobertura_intereses.v || 3.0,
    meta_metrica: "cobertura_intereses",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.cobertura_intereses.v || 3.0;
      const ebit_adicional = (bv - m.cobertura_intereses) * i.gastos_financieros;
      return ebit_adicional * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Tu ganancia operativa cubre los intereses, pero el margen de seguridad es bajo. Si las ventas bajan un poco o los costos suben, puede que ya no alcance.",
      "La meta es tener una ganancia operativa que sea al menos 3 veces los intereses que pagas. Eso se logra vendiendo más o reduciendo deuda.",
      "Revisa si puedes prepagar algo de deuda este mes. Aunque sea una cantidad pequeña, reduce los intereses futuros y mejora tu capacidad de cobertura.",
      "Negocia con tu banco para que te bajen la tasa de interés si tu historial de pago ha sido bueno. A los 2 años de pagar puntual, tienes derecho a pedir revisión de tasa.",
    ],
    texto_consultor: `Cobertura de Intereses en zona Amarilla. Incrementar EBIT o refinanciar a tasa menor para alcanzar la zona Verde.`,
    texto_cliente: `Tu negocio genera suficiente para pagar sus intereses, pero el margen de seguridad no es el ideal.`
  },

  {
    id: "E06",
    pilar: "estructura",
    prioridad: "baja",
    nombre: "Migrar Deuda de Corto a Largo Plazo",
    condicion: (m, i) => i.deuda_cp > i.deuda_lp * 1.5 && (i.deuda_cp + i.deuda_lp) > 0,
    meta_valor: null,
    meta_metrica: null,
    impacto_eva: (m, i) => {
      const refinanciable = i.deuda_cp * 0.5;
      return refinanciable * m.wacc * 0.02; // Reducción de presión de liquidez
    },
    estrategias: [
      "Tienes muchas deudas que vencen este año y eso presiona tu caja todos los meses. Pide a tu banco convertir esos pagos a un plazo de 3 a 5 años.",
      "Las deudas de largo plazo cuestan un poco más de tasa, pero te dan tranquilidad operativa. Vale la pena el intercambio si el flujo de caja está apretado.",
      "Consolida varios créditos chicos en uno solo más grande a largo plazo. Menos pagos, menos estrés, mejor control.",
      "Asegúrate de que tus deudas de largo plazo financien activos de largo plazo (maquinaria, vehículos, inmuebles), no gastos operativos del día a día.",
    ],
    texto_consultor: `Alta concentración de deuda en corto plazo. Restructurar a largo plazo reduce presión de liquidez y permite invertir en capital de trabajo con certeza.`,
    texto_cliente: `Muchas de tus deudas vencen pronto. Negociar plazos más largos te da más tranquilidad financiera.`
  },

  {
    id: "E07",
    pilar: "estructura",
    prioridad: "media",
    nombre: "Reducir Capital Invertido Innecesario: Liberar Activos Improductivos",
    condicion: (m, i) => m.roic < m.wacc && i.activos_fijos_netos > 0,
    meta_valor_fn: (m) => m.wacc + 0.01,
    meta_metrica: "roic",
    impacto_eva: (m, i) => {
      const reduccion_ci = i.activos_fijos_netos * 0.10; // 10% de activos improductivos
      return reduccion_ci * m.wacc;
    },
    estrategias: [
      "Hay dinero invertido en el negocio que no está generando suficiente. Revisa si tienes maquinaria, vehículos o espacios que puedas vender o rentar para liberar capital.",
      "¿Tienes equipo parado que podrías rentar a otra empresa cuando no lo usas? Ese activo puede generar ingresos sin que lo vendas.",
      "Evalúa si vale la pena tener local propio o si es mejor rentar. A veces vender el local y renterlo libera capital que genera más en el negocio que la propiedad misma.",
      "Antes de comprar activos nuevos, pregunta si puedes arrendar (leasing). Conservas el efectivo y los pagos son deducibles.",
    ],
    texto_consultor: `ROIC<WACC. Evaluar si existen activos fijos subutilizados que puedan venderse o rentarse. Reducir Capital Invertido mejora el ROIC sin necesidad de aumentar NOPAT.`,
    texto_cliente: `Parte del dinero y equipo invertido en tu negocio no está generando suficiente rendimiento. Quizás hay activos que podrías vender o rentar.`
  },

  {
    id: "E08",
    pilar: "estructura",
    prioridad: "baja",
    nombre: "Evaluar Acceso a Fondos de Garantía NAFIN / INADEM",
    condicion: (m, i) => m.deuda_activos > 0.40 && i.ventas < 100000000,
    meta_valor: null,
    meta_metrica: null,
    impacto_eva: (m, i) => {
      return i.deuda_total * 0.02 * (1 - i.tasa_impuesto); // Reducción de tasa ~2pp
    },
    estrategias: [
      "NAFIN tiene programas específicos para PyMEs con tasas mucho más bajas que la banca comercial. Busca en su página o pide que tu consultor te asesore para aplicar.",
      "Si eres proveedor de una empresa grande, pregunta si tienen programa de Cadenas Productivas con NAFIN. Te permite cobrar tus facturas anticipado a tasa baja.",
      "Bancomext apoya a negocios que exportan o que son proveedores de exportadores. Si tu cliente vende al extranjero, probablemente calificas.",
      "Los fondos de garantía del gobierno (FIRA para agro, FONDO PyME) reducen el riesgo para el banco y te dan acceso a crédito que de otra forma no tendrías.",
    ],
    texto_consultor: `PyME con apalancamiento medio-alto. Explorar programas NAFIN (crédito garantizado), Cadenas Productivas, o FIRA para sectores agro/manufactura. Reducen el Kd efectivo 2-4 pp.`,
    texto_cliente: `Existen programas del gobierno que te pueden prestar dinero más barato. Vale la pena explorarlos con tu contador.`
  },

  {
    id: "E09",
    pilar: "estructura",
    prioridad: "media",
    nombre: "Incrementar Capital Contable: Utilidades Retenidas vs. Retiro de Dividendos",
    condicion: (m, i) => m.roic < m.wacc && i.utilidades_retenidas < i.capital_social,
    meta_valor: null,
    meta_metrica: "deuda_patrimonio",
    impacto_eva: (m, i) => {
      const capital_adicional = i.capital_social * 0.20;
      return capital_adicional * (m.roic - m.wacc) * -1; // Mejora spread si ROIC crece
    },
    estrategias: [
      "Deja de repartir toda la utilidad al final del año. Guarda al menos el 30% dentro del negocio. Con el tiempo, ese capital propio acumulado hace al negocio más sólido y más fácil de financiar.",
      "El dinero que queda en el negocio (utilidades retenidas) es el capital más barato que existe: no cobra intereses ni pide dividendos. Aprovéchalo.",
      "Define con los socios una política clara: qué porcentaje de utilidades se queda en el negocio y qué porcentaje se distribuye. Y cúmplela todos los años.",
      "Un negocio con más capital propio que deuda accede a mejores créditos, mejores proveedores y mejores condiciones en general. Vale la pena el esfuerzo.",
    ],
    texto_consultor: `Bajo nivel de utilidades retenidas vs capital social. Si la empresa mejora su ROIC, retener más utilidades en lugar de distribuirlas acelerará la creación de valor.`,
    texto_cliente: `Reinvertir más ganancias en el negocio, en lugar de retirarlas, puede ayudarlo a crecer más sano.`
  },

  {
    id: "E10",
    pilar: "estructura",
    prioridad: "baja",
    nombre: "Blindaje de Estructura: Mantener Deuda/Activos en Verde",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.deuda_activos <= b.metricas.deuda_activos.v;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.deuda_activos.v || m.deuda_activos,
    meta_metrica: "deuda_activos",
    impacto_eva: (m, i) => 0,
    estrategias: [
      "Tu nivel de deuda está bien. La tarea ahora es mantenerlo así cuando el negocio crezca, porque la tentación de endeudarse para crecer más rápido es grande.",
      "Establece una regla: la deuda total del negocio nunca debe superar el X% del valor de los activos. Pon ese porcentaje y respétalo.",
      "Cuando necesites financiamiento para crecer, busca primero capital propio (reinvertir utilidades o aportaciones de socios) antes de ir al banco.",
      "Revisa tu estructura de deuda una vez al año con tu contador. Los negocios que mantienen buen control de deuda tienen mejores opciones cuando de verdad las necesitan.",
    ],
    texto_consultor: `Estructura de capital en zona Verde. Meta de Blindaje: no superar el límite Verde en el próximo ciclo de crecimiento. Establecer política de endeudamiento máximo.`,
    texto_cliente: `Tu nivel de deuda es adecuado. La meta es mantenerlo así aunque el negocio crezca.`
  },

  {
    id: "E11",
    pilar: "estructura",
    prioridad: "alta",
    nombre: "Eliminar Atrasos SAT: Regularizar Situación Fiscal",
    condicion: (m, i) => i.atrasos_sat === true,
    meta_valor: 0,
    meta_metrica: null,
    impacto_eva: (m, i) => {
      const multas_estimadas = (i.impuestos_anuales || 0) * 0.20;
      return multas_estimadas * (1 - i.tasa_impuesto);
    },
    estrategias: [
      "Las deudas con el SAT son las más peligrosas: generan recargos del 17% anual y pueden bloquearte en el sistema bancario. Regularízate lo antes posible.",
      "El SAT tiene programas de facilidades de pago. Entra a sat.gob.mx o llama al SAT para preguntar sobre convenios de pago a plazos. No tienes que pagar todo de golpe.",
      "Mientras tengas deuda con el SAT, no puedes obtener la constancia de situación fiscal limpia que necesitas para muchos créditos y contratos con grandes empresas.",
      "Contrata a un contador que te ayude a negociar con el SAT si la deuda es grande. A veces con una condonación parcial y un plan de pagos se resuelve el problema.",
    ],
    texto_consultor: `La empresa tiene atrasos con el SAT. Esto genera recargos de 1.47% mensual, bloquea acceso a crédito formal y expone a auditorías. Regularización urgente vía 'Facilidades de Pago' SAT.`,
    texto_cliente: `Debes dinero al SAT. Eso genera intereses cada mes y puede bloquearte en bancos.`
  },

  {
    id: "E12",
    pilar: "estructura",
    prioridad: "media",
    nombre: "Construir Historial Crediticio Formal para Reducir Prima PyME",
    condicion: (m, i) => i.es_micro === true || i.es_informal === true,
    meta_valor: null,
    meta_metrica: "wacc",
    impacto_eva: (m, i) => {
      const reduccion_prima = 0.01; // Reducción de 1% en prima PyME
      return reduccion_prima * i.capital_invertido;
    },
    estrategias: [
      "Un negocio sin historial crediticio paga tasas de castigo porque el banco no sabe si eres buen pagador. Empieza a construir ese historial aunque sea con un crédito pequeño.",
      "Pide una tarjeta de crédito empresarial con límite bajo, úsala para gastos del negocio y págala completa cada mes. En 6 meses tienes historial positivo.",
      "Registra el negocio en el Buró de Crédito como empresa. Muchas PyMEs no lo hacen y por eso el banco solo puede evaluar al dueño persona física, no al negocio.",
      "La formalidad da acceso a crédito barato: declaraciones al corriente, facturas electrónicas, estados financieros ordenados. Cada paso de formalización reduce lo que pagas por financiarte.",
    ],
    texto_consultor: `Empresa micro o informal con alta prima de riesgo (5%). Formalización progresiva, historial en Buró de Crédito Empresarial y estados financieros auditados pueden reducir la prima de riesgo y el WACC.`,
    texto_cliente: `Al formalizar tu negocio y construir historial crediticio, podrás pedir prestado más barato en el futuro.`
  },

  /* ════════════════ CRUZADAS ════════════════════════════════════════════ */

  {
    id: "C01",
    pilar: "cruzada",
    prioridad: "alta",
    nombre: "Estrategia Integral de Creación de Valor: ROIC > WACC en 12 Meses",
    condicion: (m, i, sid) => m.roic < m.wacc && m.margen_ebitda >= 0,
    meta_valor_fn: (m) => m.wacc + 0.02,
    meta_metrica: "roic",
    impacto_eva: (m, i, sid) => {
      const objetivo_roic = m.wacc + 0.02;
      return (objetivo_roic - m.roic) * i.capital_invertido;
    },
    estrategias: [
      "Para que el negocio empiece a crear valor real necesitas trabajar en tres cosas al mismo tiempo: vender con mejor margen, cobrar más rápido y reducir deuda. No hay atajo.",
      "Establece 3 metas concretas para los próximos 90 días: una de ventas, una de cobros y una de costos. Ponlas en papel y revísalas cada semana.",
      "Comparte estas metas con tu equipo. Los negocios que mejoran más rápido son los que involucran a toda la gente en entender hacia dónde va el barco.",
      "Mide el avance mensualmente. Si en 3 meses no hay mejora visible, es momento de buscar ayuda externa. El tiempo también vale dinero.",
    ],
    texto_consultor: `Plan integral: simultáneamente mejorar Margen Bruto (+2pp), reducir CCC (liberando KTNO), y revisar Activos Fijos improductivos. Las tres palancas en paralelo crean el efecto multiplicador necesario para cruzar el umbral ROIC=WACC.`,
    texto_cliente: `Para que tu negocio empiece a crear valor de verdad, hay que trabajar en tres frentes al mismo tiempo: ganar más, cobrar más rápido y usar mejor los recursos.`
  },

  {
    id: "C02",
    pilar: "cruzada",
    prioridad: "alta",
    nombre: "Normalización Completa: PyME Informal hacia Formalización",
    condicion: (m, i) => i.es_informal === true && i.es_micro === true,
    meta_valor: null,
    meta_metrica: null,
    impacto_eva: (m, i) => {
      const acceso_credito = i.ventas * 0.10 * 0.05; // Crédito formal 10% ventas a tasa 5% menos
      return acceso_credito;
    },
    estrategias: [
      "Formalizar el negocio paso a paso te abre puertas: mejor crédito, clientes más grandes, menos riesgo legal. Empieza por lo básico: RFC, cuenta empresarial y facturas.",
      "Abre una cuenta bancaria a nombre del negocio (no a nombre del dueño). Ese es el primer paso de la formalización y es gratuito.",
      "Emite facturas por todas tus ventas, aunque el cliente no te las pida. Eso construye tu historial de ingresos que el banco va a pedir cuando quieras un crédito.",
      "Inscríbete al IMSS aunque sea con un empleado. Tener trabajadores registrados es señal de formalidad y abre puertas a programas de apoyo gubernamental.",
    ],
    texto_consultor: `Hoja de ruta de formalización: RFC activo, IMSS regularizado, estados financieros anuales, cuenta bancaria empresarial separada, RFC facturación electrónica. Cada paso amplía el acceso a crédito y reduce el Kd.`,
    texto_cliente: `Formalizar tu negocio paso a paso te abre puertas: más crédito, menos impuestos inesperados, mejor imagen ante clientes grandes.`
  },

  {
    id: "C03",
    pilar: "cruzada",
    prioridad: "media",
    nombre: "Palanca de Precios: Incremento Selectivo sin Perder Volumen",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.margen_bruto < b.metricas.margen_bruto.v && m.roic < m.wacc;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.margen_bruto.v || m.margen_bruto,
    meta_metrica: "margen_bruto",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.margen_bruto.v || m.margen_bruto;
      const incremento_precio = (bv - m.margen_bruto) * i.ventas;
      return incremento_precio * 0.7 * (1 - i.tasa_impuesto); // Asume 30% elasticidad
    },
    estrategias: [
      "Sube el precio de tus productos o servicios que más se venden y que los clientes más necesitan. La gente acepta subidas de precio cuando el producto vale la pena.",
      "No subas todos los precios de golpe. Empieza con el 10% en los productos estrella y mide cuántos clientes realmente se van. Suelen ser muchos menos de los que imaginas.",
      "Agrega valor antes de subir precio: entrega más rápido, da garantía más larga, mejora el servicio. Eso justifica el aumento ante el cliente.",
      "Diferénciate de la competencia en algo concreto. Si todos cobran lo mismo, el que sube precio sin diferenciarse pierde clientes. Pero el que se diferencia puede cobrar más.",
    ],
    texto_consultor: `La presión en márgenes combinada con ROIC<WACC requiere revisión de política de precios. Incremento selectivo en SKUs de mayor demanda inelástica puede recuperar 2-3 pp de Margen Bruto sin impacto en volumen.`,
    texto_cliente: `Subir precio en los productos que más vendes y que tus clientes más necesitan puede mejorar mucho tus ganancias sin perder ventas.`
  },

  {
    id: "C04",
    pilar: "cruzada",
    prioridad: "media",
    nombre: "Reducir Capital de Trabajo Neto Operativo (KTNO): Ciclo Virtuoso",
    condicion: (m, i) => m.ktno > i.ventas * 0.20 && m.ccc > 30,
    meta_valor_fn: (m, i) => i.ventas * 0.15,
    meta_metrica: "ktno",
    impacto_eva: (m, i) => {
      const reduccion_ktno = m.ktno - (i.ventas * 0.15);
      return Math.max(0, reduccion_ktno * m.wacc);
    },
    estrategias: [
      "El dinero atrapado en el ciclo del negocio (lo que te deben, lo que tienes en bodega, menos lo que debes a proveedores) es capital que no trabaja para ti.",
      "Cada 10 días que reduces en cobros o inventario libera capital equivalente a 10 días de ventas. Eso es mucho dinero sin pedir prestado ni meter capital.",
      "Ponte una meta sencilla: reducir el tiempo entre que compras y que cobras. Si hoy tarda 60 días, intenta llegar a 45 en los próximos 3 meses.",
      "El capital de trabajo liberado se puede usar para crecer, para pagar deuda o simplemente para tener más tranquilidad. Las tres opciones son buenas.",
    ],
    texto_consultor: `KTNO representa >20% de ventas con CCC elevado. Reducir KTNO 5pp de ventas libera capital con costo igual al WACC. Plan: cobrar 10 días antes, pagar 10 días después, reducir inventario 15%.`,
    texto_cliente: `Tienes demasiado dinero atrapado en el ciclo operativo del negocio. Liberarlo es como conseguir financiamiento gratis.`
  },

  {
    id: "C05",
    pilar: "cruzada",
    prioridad: "baja",
    nombre: "Diagnóstico de Autoempleo vs Empresa: Decisión Estratégica",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && b.sueldo_imputado_obligatorio && i.sueldo_imputado > 0 && m.margen_operativo < 0;
    },
    meta_valor: null,
    meta_metrica: "margen_operativo",
    impacto_eva: (m, i) => 0,
    estrategias: [
      "Cuando el dueño se pone un sueldo justo y aun así el negocio no alcanza, la realidad es que el negocio no es rentable como empresa: es un autoempleo.",
      "Un autoempleo no es malo si eso buscabas. Pero si quieres una empresa que crezca y valga dinero, el modelo tiene que funcionar sin depender de que tú trabajes gratis.",
      "La solución es o crecer las ventas para que el negocio soporte sueldos formales, o reducir costos para que el margen aguante. No hay tercera opción.",
      "Considera la posibilidad de que el modelo de negocio actual ya no funciona y necesita reinventarse. A veces el problema no es el dueño sino el producto o el mercado.",
    ],
    texto_consultor: `Tras imputar el Sueldo Justo de Dirección, el Margen Operativo es negativo. El propietario no está construyendo una empresa: está comprando un autoempleo escasamente remunerado. La decisión estratégica es: escalar el negocio (contratar, sistematizar, vender más) o redefinir el modelo.`,
    texto_cliente: `Cuando consideramos lo que te deberías pagar por tu trabajo, el negocio no cubre ni eso. Tienes que decidir si vas a crecer el negocio o si hay un modelo diferente que funcione mejor.`
  },

  {
    id: "C06",
    pilar: "cruzada",
    prioridad: "baja",
    nombre: "Advertencia EBITDA vs NOPCAF: No Confundir Margen con Caja",
    condicion: (m, i) => i.capex > i.ebitda * 0.30 || BENCHMARKS[i.sector_id]?.advertencia_ebitda,
    meta_valor: null,
    meta_metrica: "nopcaf",
    impacto_eva: (m, i) => 0,
    estrategias: [
      "Lo que muestra el estado de resultados como ganancia no es lo que tienes en el banco. Siempre pide el flujo de caja real, que descuenta lo que invertiste en equipos y lo que cambió en inventario.",
      "Antes de endeudarte para crecer, calcula cuánto efectivo real genera el negocio después de pagar todo, incluyendo mantenimiento de equipos. Ese es tu límite seguro de pago.",
      "Si el EBITDA se ve bien pero el banco siempre está vacío, el problema suele estar en el inventario, en cuentas por cobrar altas o en mucha inversión en activos fijos.",
      "Pide a tu contador que te prepare un estado de flujo de efectivo cada mes, no solo el estado de resultados. Es el documento más honesto de tu negocio.",
    ],
    texto_consultor: `⚠️ ADVERTENCIA TÉCNICA: El EBITDA de este sector/empresa subestima materialmente el consumo de caja por CAPEX de mantenimiento. El NOPCAF (flujo real) es el indicador correcto de generación de efectivo. No basar decisiones de deuda en EBITDA.`,
    texto_cliente: `El número de ganancias que ves en tu estado de resultados no es el dinero que realmente queda disponible. Las inversiones en equipo e instalaciones lo reducen significativamente.`
  },

  {
    id: "C07",
    pilar: "cruzada",
    prioridad: "media",
    nombre: "Plan de 90 Días: Mejora Rápida de EVA por Reducción de KTNO",
    condicion: (m, i, sid) => {
      const b = BENCHMARKS[sid];
      return b && m.ccc > b.metricas.ccc.r && m.eva < 0;
    },
    meta_valor_fn: (m, i, sid) => BENCHMARKS[sid]?.metricas.ccc.v || 0,
    meta_metrica: "ccc",
    impacto_eva: (m, i, sid) => {
      const bv = BENCHMARKS[sid]?.metricas.ccc.v || m.ccc;
      const capital_liberado = (i.ventas / 365) * (m.ccc - bv);
      return capital_liberado * m.wacc * 0.75; // 75% alcanzable en 90 días
    },
    estrategias: [
      "En 90 días puedes mejorar significativamente tu situación financiera solo con disciplina en cobros y pagos, sin meter un peso extra.",
      "Mes 1: llama a todos los clientes que te deben y cobra todo lo que puedas. Meta: cobrar al menos el 70% de tu cartera vencida.",
      "Mes 2: negocia 15 días más de plazo con tus 3 proveedores más grandes. No con todos, empieza con los más importantes.",
      "Mes 3: mide el resultado. Si el ciclo de efectivo mejoró 15 días o más, ya liberaste capital equivalente a medio mes de ventas. Ahora mantén la disciplina.",
    ],
    texto_consultor: `EVA negativo + CCC en Rojo = oportunidad de mejora rápida. Plan de 90 días: cobrar 15 días antes, liquidar inventario slow-movers, negociar 15 días adicionales con 2 proveedores clave. Impacto en EVA: visible en el primer trimestre.`,
    texto_cliente: `En 90 días podemos mejorar significativamente el valor de tu negocio solo con disciplina en cobros y pagos, sin invertir un solo peso.`
  },

]; // fin CATALOGO_METAS


/* ================================================================
   §5 — FUNCIONES DE NORMALIZACIÓN
   ================================================================ */

/**
 * Aplica ajustes de normalización para PyMEs informales.
 * Modifica los inputs antes del cálculo.
 */
function normalizarInputs(inputs) {
  const n = { ...inputs };

  if (!n.es_informal) return n;

  // Reconstrucción de EBITDA real (§8.1)
  n.ebitda_ajustado = (n.ebitda || 0)
    + (n.retiros_propietario || 0)
    + (n.gastos_personales_empresa || 0)
    + (n.ventas_no_facturadas || 0) * (n.margen_bruto_pct || 0.25);

  // Ajuste de ventas por facturación oculta
  n.ventas_ajustadas = n.ventas + (n.ventas_no_facturadas || 0);

  // Deuda Sombra (§8.4)
  n.deuda_total_ajustada = (n.deuda_total || 0) + (n.deuda_sombra || 0);
  n.kd_efectivo = calcularKdEfectivo(n);

  return n;
}

/**
 * Calcula la tasa de interés efectiva ponderada de la deuda.
 */
function calcularKdEfectivo(inputs) {
  const deuda_formal  = inputs.deuda_formal  || 0;
  const deuda_fintech = inputs.deuda_fintech  || 0;
  const deuda_tarjeta = inputs.deuda_tarjeta  || 0;
  const deuda_agiotista = inputs.deuda_agiotista || 0;

  const total = deuda_formal + deuda_fintech + deuda_tarjeta + deuda_agiotista;
  if (total === 0) return MACRO.Kd_default;

  const ponderado =
    (deuda_formal    * 0.16) +
    (deuda_fintech   * 0.35) +
    (deuda_tarjeta   * 0.50) +
    (deuda_agiotista * 0.72);

  return ponderado / total;
}

/**
 * Aplica modulación de umbrales según estrato y formalidad.
 * Para micro-informal, los benchmarks se relajan.
 */
function modularBenchmarks(sector_id, inputs) {
  const base = JSON.parse(JSON.stringify(BENCHMARKS[sector_id]));
  if (!base) return base;

  if (inputs.es_informal) {
    // CCC Verde +30%
    if (base.metricas.ccc.v !== null) base.metricas.ccc.v *= 1.30;
    // DSO Verde -40% (más estricto para informales en efectivo)
    if (base.metricas.dso.v !== null) base.metricas.dso.v *= 0.60;
  }
  if (inputs.es_micro) {
    // Razón Corriente Verde mínima = 1.2
    if (base.metricas.razon_corriente.v < 1.2) base.metricas.razon_corriente.v = 1.2;
    if (base.metricas.razon_corriente.r > 1.0) base.metricas.razon_corriente.r = 1.0;
    // Deuda/Activos más laxo
    if (base.metricas.deuda_activos.r !== null) base.metricas.deuda_activos.r *= 0.85;
  }

  return base;
}


/* ================================================================
   §6 — FUNCIONES DE CÁLCULO FINANCIERO
   ================================================================ */

/**
 * Calcula el WACC real de la empresa.
 * Usa parámetros del sector y datos del balance.
 */
function calcularWACC(inputs, sector_id) {
  const sp  = WACC_PARAMS[sector_id] || WACC_PARAMS["06"];
  const t   = inputs.tasa_impuesto   || MACRO.t_ISR_PM;
  const Kd  = inputs.kd_efectivo     || inputs.Kd || MACRO.Kd_default;
  const prima = inputs.es_micro ? MACRO.primaPyME_micro : MACRO.primaPyME_formal;

  // Deuda y patrimonio del balance
  const D = (inputs.deuda_total_ajustada || inputs.deuda_total || 0);
  const E = (inputs.patrimonio || inputs.capital_contable || 1);
  const V = D + E;

  const DE_real = E > 0 ? D / E : sp.DE_optimo;

  // Beta apalancada real
  const beta_L_real = sp.beta_U * (1 + (1 - t) * DE_real);

  // Ke
  const Ke = MACRO.Rf + beta_L_real * MACRO.ERP + prima;

  // WACC
  const wacc_real = (E / V) * Ke + (D / V) * Kd * (1 - t);

  return {
    wacc:      isFinite(wacc_real) ? wacc_real : sp.WACC,
    ke:        Ke,
    kd:        Kd,
    beta_L:    beta_L_real,
    prima_pyme: prima,
    D, E, V
  };
}

/**
 * Función principal: calcula todas las métricas financieras.
 * Recibe el objeto inputs (del formulario) y el sector_id.
 * Devuelve el objeto metricas completo.
 */
function calcularMetricas(inputs, sector_id) {

  // ── Alias ──────────────────────────────────────────────────
  const ventas    = inputs.ventas            || 0;
  const cogs      = inputs.cogs              || 0;
  const da        = inputs.depreciacion_amortizacion || 0;
  const gastos_adm = inputs.gastos_administracion || 0;
  const gastos_vta = inputs.gastos_ventas    || 0;
  const ing_no_op  = inputs.ingresos_no_operativos || 0;
  const gto_no_op  = inputs.gastos_no_operativos   || 0;
  const intereses  = inputs.gastos_financieros      || 0;
  const t         = inputs.tasa_impuesto     || MACRO.t_ISR_PM;
  const capex     = inputs.capex             || 0;

  const cxc        = inputs.cuentas_por_cobrar  || 0;
  const inventarios = inputs.inventarios        || 0;
  const cxp        = inputs.cuentas_por_pagar   || 0;
  const caja       = inputs.caja_bancos          || 0;
  const act_fijos  = inputs.activos_fijos_netos  || 0;
  const act_corr   = caja + cxc + inventarios + (inputs.otros_activos_corrientes || 0);
  const act_nc     = act_fijos + (inputs.otros_activos_no_corrientes || 0);
  const activo_total = act_corr + act_nc;

  const deuda_cp   = inputs.deuda_financiera_cp  || 0;
  const deuda_lp   = inputs.deuda_financiera_lp  || 0;
  const deuda_total = (inputs.deuda_total_ajustada || (deuda_cp + deuda_lp));
  const pas_corr   = deuda_cp + cxp + (inputs.otros_pasivos_corrientes || 0);
  const patrimonio = inputs.patrimonio || (activo_total - (pas_corr + deuda_lp + (inputs.otros_pasivos_nc || 0)));

  const credito_pct = inputs.credito_pct
    || BENCHMARKS[sector_id]?.credito_pct_default
    || 0.50;

  const sueldo_imputado = inputs.sueldo_imputado || 0;

  // ── Estado de Resultados ─────────────────────────────────
  const utilidad_bruta    = ventas - cogs;
  const opex              = gastos_adm + gastos_vta;
  const ebit_sin_ajuste   = utilidad_bruta - opex - da + ing_no_op - gto_no_op;
  const ebit              = ebit_sin_ajuste - sueldo_imputado; // Ajuste sueldo imputado
  const ebitda            = ebit + da;
  const nopat             = ebit * (1 - t);
  const utilidad_neta     = ebit - intereses - (ebit - intereses) * t;

  // ── Capital Invertido ────────────────────────────────────
  const ktno             = cxc + inventarios - cxp;
  const capital_invertido = ktno + act_fijos;

  // ── WACC ─────────────────────────────────────────────────
  const wacc_result = calcularWACC(
    { ...inputs, deuda_total, patrimonio },
    sector_id
  );

  // ── Creación de Valor ────────────────────────────────────
  const roic  = capital_invertido > 0 ? nopat / capital_invertido : 0;
  const eva   = nopat - (capital_invertido * wacc_result.wacc);
  const spread = roic - wacc_result.wacc;

  // ── NOPCAF ───────────────────────────────────────────────
  // ΔKTNO requiere período anterior (si no disponible: 0)
  const delta_ktno = inputs.ktno_anterior ? ktno - inputs.ktno_anterior : 0;
  const nopcaf     = nopat + da - delta_ktno - capex;

  // ── Ciclo de Conversión de Efectivo ──────────────────────
  const ventas_credito = ventas * credito_pct;
  const dso = ventas_credito > 0 ? (cxc / ventas_credito) * 365 : 0;
  const doh = cogs > 0 ? (inventarios / cogs) * 365 : 0;
  const dpo = cogs > 0 ? (cxp / cogs) * 365 : 0;
  const ccc = dso + doh - dpo;
  const velocidad_efectivo = ccc > 0 ? 365 / ccc : null;

  // ── Liquidez ─────────────────────────────────────────────
  const razon_corriente = pas_corr > 0 ? act_corr / pas_corr : null;
  const prueba_acida    = pas_corr > 0 ? (act_corr - inventarios) / pas_corr : null;
  const dias_caja       = (opex + cogs) > 0 ? caja / ((opex + cogs) / 365) : null;

  // ── Estructura ───────────────────────────────────────────
  const deuda_neta          = deuda_total - caja;
  const deuda_activos       = activo_total > 0 ? deuda_total / activo_total : 0;
  const deuda_patrimonio    = patrimonio > 0 ? deuda_total / patrimonio : 0;
  const cobertura_intereses = intereses > 0 ? ebit / intereses : null;
  const deuda_neta_ebitda   = ebitda > 0 ? deuda_neta / ebitda : null;

  // ── Márgenes ─────────────────────────────────────────────
  const margen_bruto     = ventas > 0 ? utilidad_bruta / ventas : 0;
  const margen_ebitda    = ventas > 0 ? ebitda / ventas : 0;
  const margen_operativo = ventas > 0 ? ebit / ventas : 0;
  const margen_neto      = ventas > 0 ? utilidad_neta / ventas : 0;

  // ── Rentabilidad Patrimonial ─────────────────────────────
  const roe = patrimonio > 0 ? utilidad_neta / patrimonio : 0;
  const roa = activo_total > 0 ? utilidad_neta / activo_total : 0;

  // ── Punto de Equilibrio ──────────────────────────────────
  const costos_fijos = gastos_adm + gastos_vta + da + intereses;
  const margen_contribucion = ventas > 0 ? 1 - (cogs / ventas) : 0;
  const punto_equilibrio_pesos = margen_contribucion > 0
    ? costos_fijos / margen_contribucion : null;
  const punto_equilibrio_dias  = punto_equilibrio_pesos && ventas > 0
    ? punto_equilibrio_pesos / (ventas / 365) : null;

  // ── Z-Score Altman (versión revisada no cotizadas) ───────
  let z_score = null;
  if (activo_total > 0 && patrimonio > 0) {
    const capital_trabajo = act_corr - pas_corr;
    const X1 = capital_trabajo / activo_total;
    const X2 = (inputs.utilidades_retenidas || 0) / activo_total;
    const X3 = ebit / activo_total;
    const X4 = patrimonio / (deuda_total || 1);
    z_score  = 6.56 * X1 + 3.26 * X2 + 6.72 * X3 + 1.05 * X4;
  }

  // ── Zona Z-Score ─────────────────────────────────────────
  let z_zona = null;
  if (z_score !== null) {
    if      (z_score > 2.6) z_zona = "Segura";
    else if (z_score > 1.1) z_zona = "Gris";
    else                    z_zona = "Quiebra";
  }

  return {
    // Resultados intermedios
    utilidad_bruta, ebit, ebitda, nopat, utilidad_neta,
    ktno, capital_invertido,
    // WACC
    wacc: wacc_result.wacc,
    ke:   wacc_result.ke,
    kd:   wacc_result.kd,
    // Creación de valor
    roic, eva, spread, nopcaf,
    // CCC
    dso, doh, dpo, ccc, velocidad_efectivo,
    // Liquidez
    razon_corriente, prueba_acida, dias_caja,
    // Estructura
    deuda_neta, deuda_total,
    deuda_activos, deuda_patrimonio,
    cobertura_intereses, deuda_neta_ebitda,
    // Márgenes
    margen_bruto, margen_ebitda, margen_operativo, margen_neto,
    // Rentabilidad
    roe, roa,
    // Punto de equilibrio
    punto_equilibrio_pesos, punto_equilibrio_dias,
    // Z-Score
    z_score, z_zona,
    // Resumen balance
    activo_total, patrimonio, pas_corr,
    act_corr, act_fijos,
    // Ref
    sector_id,
    ventas, cogs, opex
  };
}


/* ================================================================
   §7 — FUNCIONES DE CLASIFICACIÓN V / A / R
   ================================================================ */

/**
 * Clasifica UNA métrica como "verde", "amarillo" o "rojo".
 * @param {number} valor - El valor calculado
 * @param {object} bench - { r, v, dir } del benchmark
 * @returns {"verde"|"amarillo"|"rojo"|"na"}
 */
function clasificarMetrica(valor, bench) {
  if (!bench || bench.dir === "na" || valor === null || valor === undefined) return "na";

  if (bench.dir === "mayor") {
    // Más es mejor
    if (valor >= bench.v) return "verde";
    if (valor >= bench.r) return "amarillo";
    return "rojo";
  } else {
    // Menos es mejor
    if (valor <= bench.v) return "verde";
    if (valor <= bench.r) return "amarillo";
    return "rojo";
  }
}

/**
 * Clasifica TODAS las métricas contra el benchmark del sector.
 * Devuelve un objeto { metrica: "verde"|"amarillo"|"rojo" }
 */
function clasificarTodasLasMetricas(metricas, sector_id, inputs) {
  const bench_mod = modularBenchmarks(sector_id, inputs);
  if (!bench_mod) return {};

  const bm = bench_mod.metricas;
  const m  = metricas;

  return {
    margen_bruto:        clasificarMetrica(m.margen_bruto,        bm.margen_bruto),
    margen_ebitda:       clasificarMetrica(m.margen_ebitda,       bm.margen_ebitda),
    margen_operativo:    clasificarMetrica(m.margen_operativo,    bm.margen_operativo),
    margen_neto:         clasificarMetrica(m.margen_neto,         bm.margen_neto),
    roic:                clasificarMetrica(m.roic,                bm.roic),
    ccc:                 clasificarMetrica(m.ccc,                 bm.ccc),
    dso:                 clasificarMetrica(m.dso,                 bm.dso),
    doh:                 clasificarMetrica(m.doh,                 bm.doh),
    dpo:                 clasificarMetrica(m.dpo,                 bm.dpo),
    razon_corriente:     clasificarMetrica(m.razon_corriente,     bm.razon_corriente),
    prueba_acida:        clasificarMetrica(m.prueba_acida,        bm.prueba_acida),
    deuda_activos:       clasificarMetrica(m.deuda_activos,       bm.deuda_activos),
    deuda_patrimonio:    clasificarMetrica(m.deuda_patrimonio,    bm.deuda_patrimonio),
    cobertura_intereses: clasificarMetrica(m.cobertura_intereses, bm.cobertura_intereses),
  };
}


/* ================================================================
   §9 — OVERRIDES UNIVERSALES
   ================================================================ */

/**
 * Verifica los 7 Overrides Universales.
 * Devuelve array de IDs de overrides activos.
 */
function verificarOverrides(metricas, inputs, sector_id) {
  const activos = [];

  for (const meta of CATALOGO_METAS) {
    if (!meta.id.startsWith("O")) continue;

    let activado = false;
    try {
      if (meta.id === "O2") {
        activado = meta.condicion(metricas, inputs, sector_id);
      } else if (meta.id === "O6") {
        // O6 es subconjunto de O4 — no duplicar en reporte
        activado = meta.condicion(metricas, inputs) && !activos.includes("O4");
      } else {
        activado = meta.condicion(metricas, inputs, sector_id);
      }
    } catch (e) {
      console.warn("Error en override", meta.id, e);
    }

    if (activado) activos.push(meta.id);
  }

  return activos;
}


/* ================================================================
   §10 — ACTIVACIÓN DE METAS
   ================================================================ */

/**
 * Activa las metas del catálogo según condiciones.
 * Devuelve array de metas activas con su impacto en EVA calculado.
 */
function activarMetas(metricas, inputs, sector_id) {
  const metas_activas = [];
  const overrides_activos = verificarOverrides(metricas, inputs, sector_id);

  for (const meta of CATALOGO_METAS) {
    if (meta.id.startsWith("O")) continue; // Los overrides ya se procesaron

    let activada = false;
    try {
      activada = meta.condicion(metricas, inputs, sector_id);
    } catch (e) {
      console.warn("Error en condición de meta", meta.id, e);
    }

    if (!activada) continue;

    // Calcular impacto en EVA
    let impacto_eva = 0;
    try {
      impacto_eva = meta.impacto_eva(metricas, inputs, sector_id) || 0;
    } catch (e) {
      console.warn("Error calculando impacto EVA en meta", meta.id, e);
    }

    // Calcular valor meta
    let valor_meta = meta.meta_valor;
    if (typeof meta.meta_valor_fn === "function") {
      try { valor_meta = meta.meta_valor_fn(metricas, inputs, sector_id); } catch {}
    }

    metas_activas.push({
      ...meta,
      impacto_eva_calculado: impacto_eva,
      valor_meta_calculado:  valor_meta,
      valor_actual: meta.meta_metrica ? metricas[meta.meta_metrica] : null
    });
  }

  // Ordenar por impacto EVA descendente dentro de cada pilar
  metas_activas.sort((a, b) => b.impacto_eva_calculado - a.impacto_eva_calculado);

  return metas_activas;
}

/**
 * Aplica reglas de exclusión entre metas (para evitar double-counting).
 */
function aplicarExclusiones(metas_activas, overrides_activos) {
  let resultado = [...metas_activas];

  // Si CCC integral activo (L10) → suprimir L02, L03, L04 del reporte ejecutivo
  if (resultado.some(m => m.id === "L10")) {
    resultado = resultado.map(m => ({
      ...m,
      excluir_reporte: m.excluir_reporte || ["L02", "L03", "L04"].includes(m.id)
    }));
  }

  // Si O1 activo → suprimir E10 y R10 del reporte ejecutivo
  if (overrides_activos.includes("O1")) {
    resultado = resultado.map(m => ({
      ...m,
      excluir_reporte: m.excluir_reporte || ["E10", "R10"].includes(m.id)
    }));
  }

  // Si R05 activo (MB en Rojo) → suprimir R10 (blindaje)
  if (resultado.some(m => m.id === "R05")) {
    resultado = resultado.map(m => ({
      ...m,
      excluir_reporte: m.excluir_reporte || m.id === "R10"
    }));
  }

  return resultado;
}

/**
 * Filtra las metas para el reporte ejecutivo (máx 10-11).
 */
function filtrarReporteEjecutivo(metas_activas, overrides_activos) {
  const reporte = [];

  // 1. Todos los overrides activos (prioridad máxima)
  for (const oid of overrides_activos) {
    const meta = CATALOGO_METAS.find(m => m.id === oid);
    if (meta) reporte.push({ ...meta, impacto_eva_calculado: 0, origen: "override" });
  }

  // 2. Top 3 Rentabilidad
  const rent = metas_activas
    .filter(m => m.pilar === "rentabilidad" && !m.excluir_reporte)
    .slice(0, 3);

  // 3. Top 3 Liquidez
  const liq  = metas_activas
    .filter(m => m.pilar === "liquidez" && !m.excluir_reporte)
    .slice(0, 3);

  // 4. Top 3 Estructura
  const est  = metas_activas
    .filter(m => m.pilar === "estructura" && !m.excluir_reporte)
    .slice(0, 3);

  // 5. Top 2 Cruzadas
  const cruz = metas_activas
    .filter(m => m.pilar === "cruzada" && !m.excluir_reporte)
    .slice(0, 2);

  return [...reporte, ...rent, ...liq, ...est, ...cruz].slice(0, 11);
}


/* ================================================================
   §11 — FODA PONDERADO Y SCORE GLOBAL
   ================================================================ */

/**
 * Calcula el Score Global 0-100.
 * Promedio ponderado de métricas normalizadas contra benchmark.
 */
function calcularScoreGlobal(metricas, clasificaciones) {
  const pesos = {
    margen_bruto:        10,
    margen_ebitda:       10,
    roic:                15,
    ccc:                 10,
    dso:                  8,
    doh:                  7,
    dpo:                  5,
    razon_corriente:      8,
    deuda_activos:        8,
    cobertura_intereses: 10,
    z_score_bonus:        9, // Calculado aparte
  };

  const valores_semaforo = { verde: 1.0, amarillo: 0.5, rojo: 0.0, na: null };

  let score_ponderado  = 0;
  let peso_total_usado = 0;

  for (const [metrica, peso] of Object.entries(pesos)) {
    if (metrica === "z_score_bonus") continue;
    const clase = clasificaciones[metrica];
    const val   = valores_semaforo[clase];
    if (val !== null && val !== undefined) {
      score_ponderado  += val * peso;
      peso_total_usado += peso;
    }
  }

  // Bonus Z-Score
  if (metricas.z_score !== null) {
    let z_val = 0;
    if      (metricas.z_zona === "Segura") z_val = 1.0;
    else if (metricas.z_zona === "Gris")   z_val = 0.5;
    score_ponderado  += z_val * pesos.z_score_bonus;
    peso_total_usado += pesos.z_score_bonus;
  }

  const score = peso_total_usado > 0
    ? Math.round((score_ponderado / peso_total_usado) * 100)
    : 0;

  return Math.min(100, Math.max(0, score));
}

/**
 * Determina el cuadrante FODA.
 */
function calcularFODA(metricas, clasificaciones, sector_id) {
  // Eje Interno: promedio de clasificaciones financieras (-1 a +1)
  const map = { verde: 1, amarillo: 0, rojo: -1, na: null };
  const valores = Object.values(clasificaciones).map(c => map[c]).filter(v => v !== null);
  const eje_interno = valores.length > 0
    ? valores.reduce((a, b) => a + b, 0) / valores.length
    : 0;

  // Eje Externo: heurístico sectorial simplificado
  // (en producción: se amplía con biblioteca de factores externos por sector)
  const factores_externos_positivos = {
    "07": 0.3,  // Alimentos: nearshoring, demanda inelástica
    "09": 0.4,  // Metalmecánica: nearshoring automotriz
    "16": 0.5,  // Salud: crecimiento +7.6%
    "20": 0.3,  // Talleres: parque vehicular envejeciendo
  };
  const eje_externo = factores_externos_positivos[sector_id] ?? 0.0;

  let cuadrante;
  if      (eje_interno >= 0 && eje_externo >= 0) cuadrante = "Ofensiva";
  else if (eje_interno >= 0 && eje_externo <  0) cuadrante = "Defensiva";
  else if (eje_interno <  0 && eje_externo >= 0) cuadrante = "Reingeniería";
  else                                            cuadrante = "Supervivencia";

  const preguntas_guia = {
    "Ofensiva":     "¿Cómo aprovechar el crecimiento del sector con la fortaleza financiera actual?",
    "Defensiva":    "¿Cómo proteger la posición financiera ante un entorno sectorial adverso?",
    "Reingeniería": "¿Cómo reestructurar las finanzas para aprovechar las oportunidades del sector?",
    "Supervivencia":"¿Qué cambios estructurales son necesarios para garantizar la viabilidad del negocio?"
  };

  return {
    eje_interno,
    eje_externo,
    cuadrante,
    pregunta_guia: preguntas_guia[cuadrante]
  };
}

/**
 * Calcula el EVA proyectado consolidado en cascada.
 * Suma el impacto de todas las metas del reporte ejecutivo
 * sin double-counting (orden de prioridad).
 */
function calcularEVACascada(eva_actual, metas_reporte) {
  let eva_acumulado = eva_actual;
  const cascada = [];

  for (const meta of metas_reporte) {
    const impacto = meta.impacto_eva_calculado || 0;
    eva_acumulado += impacto;
    cascada.push({
      meta_id:    meta.id,
      meta_nombre: meta.nombre,
      impacto_eva: impacto,
      eva_acumulado
    });
  }

  return { cascada, eva_proyectado: eva_acumulado };
}


/* ================================================================
   §8 — MOTOR DE DIAGNÓSTICO (FUNCIÓN PRINCIPAL)
   ================================================================
   Recibe: objeto inputs con todos los datos del formulario.
   Devuelve: objeto diagnostico completo listo para el Dashboard.
   ================================================================ */

/**
 * MOTOR PRINCIPAL
 * @param {object} inputs - Datos del formulario del módulo 1
 * @param {string} sector_id - ID de sector ("01" a "20")
 * @returns {object} diagnostico - Resultado completo
 */
function ejecutarDiagnostico(inputs, sector_id) {

  // ── Validaciones bloqueantes ─────────────────────────────
  const errores = validarInputs(inputs);
  if (errores.length > 0) {
    return { error: true, mensajes: errores };
  }

  // ── Paso 1: Normalización ────────────────────────────────
  const inputs_norm = normalizarInputs(inputs);

  // ── Paso 2: Clasificación (estrato) ──────────────────────
  const estrato = determinarEstrato(inputs_norm);
  inputs_norm.es_micro  = estrato.tipo === "micro";
  inputs_norm.es_formal = !inputs_norm.es_informal;

  // ── Paso 3: Calcular todas las métricas ──────────────────
  const metricas = calcularMetricas(inputs_norm, sector_id);

  // ── Paso 4: Clasificar cada métrica V/A/R ────────────────
  const clasificaciones = clasificarTodasLasMetricas(metricas, sector_id, inputs_norm);

  // ── Paso 5: Verificar Overrides ──────────────────────────
  const overrides_activos = verificarOverrides(metricas, inputs_norm, sector_id);

  // ── Paso 6: Activar metas del catálogo ───────────────────
  let metas_activas = activarMetas(metricas, inputs_norm, sector_id);

  // ── Paso 7: Aplicar exclusiones ──────────────────────────
  metas_activas = aplicarExclusiones(metas_activas, overrides_activos);

  // ── Paso 8: Filtrar reporte ejecutivo ────────────────────
  const metas_reporte = filtrarReporteEjecutivo(metas_activas, overrides_activos);

  // ── Paso 9: FODA Ponderado ───────────────────────────────
  const foda = calcularFODA(metricas, clasificaciones, sector_id);

  // ── Paso 10: Score Global ────────────────────────────────
  const score_global = calcularScoreGlobal(metricas, clasificaciones);

  // ── Paso 11: EVA en cascada ──────────────────────────────
  const cascada = calcularEVACascada(metricas.eva, metas_reporte);

  // ── Veredicto principal ──────────────────────────────────
  const crea_valor  = metricas.roic > metricas.wacc;
  const veredicto   = crea_valor ? "CREA VALOR" : "DESTRUYE VALOR";
  const sector_info = BENCHMARKS[sector_id] || {};

  // ── Semáforos por pilar ──────────────────────────────────
  const semaforo_rentabilidad = semaforo_pilar([
    clasificaciones.margen_bruto,
    clasificaciones.margen_ebitda,
    clasificaciones.roic
  ]);
  const semaforo_liquidez = semaforo_pilar([
    clasificaciones.ccc,
    clasificaciones.razon_corriente,
    clasificaciones.dso
  ]);
  const semaforo_estructura = semaforo_pilar([
    clasificaciones.deuda_activos,
    clasificaciones.cobertura_intereses,
    clasificaciones.deuda_patrimonio
  ]);

  // ── Construir resultado final ────────────────────────────
  return {
    error:   false,
    empresa: inputs.nombre_empresa || "Empresa sin nombre",
    sector:  sector_info.nombre   || `Sector ${sector_id}`,
    sector_id,
    estrato: estrato.etiqueta,
    periodo: inputs.periodo       || new Date().getFullYear(),
    veredicto,
    crea_valor,
    score_global,
    metricas,
    clasificaciones,
    overrides_activos,
    metas_activas,
    metas_reporte,
    foda,
    cascada_eva: cascada,
    semaforos: {
      rentabilidad: semaforo_rentabilidad,
      liquidez:     semaforo_liquidez,
      estructura:   semaforo_estructura,
    },
    benchmarks_sector: BENCHMARKS[sector_id],
    wacc_params:       WACC_PARAMS[sector_id],
    timestamp: new Date().toISOString(),
    // Textos de modo cliente
    texto_cliente: generarTextoCliente(score_global, crea_valor, estrato),
  };
}


/* ================================================================
   §12 — UTILIDADES DE SOPORTE
   ================================================================ */

/**
 * Valida los inputs antes del cálculo.
 * Devuelve array de mensajes de error (vacío = sin errores).
 */
function validarInputs(inputs) {
  const errores = [];

  if (!inputs.ventas || inputs.ventas <= 0)
    errores.push("❌ Las ventas netas no pueden ser cero o negativas.");

  if (!inputs.cogs && inputs.cogs !== 0)
    errores.push("❌ El Costo de Ventas (COGS) es obligatorio.");

  if (!inputs.tasa_impuesto || inputs.tasa_impuesto <= 0 || inputs.tasa_impuesto >= 1)
    errores.push("❌ La tasa de impuestos debe ser un porcentaje válido (ej: 0.30).");

  // Validación del balance: Activos = Pasivos + Patrimonio
  if (inputs.activo_total && inputs.pasivo_total && inputs.patrimonio) {
    const diferencia = Math.abs(inputs.activo_total - (inputs.pasivo_total + inputs.patrimonio));
    const tolerancia = inputs.activo_total * 0.005; // 0.5% de tolerancia
    if (diferencia > tolerancia) {
      errores.push(
        `❌ El balance no cuadra: Activos (${fmt(inputs.activo_total)}) ≠ ` +
        `Pasivos + Patrimonio (${fmt(inputs.pasivo_total + inputs.patrimonio)}). ` +
        `Diferencia: ${fmt(diferencia)}`
      );
    }
  }

  if (inputs.kd_efectivo && (inputs.kd_efectivo < 0 || inputs.kd_efectivo > 2))
    errores.push("❌ La tasa de interés de la deuda (Kd) no es válida.");

  return errores;
}

/**
 * Determina el estrato (micro, pequeña, mediana) según SE.
 */
function determinarEstrato(inputs) {
  const empleados = inputs.numero_empleados || 0;
  const ventas    = inputs.ventas           || 0;
  const sector    = inputs.sector_tipo      || "comercio"; // "comercio" | "industria" | "servicios"

  if (empleados <= 10 || ventas <= 4000000) {
    return { tipo: "micro",   etiqueta: "Microempresa (0-10 empleados)" };
  }

  const limite_pequena = sector === "comercio" ? 30 : 50;
  const limite_mediana  = sector === "comercio" ? 100 : 250;
  const ventas_pequena  = 100000000;
  const ventas_mediana  = 250000000;

  if (empleados <= limite_pequena || ventas <= ventas_pequena) {
    return { tipo: "pequeña", etiqueta: "Empresa Pequeña" };
  }
  if (empleados <= limite_mediana || ventas <= ventas_mediana) {
    return { tipo: "mediana", etiqueta: "Empresa Mediana" };
  }

  return { tipo: "grande", etiqueta: "Grande (fuera de rango PyME)" };
}

/**
 * Determina el semáforo de un pilar completo.
 * Lógica: si hay ROJO → Rojo; si hay AMARILLO → Amarillo; si todo Verde → Verde
 */
function semaforo_pilar(clasificaciones) {
  const validas = clasificaciones.filter(c => c && c !== "na");
  if (validas.includes("rojo"))     return "rojo";
  if (validas.includes("amarillo")) return "amarillo";
  if (validas.every(c => c === "verde")) return "verde";
  return "amarillo";
}

/**
 * Genera el texto en lenguaje simple para modo Cliente.
 */
function generarTextoCliente(score, crea_valor, estrato) {
  if (score >= 75) {
    return "Tu negocio está en buena forma financiera. Sigue el plan para mantenerte en la zona verde y crecer con solidez.";
  } else if (score >= 50) {
    return "Tu negocio tiene áreas sólidas, pero hay oportunidades importantes de mejora. Con las acciones correctas, puedes aumentar significativamente su valor.";
  } else if (score >= 25) {
    return "Tu negocio enfrenta varios retos financieros que requieren atención pronto. Las metas de este reporte son tu hoja de ruta para revertir la situación.";
  } else {
    return "Tu negocio está en una situación financiera crítica que requiere acción inmediata. Trabaja con tu consultor en las prioridades de este reporte.";
  }
}

/**
 * Formatea un número como moneda MXN.
 */
function fmt(numero, decimales = 0) {
  if (numero === null || numero === undefined || isNaN(numero)) return "N/A";
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(numero);
}

/**
 * Formatea un número como porcentaje.
 */
function fmtPct(numero, decimales = 1) {
  if (numero === null || numero === undefined || isNaN(numero)) return "N/A";
  return (numero * 100).toFixed(decimales) + "%";
}

/**
 * Formatea un número como multiplicador (ej: 1.5x).
 */
function fmtX(numero, decimales = 1) {
  if (numero === null || numero === undefined || isNaN(numero)) return "N/A";
  return numero.toFixed(decimales) + "×";
}

/**
 * Formatea días.
 */
function fmtDias(numero) {
  if (numero === null || numero === undefined || isNaN(numero)) return "N/A";
  return Math.round(numero) + " días";
}

/**
 * Obtiene el color HEX del semáforo.
 */
function colorSemaforo(clasificacion) {
  const colores = {
    verde:    "#22c55e",
    amarillo: "#f59e0b",
    rojo:     "#ef4444",
    na:       "#94a3b8"
  };
  return colores[clasificacion] || colores.na;
}

/**
 * Obtiene el emoji del semáforo.
 */
function emojiSemaforo(clasificacion) {
  const emojis = { verde: "🟢", amarillo: "🟡", rojo: "🔴", na: "⚪" };
  return emojis[clasificacion] || "⚪";
}

/**
 * Expone el motor al objeto global window para acceso desde index.html.
 */
window.MotorVBM = {
  // Función principal
  ejecutarDiagnostico,
  // Datos de referencia
  BENCHMARKS,
  WACC_PARAMS,
  CATALOGO_METAS,
  MACRO,
  // Utilidades de formato
  fmt, fmtPct, fmtX, fmtDias,
  colorSemaforo, emojiSemaforo,
  // Funciones intermedias (útiles para testing)
  calcularMetricas,
  calcularWACC,
  clasificarTodasLasMetricas,
  verificarOverrides,
  activarMetas,
  calcularScoreGlobal,
  calcularFODA,
};

console.log("✅ motor.js cargado | VBM Advisor | Benchmarks Abril 2026");
console.log("   📊 Sectores cargados:", Object.keys(BENCHMARKS).length);
console.log("   🎯 Metas en catálogo:", CATALOGO_METAS.length);
console.log("   🔧 Función principal: MotorVBM.ejecutarDiagnostico(inputs, sector_id)");