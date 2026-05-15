/**
 * ================================================================
 * Zenith GBV — Diccionario Central de Textos UI
 *
 * Objetivo: Centralizar todos los textos explicativos, tooltips,
 * leyendas y descripciones para que el equipo de negocio pueda
 * editarlos sin tocar el codigo de los componentes React.
 *
 * Estructura:
 *   - revisionExcel: Textos especificos de la pantalla RevisionExcel
 *     - tooltips: Explicaciones emergentes (hover) sobre cada campo
 *     - leyendas: Textos de contexto debajo de cada input
 *     - labels: Nombres visibles de los campos
 *     - placeholders: Textos placeholder de inputs
 *     - header: Textos del header de la pagina
 *     - cards: Textos de las cards de resumen (read-only)
 *     - macro: Textos del dialog de Parametros Macro
 * ================================================================ */

export const DICCIONARIO = {
  /* ─────────────────────────────────────────────────────────────
     REVISION EXCEL — Pantalla de revision de datos extraidos
     ───────────────────────────────────────────────────────────── */
  revisionExcel: {
    /* ── Header ─────────────────────────────────────────────── */
    header: {
      titulo: 'Revisar Datos del Excel',
      badgeExito: 'Extraido OK',
      botonMacro: 'Ver Parametros Macro',
      botonVolver: 'Volver',
      botonEjecutar: 'Ejecutar Diagnostico',
      estadoCalculando: 'Calculando...',
    },

    /* ── Cards de resumen (read-only) ───────────────────────── */
    cards: {
      negocio: {
        titulo: 'Negocio',
        fuente: 'Excel',
        labels: {
          empresa: 'Empresa',
          periodo: 'Periodo',
          sector: 'Sector',
          empleados: 'Empleados',
          ventasAprox: 'Ventas Aprox.',
          regimen: 'Regimen',
          'regimen_PM_30': 'Persona Moral (30%)',
          'regimen_RESICO_10': 'RESICO (1.0%)',
          'regimen_RESICO_11': 'RESICO (1.1%)',
          'regimen_RESICO_15': 'RESICO (1.5%)',
          'regimen_RESICO_20': 'RESICO (2.0%)',
          'regimen_RESICO_25': 'RESICO (2.5%)',
          'regimen_PFAE_OTRO': 'PFAE / Otro',
          moneda: 'Moneda',
          estrato: 'Estrato',
          estratoMicro: 'Microempresa',
          estratoPyME: 'PyME',
        },
      },
      estadoResultados: {
        titulo: 'Estado de Resultados',
        fuente: 'Excel',
        labels: {
          ventas: 'Ventas',
          costoVentas: 'Costo de Ventas',
          gastosAdm: 'Gastos de Administracion',
          gastosVta: 'Gastos de Venta',
          depreciacion: 'Depreciacion y Amortizacion',
          gastosFinancieros: 'Gastos Financieros',
          utilidadBruta: 'Utilidad Bruta Est.',
        },
      },
      balanceGeneral: {
        titulo: 'Balance General',
        fuente: 'Excel',
        labels: {
          cajaBancos: 'Caja y Bancos',
          cuentasCobrar: 'Cuentas por Cobrar',
          inventarios: 'Inventarios',
          activosFijos: 'Activos Fijos Netos',
          deudaCP: 'Deuda Corto Plazo',
          deudaLP: 'Deuda Largo Plazo',
          cuentasPagar: 'Cuentas por Pagar',
          patrimonio: 'Patrimonio',
        },
      },
    },

    /* ── Seccion: Configuracion del Negocio ─────────────────── */
    configNegocio: {
      tituloSeccion: 'Configuracion del Negocio',
      moneda: {
        label: 'Moneda',
        leyenda: 'Pre-calculado del Excel',
      },
      periodos: {
        label: 'Periodo de analisis',
        opcionPeriodo: 'periodo',
        opcionPeriodos: 'periodos',
        leyenda: 'Rango ajustable',
      },
      informal: {
        label: 'Empresa Informal',
        valorSi: 'Si — Ajustes aplicados',
        valorNo: 'No — Empresa formal',
        leyenda: 'No viene en el Excel — seleccion manual',
      },
    },

    /* ── Seccion: Deuda Sombra ──────────────────────────────── */
    deudaSombra: {
      tituloSeccion: 'Deuda Sombra',
      tooltipSeccion:
        'Deuda no registrada en estados financieros formales. Incluye fintechs, tarjetas de credito y prestamistas informales.',
      deudaFintech: {
        label: 'Deuda Fintech',
        tooltip:
          'Prestamos obtenidos mediante plataformas financieras digitales (Konfio, Credijusto, etc.). Usualmente tienen tasas del 20% al 60% anual.',
        leyenda: 'Plataformas digitales: Konfio, Credijusto, etc.',
      },
      deudaTarjeta: {
        label: 'Deuda Tarjeta de Credito',
        tooltip:
          'Saldo pendiente de tarjetas de credito empresariales o personales utilizadas para operar el negocio. Tasas tipicas del 36% al 70% anual.',
        leyenda: 'Tarjetas empresariales o personales para operar',
      },
      deudaAgiotista: {
        label: 'Deuda con Prestamistas',
        tooltip:
          'Prestamos informales o de prestamistas particulares. Usualmente conllevan el costo de capital mas alto del mercado, frecuentemente por encima del 100% anual.',
        leyenda: 'Prestamos informales — usualmente el costo mas alto',
      },
      badgeTotal: 'Deuda sombra total',
    },

    /* ── Seccion: Parametros del Costo de Capital ───────────── */
    parametrosWACC: {
      tituloSeccion: 'Parametros del Costo de Capital',
      ventasCredito: {
        label: 'Ventas a Credito (%)',
        tooltip:
          'Porcentaje de ventas que se realizan a credito. Afecta los dias de cobro y el ciclo de efectivo.',
        leyendaSugerido: 'Sugerido por sector',
        leyendaRango: 'Rango ajustable: 0% - 100%',
      },
      tasaInteres: {
        label: 'Tasa de Interes de la Deuda (%)',
        tooltip:
          'Tasa de interes promedio que paga la empresa por su deuda financiera. Incluye bancos, fintechs y otros prestamos.',
        leyenda: 'Valor de referencia: Rango tipico PyME en Mexico 14% - 36%',
      },
      primaPyME: {
        label: 'Prima de Riesgo PyME (%)',
        tooltip:
          'Prima de riesgo adicional por ser una empresa pequena con menor liquidez y mayor volatilidad que una empresa grande.',
        leyenda: 'Rango ajustable entre 1% y 8%',
      },
    },

    /* ── Seccion: Dias del Ciclo de Efectivo ────────────────── */
    diasCiclo: {
      tituloSeccion: 'Dias del Ciclo de Efectivo (Opcional)',
      diasCobro: {
        label: 'Dias de Cobro',
        tooltip:
          'Dias promedio que tarda la empresa en cobrar a sus clientes. Se calcula como: Cuentas por Cobrar / Ventas x 360 (Año Comercial).',
        placeholderAuto: 'Calculado',
        leyendaCalculado: 'Calculado del Excel',
        formula: '(Cuentas por Cobrar / Ventas x 360)',
        leyendaManual: 'Ingresa dias manualmente o deja en calculado',
      },
      diasInventario: {
        label: 'Dias de Inventario',
        tooltip:
          'Dias promedio que el inventario permanece en almacen antes de venderse. Se calcula como: Inventarios / Costo de Ventas x 360.',
        placeholderAuto: 'Calculado',
        leyendaCalculado: 'Calculado del Excel',
        formula: '(Inventarios / Costo de Ventas x 360)',
        leyendaManual: 'Ingresa dias manualmente o deja en calculado',
      },
      diasPago: {
        label: 'Dias de Pago',
        tooltip:
          'Dias promedio que tarda la empresa en pagar a sus proveedores. Se calcula como: Cuentas por Pagar / Costo de Ventas x 360.',
        placeholderAuto: 'Calculado',
        leyendaCalculado: 'Calculado del Excel',
        formula: '(Cuentas por Pagar / Costo de Ventas x 360)',
        leyendaManual: 'Ingresa dias manualmente o deja en calculado',
      },
    },

    /* ── Dialog: Parametros Macro ─────────────────────────────
       Llaves exactas de window.MotorVBM.MACRO (motor.js §1):
       Rf, ERP, CRP, inflacion_INPC, t_ISR_PM, t_RESICO,
       Kd_default, primaPyME_formal, primaPyME_micro,
       TIIE_28, CETES_28, tipo_cambio_USD_MXN, fecha_corte
       ────────────────────────────────────────────────────────── */
    macro: {
      tituloDialog: 'Parametros Macroeconomicos',
      descripcionDialog:
        'Estos valores son centralizados y actualizados por Zenith GBV en base a las condiciones del mercado actual. Se recalibran trimestralmente.',
      fuente: 'Fuente: Banxico, Damodaran Online (ene-2026), INEGI (mar-2026)',
      errorCarga: 'No se pudieron cargar los parametros macro.',
      fechaCorte: 'Fecha de corte',
      /* — Valores con tooltip explicativo — */
      parametros: {
        Rf: {
          label: 'Tasa Libre de Riesgo',
          tooltip:
            'Rendimiento del bono del gobierno mexicano a 10 anos (Bono M). Representa la tasa minima que un inversionista espera ganar sin asumir riesgo en Mexico. Base para calcular el costo de capital.',
          formato: 'pct2' as const,
        },
        ERP: {
          label: 'Prima de Riesgo de Mercado',
          tooltip:
            'Equity Risk Premium (ERP) de Mexico: rendimiento adicional que exige el mercado por invertir en acciones mexicanas vs. bonos gubernamentales. Incluye el Country Risk Premium (CRP).',
          formato: 'pct2' as const,
        },
        CRP: {
          label: 'Prima de Riesgo Pais',
          tooltip:
            'Country Risk Premium especifico de Mexico segun Damodaran (ene-2026). Refleja el riesgo adicional por invertir en Mexico vs. un pais desarrollado como Estados Unidos.',
          formato: 'pct2' as const,
        },
        inflacion_INPC: {
          label: 'Inflacion Esperada (INPC)',
          tooltip:
            'Inflacion anual esperada medida por el INPC (Indice Nacional de Precios al Consumidor). Se utiliza para ajustar las tasas nominales a reales y proyectar el crecimiento del costo de capital.',
          formato: 'pct2' as const,
        },
        t_ISR_PM: {
          label: 'ISR Personas Morales',
          tooltip:
            'Tasa de Impuesto Sobre la Renta para sociedades (Personas Morales) en Mexico. El regimen general es del 30% sobre la utilidad fiscal. Se aplica a empresas formales con regimen general.',
          formato: 'pct1' as const,
        },
        t_RESICO: {
          label: 'ISR RESICO',
          tooltip:
            'Tasa efectiva aproximada del Regimen Simplificado de Confianza (RESICO) para personas morales con ingresos hasta $3.5M anuales. Varia entre 20% y 30% segun el nivel de ingresos.',
          formato: 'pct1' as const,
        },
        Kd_default: {
          label: 'Tasa Default de Deuda PyME',
          tooltip:
            'Tasa de interes promedio que pagan las PyMEs mexicanas por su deuda bancaria. Sirve como punto de referencia cuando el usuario no conoce la tasa exacta que paga su empresa.',
          formato: 'pct2' as const,
        },
        primaPyME_formal: {
          label: 'Size Premium PyME Formal',
          tooltip:
            'Prima adicional por riesgo de tamano para pequenas y medianas empresas formales (mas de 10 empleados). Compensa la menor liquidez, acceso limitado a credito y mayor volatilidad.',
          formato: 'pct2' as const,
        },
        primaPyME_micro: {
          label: 'Size Premium Microempresa',
          tooltip:
            'Prima adicional por riesgo de tamano para microempresas (10 o menos empleados) o empresas informales. Mayor que la de PyME formal por el riesgo adicional de informalidad.',
          formato: 'pct2' as const,
        },
        TIIE_28: {
          label: 'TIIE 28 dias',
          tooltip:
            'Tasa Interbancaria de Equilibrio a 28 dias. Es la tasa de referencia para prestamos bancarios en Mexico. Publicada diariamente por Banxico.',
          formato: 'pct2' as const,
        },
        CETES_28: {
          label: 'CETES 28 dias',
          tooltip:
            'Rendimiento de los Certificados de la Tesoreria a 28 dias. Instrumento de deuda gubernamental de corto plazo. Referencia para la tasa libre de riesgo en el corto plazo.',
          formato: 'pct2' as const,
        },
        tipo_cambio_USD_MXN: {
          label: 'Tipo de Cambio USD/MXN',
          tooltip:
            'Tipo de cambio peso mexicano por dolar estadounidense. Se usa para convertir estados financieros en USD a pesos mexicanos cuando la empresa opera en dolares.',
          formato: 'num' as const,
        },
        fecha_corte: {
          label: 'Fecha de Corte',
          tooltip:
            'Fecha a la que corresponden los parametros macroeconomicos. Zenith GBV recalibra estos valores trimestralmente.',
          formato: 'text' as const,
        },
      },
    },

    /* ── Labels genericos ───────────────────────────────────── */
    genericos: {
      opcional: '(opcional)',
      noDisponible: '—',
      placeholderCalculado: 'Calculado',
    },
  },

  /* ─────────────────────────────────────────────────────────────
     INGESTA — Pantalla de dropzone / dual flow
     ───────────────────────────────────────────────────────────── */
  ingesta: {
    titulo: 'Nuevo Analisis',
    subtitulo:
      'Sube tu Machote de Excel con los datos de la empresa, o llena los datos manualmente paso a paso.',
    dropzone: {
      dragActivo: 'Suelta el archivo aqui',
      dragInactivo: 'Arrastra tu Machote de Excel',
      subtexto: 'o haz clic para seleccionarlo',
      formato: '.xlsx',
      tamanoMax: 'Max. 10 MB',
    },
    botonManual: 'Llenar datos manualmente',
    tip: {
      titulo: 'Consejo:',
      texto:
        'Si tienes el Excel del cliente, la ruta mas rapida es arrastrarlo aqui. El sistema extrae automaticamente los datos de balance y estado de resultados.',
    },
    errorFormato: 'Formato incorrecto: el archivo debe ser .xlsx',
    errorHojaFaltante:
      'Hoja no encontrada. Asegurate de usar el Machote oficial de Zenith GBV.',
    errorCampoObligatorio:
      'Campo obligatorio vacio. Verifica que la Hoja correspondiente este completamente llena.',
    errorBalance: 'El balance general no cuadra. Revisa que Activos = Pasivos + Patrimonio.',
    errorGenerico: 'Error al procesar el archivo. Intenta de nuevo.',
    placeholderManual: {
      titulo: 'Ingreso Manual',
      descripcion:
        'El wizard de 5 pasos estara disponible en la proxima fase. Por ahora, sube un Excel para probar el flujo completo.',
      botonVolver: 'Volver al inicio',
    },
  },

  /* ─────────────────────────────────────────────────────────────
     SIDEBAR / NAVEGACION
     ───────────────────────────────────────────────────────────── */
  sidebar: {
    seccionPlataforma: 'Plataforma',
    seccionAnalisis: 'Analisis Activo',
    nav: {
      dashboard: 'Dashboard',
      ingesta: 'Nuevo Analisis',
      reportes: 'Reportes',
    },
    tabs: {
      resumen: 'Resumen',
      metricasValor: 'Metricas de Valor',
      estadoResultados: 'Estado de Resultados',
      balance: 'Balance',
    },
    colapsar: 'Colapsar',
  },

  /* ─────────────────────────────────────────────────────────────
     WIZARD MANUAL — Wizard de 5 pasos para ingreso manual
     ───────────────────────────────────────────────────────────── */
  wizard: {
    /* ── Header / Navegacion ────────────────────────────────── */
    header: {
      titulo: 'Ingreso Manual de Datos',
      subtitulo: 'Completa los 5 pasos para capturar toda la informacion financiera de la empresa.',
      pasoActual: 'Paso',
      de: 'de',
      botonAnterior: 'Anterior',
      botonSiguiente: 'Siguiente',
      botonFinalizar: 'Ejecutar Diagnostico',
      botonGuardarBorrador: 'Guardar borrador',
      estadoValidando: 'Validando...',
      confirmacionSalir: 'Si sales ahora perderas los datos ingresados.',
    },

    /* ── Paso 1: Datos del Negocio ──────────────────────────── */
    paso1Negocio: {
      titulo: 'Datos del Negocio',
      subtitulo: 'Informacion general de la empresa y su operacion.',
      campos: {
        nombreEmpresa: {
          label: 'Nombre de la Empresa',
          placeholder: 'Ej. Comercializadora del Norte S.A. de C.V.',
          tooltip: 'Nombre legal o comercial de la empresa. Se usara en todos los reportes generados.',
          leyenda: 'Nombre tal como aparece en el RFC o contratos.',
        },
        periodo: {
          label: 'Periodo a Analizar',
          tooltip: 'Anio fiscal que se evaluara. Usa el anio calendario o el ultimo anio fiscal cerrado.',
          leyenda: 'Anio fiscal en curso o ultimo cerrado.',
        },
        sector: {
          label: 'Sector',
          tooltip: 'Selecciona el sector economico mas cercano a la actividad principal de la empresa. Los benchmarks de comparacion dependen de esta seleccion.',
          leyenda: 'Determina los benchmarks de comparacion.',
        },
        empleados: {
          label: 'Numero de Empleados',
          tooltip: 'Total de personas que reciben salario o nomina de la empresa, incluyendo al propietario si recibe sueldo.',
          leyenda: 'Incluye al propietario si recibe nomina.',
        },
        ventasAprox: {
          label: 'Ventas Anuales Aproximadas',
          tooltip: 'Ingresos totales anuales de la empresa por sus actividades principales. No incluye ingresos financieros ni ventas de activos.',
          leyenda: 'Ingresos por actividad principal del anio.',
        },
        moneda: {
          label: 'Moneda de Operacion',
          tooltip: 'Moneda principal en la que opera la empresa. La mayoria de las PyMEs mexicanas operan en Pesos Mexicanos (MXN).',
          leyenda: 'Moneda de los estados financieros.',
        },
        periodos: {
          label: 'Periodo de analisis',
          tooltip: 'Numero de periodos que abarca el analisis. Para un diagnostico inicial, un solo periodo es suficiente.',
          opcionPeriodo: 'periodo',
          opcionPeriodos: 'periodos',
          leyenda: 'Para diagnostico inicial: 1 periodo.',
        },
        regimen: {
          label: 'Regimen Fiscal',
          tooltip: 'Regimen fiscal aplicable a la empresa. Persona Moral (30%) es el regimen general. RESICO (1.5%) aplica a residentes en Mexico con ingresos hasta $3.5M anuales. PFAE / Otro permite ingresar una tasa efectiva manualmente.',
          opcionPM30: 'Persona Moral (30%)',
          opcionR10: 'RESICO (1.0%)',
          opcionR11: 'RESICO (1.1%)',
          opcionR15: 'RESICO (1.5%)',
          opcionR20: 'RESICO (2.0%)',
          opcionR25: 'RESICO (2.5%)',
          opcionPFAE: 'PFAE / Otro (Ingreso Manual)',
          leyenda: 'Regimen segun constancia de situacion fiscal.',
        },
        tasaImpuesto: {
          label: 'Tasa de Impuesto (%)',
          tooltip: 'Tasa efectiva de impuesto que paga la empresa sobre su utilidad antes de impuestos. El ISR general es 30%, pero puede variar por regimen o incentivos fiscales.',
          leyenda: 'ISR general: 30%. RESICO: variable.',
        },
        informal: {
          label: 'Empresa Informal',
          tooltip: 'Activa esta opcion si la empresa no declara todos sus ingresos ante el SAT o mezcla gastos personales con gastos de negocio. Esto activara ajustes especiales en el calculo.',
          valorSi: 'Si — Aplica ajustes especiales',
          valorNo: 'No — Empresa formal',
          leyenda: 'Activa ajustes para empresas no formalizadas.',
        },
      },
    },

    /* ── Paso 2: Estado de Resultados ───────────────────────── */
    paso2EstadoResultados: {
      titulo: 'Estado de Resultados',
      subtitulo: 'Ingresa los valores del estado de resultados del periodo.',
      campos: {
        ventas: {
          label: 'Ventas (Ingresos)',
          tooltip: 'Total de ingresos por ventas de productos o servicios del periodo. Es la linea superior del estado de resultados.',
          leyenda: 'Ingresos totales por actividad principal.',
        },
        cogs: {
          label: 'Costo de Ventas (COGS)',
          tooltip: 'Costo directo de los productos o servicios vendidos. Incluye materia prima, mano de obra directa y costos de produccion. No incluye gastos administrativos ni de venta.',
          leyenda: 'Costos directos asociados a lo vendido.',
        },
        gastosAdm: {
          label: 'Gastos de Administracion',
          tooltip: 'Gastos indirectos necesarios para operar la empresa: sueldos administrativos, renta de oficinas, servicios, contabilidad, legal, seguros (no de autos), etc.',
          leyenda: 'Gastos fijos de operacion.',
        },
        gastosVta: {
          label: 'Gastos de Venta',
          tooltip: 'Gastos relacionados con la comercializacion: comisiones de vendedores, publicidad, marketing, promociones, fletes de entrega, gastos de showroom.',
          leyenda: 'Gastos de comercializacion y distribucion.',
        },
        da: {
          label: 'Depreciacion y Amortizacion',
          tooltip: 'Gasto no efectivo correspondiente a la depreciacion de activos fijos (mobiliario, equipo, vehiculos) y amortizacion de intangibles. Se encuentra usualmente despues del utilidad operativa.',
          leyenda: 'Gasto no efectivo. Aparece despues de la utilidad operativa.',
        },
        ingNoOp: {
          label: 'Ingresos No Operativos',
          tooltip: 'Ingresos que no provienen de la actividad principal: intereses bancarios, dividendos, venta de activos, rentas de propiedades.',
          leyenda: 'Ingresos por actividades secundarias.',
        },
        gtoNoOp: {
          label: 'Gastos No Operativos',
          tooltip: 'Gastos que no estan relacionados con la operacion principal: perdida en venta de activos, multas, donativos, gastos por siniestros.',
          leyenda: 'Gastos extraordinarios o no operativos.',
        },
        gastosFinancieros: {
          label: 'Gastos Financieros (Intereses)',
          tooltip: 'Intereses pagados por deuda bancaria, prestamos, arrendamiento financiero, fintechs y cualquier otra obligacion financiera. No incluye amortizacion de capital.',
          leyenda: 'Solo intereses pagados, no amortizacion.',
        },
        capex: {
          label: 'Inversion en Activos (CAPEX)',
          tooltip: 'Compras de activos fijos durante el periodo: equipo, maquinaria, vehiculos, mobiliario, mejoras a instalaciones. Representa la reinversion en el negocio.',
          leyenda: 'Compras de activos fijos del periodo.',
        },
      },
    },

    /* ── Paso 3: Balance General ────────────────────────────── */
    paso3Balance: {
      titulo: 'Balance General',
      subtitulo: 'Ingresa los valores de cada cuenta del balance. El sistema calculara automaticamente los totales.',
      seccionActivos: 'Activos',
      seccionPasivos: 'Pasivos',
      seccionPatrimonio: 'Patrimonio',
      campos: {
        cajaBancos: {
          label: 'Caja y Bancos',
          tooltip: 'Efectivo disponible: caja chica, cuentas bancarias de cheques, inversiones temporales de hasta 90 dias.',
          leyenda: 'Liquidez inmediata.',
        },
        cuentasCobrar: {
          label: 'Cuentas por Cobrar',
          tooltip: 'Derechos de cobro a clientes por ventas a credito. Incluye documentos por cobrar y cuentas de clientes.',
          leyenda: 'Clientes a credito.',
        },
        inventarios: {
          label: 'Inventarios',
          tooltip: 'Valor de mercaderia, materias primas, productos en proceso y productos terminados disponibles para venta.',
          leyenda: 'Materia prima, produccion y terminados.',
        },
        otrosActivosCorrientes: {
          label: 'Otros Activos Corrientes',
          tooltip: 'Anticipos a proveedores, impuestos por recuperar, pagos anticipados, depositos en garantia corto plazo.',
          leyenda: 'Anticipos, impuestos a favor, etc.',
        },
        activosFijosNetos: {
          label: 'Activos Fijos Netos',
          tooltip: 'Valor en libros de propiedades, planta y equipo: terrenos, edificios, maquinaria, vehiculos, mobiliario, menos depreciacion acumulada.',
          leyenda: 'Propiedades, planta y equipo neto.',
        },
        otrosActivosNoCorrientes: {
          label: 'Otros Activos No Corrientes',
          tooltip: 'Inversiones permanentes, intangibles (marca, patentes), depositos en garantia largo plazo, otros activos de recuperacion a mas de un anio.',
          leyenda: 'Intangibles, inversiones permanentes.',
        },
        cuentasPagar: {
          label: 'Cuentas por Pagar',
          tooltip: 'Obligaciones con proveedores por compras a credito de materia prima o mercancia. Es el pasivo operativo principal.',
          leyenda: 'Proveedores y documentos por pagar.',
        },
        deudaCortoPlazo: {
          label: 'Deuda Financiera Corto Plazo',
          tooltip: 'Obligaciones financieras con vencimiento menor a un anio: creditos bancarios revolventes, parte corto plazo de deuda a largo plazo, arrendamiento financiero corto plazo.',
          leyenda: 'Deuda bancaria con vencimiento < 1 anio.',
        },
        otrosPasivosCorrientes: {
          label: 'Otros Pasivos Corrientes',
          tooltip: 'Impuestos por pagar, anticipos de clientes, provisiones, sueldos por pagar, otros pasivos con vencimiento menor a un anio.',
          leyenda: 'Impuestos, nominas, provisiones.',
        },
        deudaLargoPlazo: {
          label: 'Deuda Financiera Largo Plazo',
          tooltip: 'Obligaciones financieras con vencimiento mayor a un anio: creditos hipotecarios, prestamos bancarios a largo plazo, arrendamiento financiero, obligaciones bursatiles.',
          leyenda: 'Deuda bancaria con vencimiento > 1 anio.',
        },
        otrosPasivosNoCorrientes: {
          label: 'Otros Pasivos No Corrientes',
          tooltip: 'Provisiones largo plazo, impuestos diferidos, pasivos por beneficios a empleados, otras obligaciones de largo plazo no financieras.',
          leyenda: 'Provisiones e impuestos diferidos.',
        },
        capitalSocial: {
          label: 'Capital Social',
          tooltip: 'Aportaciones originales de los socios al constituri la empresa. Es el capital legal registrado ante el Registro Publico de Comercio.',
          leyenda: 'Capital legal aportado por los socios.',
        },
        utilidadesRetenidas: {
          label: 'Utilidades Retenidas',
          tooltip: 'Utilidades acumuladas de ejercicios anteriores que no han sido repartidas a los socios. Incluye la utilidad o perdida del periodo actual.',
          leyenda: 'Ganancias acumuladas no distribuidas.',
        },
      },
      totales: {
        activoTotal: 'Activo Total',
        pasivoTotal: 'Pasivo Total',
        patrimonioTotal: 'Patrimonio Total',
        deudaTotal: 'Deuda Total',
        ecuacion: 'Activo = Pasivo + Patrimonio',
        ecuacionOk: 'Balance cuadrado',
        ecuacionError: 'El balance no cuadra — revisa los valores',
      },
    },

    /* ── Paso 4: Ajustes del Propietario ────────────────────── */
    paso4Ajustes: {
      titulo: 'Ajustes del Propietario',
      subtitulo: 'Correcciones para reflejar la realidad economica del negocio.',
      campos: {
        retiros: {
          label: 'Retiros del Propietario',
          tooltip: 'Distribuciones de utilidades, dividendos o retiros que el propietario hizo durante el periodo. Se suman al patrimonio para calcular el capital real invertido.',
          leyenda: 'Dividendos o retiros del periodo.',
        },
        gastosPersonales: {
          label: 'Gastos Personales cargados al Negocio',
          tooltip: 'Gastos del propietario o su familia que se pagan con recursos de la empresa: viajes personales, restaurantes, combustible de autos particulares, colegiaturas, etc.',
          leyenda: 'Gastos familiares pagados por la empresa.',
        },
        ventasNoFacturadas: {
          label: 'Ventas No Facturadas (Efectivo)',
          tooltip: 'Ventas realizadas en efectivo que no se declararon ante el SAT. Estas ventas representan ingreso real y deben sumarse para calcular la rentabilidad verdadera.',
          leyenda: 'Ventas en efectivo no declaradas.',
        },
        sueldoImputado: {
          label: 'Sueldo Imputado del Propietario',
          tooltip: 'Si el propietario no recibe sueldo formal pero trabaja en la empresa, ingresa el sueldo de mercado que se pagaria por su puesto. Esto normaliza la comparacion entre empresas.',
          leyenda: 'Sueldo de mercado para el puesto del dueño.',
        },
        deudaFintech: {
          label: 'Deuda con Fintechs',
          tooltip: 'Saldo pendiente de prestamos obtenidos mediante plataformas financieras digitales: Mercado Pago, Kueski, Kubo, Klar, Konfio, Credijusto, Clip, etc. Tasas tipicas del 20% al 60% anual.',
          leyenda: 'Mercado Pago, Kueski, Kubo, Klar, etc.',
        },
        deudaTarjeta: {
          label: 'Deuda con Tarjetas de Credito',
          tooltip: 'Saldo pendiente de tarjetas de credito empresariales o personales utilizadas para financiar operaciones del negocio. Tasas tipicas del 36% al 70% anual.',
          leyenda: 'Tarjetas empresariales o personales para operar.',
        },
        deudaAgiotista: {
          label: 'Deuda con Prestamistas',
          tooltip: 'Prestamos informales de prestamistas particulares o cambiarias. Suelen tener las tasas mas altas del mercado, frecuentemente por encima del 100% anual.',
          leyenda: 'Prestamos informales — usualmente el costo mas alto.',
        },
      },
      resumenDeudaSombra: 'Deuda Sombra Total',
    },

    /* ── Paso 5: Parametros Operativos ──────────────────────── */
    paso5Operativos: {
      titulo: 'Parametros Operativos',
      subtitulo: 'Parametros del costo de capital y ciclo de efectivo.',
      seccionCostoCapital: 'Costo de Capital',
      seccionCicloEfectivo: 'Ciclo de Efectivo (Opcional)',
      campos: {
        ventasCredito: {
          label: 'Ventas a Credito (%)',
          tooltip: 'Porcentaje de ventas que se realizan a credito. Afecta los dias de cobro y el ciclo de efectivo. El sistema sugiere un valor segun el sector seleccionado.',
          leyendaSugerido: 'Sugerido por sector',
          leyendaRango: 'Ajustable: 0% — 100%',
        },
        tasaInteres: {
          label: 'Tasa de Interes de la Deuda (%)',
          tooltip: 'Tasa promedio ponderada que paga la empresa por toda su deuda financiera (bancaria, fintech, tarjeta, etc.). En Mexico el rango tipico para PyMEs es 14% a 36% anual.',
          leyenda: 'Promedio ponderado de toda la deuda.',
        },
        primaPyME: {
          label: 'Prima de Riesgo PyME (%)',
          tooltip: 'Prima adicional por el riesgo de ser una empresa pequena. Compensa la menor liquidez, acceso limitado a credito y mayor volatilidad. Rango ajustable entre 1% y 8%.',
          leyenda: 'Rango ajustable: 1% — 8%',
        },
        diasCobro: {
          label: 'Dias de Cobro',
          tooltip: 'Dias promedio que tarda la empresa en cobrar a sus clientes. Se calcula automaticamente como: Cuentas por Cobrar / Ventas x 360. Puedes sobrescribir el valor.',
          placeholderAuto: 'Calculado automaticamente',
          leyendaCalculado: 'Calculado del balance',
          formula: '(Cuentas por Cobrar / Ventas x 360)',
          leyendaManual: 'Sobrescribe el calculo automatico',
        },
        diasInventario: {
          label: 'Dias de Inventario',
          tooltip: 'Dias promedio que el inventario permanece en almacen antes de venderse. Se calcula automaticamente como: Inventarios / Costo de Ventas x 360. Puedes sobrescribir el valor.',
          placeholderAuto: 'Calculado automaticamente',
          leyendaCalculado: 'Calculado del balance',
          formula: '(Inventarios / Costo de Ventas x 360)',
          leyendaManual: 'Sobrescribe el calculo automatico',
        },
        diasPago: {
          label: 'Dias de Pago',
          tooltip: 'Dias promedio que tarda la empresa en pagar a sus proveedores. Se calcula automaticamente como: Cuentas por Pagar / Costo de Ventas x 360. Puedes sobrescribir el valor.',
          placeholderAuto: 'Calculado automaticamente',
          leyendaCalculado: 'Calculado del balance',
          formula: '(Cuentas por Pagar / Costo de Ventas x 360)',
          leyendaManual: 'Sobrescribe el calculo automatico',
        },
      },
    },

    /* ── Validacion ─────────────────────────────────────────── */
    validacion: {
      campoRequerido: 'Este campo es requerido',
      valorMinimo: 'El valor minimo es',
      valorMaximo: 'El valor maximo es',
      minimoUnCampo: 'Completa al menos un campo',
      balanceNoCuadra: 'El balance no cuadra: Activo debe ser igual a Pasivo + Patrimonio',
    },

    /* ── Sectores disponibles (placeholder, se llenan del motor) ─ */
    sectoresDefault: [
      { id: '07', nombre: 'Industria General' },
      { id: '01', nombre: 'Comercio Minorista' },
      { id: '02', nombre: 'Manufactura Alimentaria' },
      { id: '03', nombre: 'Comercio Mayorista' },
      { id: '04', nombre: 'Comercio Electronico' },
      { id: '05', nombre: 'Construccion' },
      { id: '06', nombre: 'Servicios Profesionales' },
      { id: '08', nombre: 'Tecnologia y Software' },
      { id: '13', nombre: 'Restaurantes y Alimentos' },
      { id: '14', nombre: 'Transporte y Logistica' },
      { id: '15', nombre: 'Salud y Bienestar' },
      { id: '16', nombre: 'Automotriz' },
      { id: '17', nombre: 'Farmaceutico' },
    ],
  },
} as const;

/**
 * Tipo derivado del diccionario para type safety.
 * Permite a TypeScript inferir las claves disponibles.
 */
export type DiccionarioTipo = typeof DICCIONARIO;
