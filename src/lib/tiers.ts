/**
 * Sistema de packs de diseños.
 * Gratis: 1 diseño/día con marca de agua, sin upscale.
 * Con créditos: sin marca de agua, upscale incluido.
 */

/** Packs de diseños disponibles para compra */
export interface DesignPack {
  id: string
  name: string
  credits: number
  priceMXN: number
  priceEnvKey: string
}

export const DESIGN_PACKS: DesignPack[] = [
  { id: 'pack_5', name: '5 diseños', credits: 5, priceMXN: 25, priceEnvKey: 'pack_5' },
  { id: 'pack_15', name: '15 diseños', credits: 15, priceMXN: 65, priceEnvKey: 'pack_15' },
  { id: 'pack_50', name: '50 diseños', credits: 50, priceMXN: 199, priceEnvKey: 'pack_50' },
]

/** Mapeo de priceEnvKey a créditos */
export const PACK_CREDITS: Record<string, number> = {
  pack_5: 5,
  pack_15: 15,
  pack_50: 50,
}

/** Límite diario para usuarios gratuitos (sin créditos) */
export const FREE_DAILY_LIMIT = 1
