/**
 * Definición de tiers y sus límites.
 */

export type UserTier = 'free' | 'premium' | 'pro'

export interface TierLimits {
  downloadsPerDay: number
  watermark: boolean
  upscalesPerDay: number
  upscalesPerHour: number
  upscalesPerMonth: number
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    downloadsPerDay: 1,
    watermark: true,
    upscalesPerDay: 1,    // solo si está logueado con Google, 0 sin login
    upscalesPerHour: 1,
    upscalesPerMonth: 30,
  },
  premium: {
    downloadsPerDay: Infinity,
    watermark: false,
    upscalesPerDay: 5,
    upscalesPerHour: 5,
    upscalesPerMonth: 150,
  },
  pro: {
    downloadsPerDay: Infinity,
    watermark: false,
    upscalesPerDay: 50,   // uso justo
    upscalesPerHour: 10,  // uso justo
    upscalesPerMonth: 500, // uso justo
  },
}

/** Créditos otorgados por cada pack de upscale */
export const UPSCALE_PACKS: Record<string, number> = {
  pack_25: 25,
  pack_50: 50,
  pack_200: 200,
}

/** Nombres legibles de los tiers */
export const TIER_NAMES: Record<UserTier, string> = {
  free: 'Gratis',
  premium: 'Premium',
  pro: 'Pro',
}
