import type { CatalogAccess } from './types/catalog-access'

const PREMIUM_KEY = 'pinataposter_premium'

interface PremiumData {
  expiresAt: number
  email: string
}

export interface PremiumStatusResponse {
  premium: boolean
  expiresAt?: number | null
  paymentMethod?: 'card' | 'oxxo' | 'manual' | null
  catalogAccess?: CatalogAccess
}

export function isPremiumUser(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(PREMIUM_KEY)
    if (!raw) return false
    const data: PremiumData = JSON.parse(raw)
    return Date.now() < data.expiresAt
  } catch {
    return false
  }
}

export function setPremiumStatus(email: string): void {
  const oneYear = 365 * 24 * 60 * 60 * 1000
  const data: PremiumData = {
    expiresAt: Date.now() + oneYear,
    email,
  }
  localStorage.setItem(PREMIUM_KEY, JSON.stringify(data))
}

export function clearPremiumStatus(): void {
  localStorage.removeItem(PREMIUM_KEY)
}

export function getPremiumEmail(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PREMIUM_KEY)
    if (!raw) return null
    const data: PremiumData = JSON.parse(raw)
    if (Date.now() >= data.expiresAt) return null
    return data.email
  } catch {
    return null
  }
}

export async function checkPremiumServer(idToken: string): Promise<PremiumStatusResponse> {
  try {
    const res = await fetch('/api/premium/check', {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    if (!res.ok) return { premium: false, expiresAt: null, paymentMethod: null }
    const data = await res.json() as PremiumStatusResponse
    
    // Si el servidor dice que es premium, sincronizar localStorage
    if (data.premium && data.expiresAt) {
      const localData: PremiumData = {
        expiresAt: data.expiresAt,
        email: '',
      }
      localStorage.setItem(PREMIUM_KEY, JSON.stringify(localData))
    }
    
    return data
  } catch {
    return { premium: false, expiresAt: null, paymentMethod: null }
  }
}

export async function syncPremiumFromServer(idToken: string): Promise<boolean> {
  const result = await checkPremiumServer(idToken)
  return result.premium
}
