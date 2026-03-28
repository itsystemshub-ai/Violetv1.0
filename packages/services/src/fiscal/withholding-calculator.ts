/**
 * Calculadora de Retenciones (IVA, ISLR, Municipales)
 * Venezuela: Agente de retención 75% o 100%
 */

export interface RetencionConfig {
  tipo: 'IVA' | 'ISLR' | 'MUNICIPAL';
  baseImponible: number;
  porcentaje?: number;
  esContribuyenteEspecial?: boolean;
}

export interface RetencionResult {
  tipo: string;
  baseImponible: number;
  porcentaje: number;
  montoRetenido: number;
  esContribuyenteEspecial: boolean;
}

/**
 * Calcula la retención de IVA
 * Ordinarios: 75% del IVA
 * Especiales: 100% del IVA
 */
export function calcularRetencionIVA(montoIVA: number, config: Partial<RetencionConfig> = {}): RetencionResult {
  const { porcentaje = 75, esContribuyenteEspecial = false } = config;
  
  const porcentajeFinal = esContribuyenteEspecial ? 100 : porcentaje;
  const montoRetenido = montoIVA * (porcentajeFinal / 100);

  return {
    tipo: 'IVA',
    baseImponible: montoIVA,
    porcentaje: porcentajeFinal,
    montoRetenido,
    esContribuyenteEspecial,
  };
}

/**
 * Calcula la retención de ISLR
 * Varía según el concepto: 1%, 2%, 3%, 5%, 10%, etc.
 */
export function calcularRetencionISLR(
  baseImponible: number, 
  concepto: string,
  porcentaje?: number
): RetencionResult {
  // Porcentajes comunes de retención ISLR
  const porcentajesPorConcepto: Record<string, number> = {
    'HONORARIOS_PROFESIONALES': 3,
    'COMISIONES': 3,
    'TRANSPORTE': 2,
    'PUBLICIDAD': 2,
    'SERVICIOS_PROFESIONALES': 3,
    'ALQUILERES': 3,
    'REGALIAS': 3,
    'INTERESES': 5,
    'PUBLICIDAD_Y_PROPAGANDA': 2,
  };

  const porcentajeFinal = porcentaje || porcentajesPorConcepto[concepto] || 3;
  const montoRetenido = baseImponible * (porcentajeFinal / 100);

  return {
    tipo: 'ISLR',
    baseImponible,
    porcentaje: porcentajeFinal,
    montoRetenido,
    esContribuyenteEspecial: false,
  };
}

/**
 * Calcula retenciones municipales (varía por municipio)
 * Generalmente entre 0.25% y 2%
 */
export function calcularRetencionMunicipal(
  baseImponible: number,
  municipio: string,
  porcentaje?: number
): RetencionResult {
  // Porcentajes comunes por municipio (ejemplos)
  const porcentajesPorMunicipio: Record<string, number> = {
    'CARACAS': 2,
    'MARACAIBO': 2,
    'VALENCIA': 2,
    'BARQUISIMETO': 2,
    'CIUDAD_GUAYANA': 1.5,
    'GENERAL': 1,
  };

  const porcentajeFinal = porcentaje || porcentajesPorMunicipio[municipio] || 1;
  const montoRetenido = baseImponible * (porcentajeFinal / 100);

  return {
    tipo: 'MUNICIPAL',
    baseImponible,
    porcentaje: porcentajeFinal,
    montoRetenido,
    esContribuyenteEspecial: false,
  };
}

/**
 * Calcula todas las retenciones de una operación
 */
export function calcularTodasLasRetenciones(
  montoIVA: number,
  baseImponibleISLR: number,
  baseImponibleMunicipal: number,
  options: {
    esContribuyenteEspecial?: boolean;
    conceptoISLR?: string;
    municipio?: string;
  } = {}
): {
  retencionIVA: RetencionResult;
  retencionISLR: RetencionResult;
  retencionMunicipal: RetencionResult;
  totalRetenciones: number;
} {
  const {
    esContribuyenteEspecial = false,
    conceptoISLR = 'SERVICIOS_PROFESIONALES',
    municipio = 'GENERAL',
  } = options;

  const retencionIVA = calcularRetencionIVA(montoIVA, { esContribuyenteEspecial });
  const retencionISLR = calcularRetencionISLR(baseImponibleISLR, conceptoISLR);
  const retencionMunicipal = calcularRetencionMunicipal(baseImponibleMunicipal, municipio);

  return {
    retencionIVA,
    retencionISLR,
    retencionMunicipal,
    totalRetenciones: retencionIVA.montoRetenido + retencionISLR.montoRetenido + retencionMunicipal.montoRetenido,
  };
}
