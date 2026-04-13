const PREMIUM_KEY = 'pinataposter_premium'

interface PremiumData {
  expiresAt: number
  email: string
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
