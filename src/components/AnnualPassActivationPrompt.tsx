'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal'
import type { PremiumStatusResponse } from '@/lib/premium'

const DISMISSED_UNTIL_KEY = 'pinataposter_annual_pass_prompt_dismissed_until_v1'
const SESSION_SEEN_KEY = 'pinataposter_annual_pass_prompt_seen_session_v1'
const PROMPT_DELAY_MS = 1200
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000

function scopedKey(baseKey: string, subject: string) {
  return `${baseKey}:${subject}`
}

function storageGet(storage: Storage | undefined, key: string) {
  try {
    return storage?.getItem(key) || null
  } catch {
    return null
  }
}

function storageSet(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value)
  } catch {
    // Storage may be unavailable in strict privacy modes.
  }
}

function storageRemove(storage: Storage | undefined, key: string) {
  try {
    storage?.removeItem(key)
  } catch {
    // Storage may be unavailable in strict privacy modes.
  }
}

function isEligibleAppPath(pathname: string | null) {
  return Boolean(pathname && (pathname === '/generator' || pathname.startsWith('/dashboard')))
}

export function AnnualPassActivationPrompt() {
  const pathname = usePathname()
  const { user, loading: authLoading, getIdToken } = useAuth()
  const [open, setOpen] = useState(false)

  const userScope = useMemo(() => user?.uid || user?.email || null, [user?.email, user?.uid])
  const redirectTo = pathname && isEligibleAppPath(pathname) ? pathname : '/generator'

  useEffect(() => {
    if (authLoading || !user || !userScope || !isEligibleAppPath(pathname)) {
      setOpen(false)
      return
    }

    const subject = userScope
    let cancelled = false
    let promptTimer: ReturnType<typeof setTimeout> | null = null

    async function verifyAndPrompt() {
      const dismissedKey = scopedKey(DISMISSED_UNTIL_KEY, subject)
      const sessionKey = scopedKey(SESSION_SEEN_KEY, subject)

      const sessionStorageRef = typeof window === 'undefined' ? undefined : window.sessionStorage
      const localStorageRef = typeof window === 'undefined' ? undefined : window.localStorage

      if (storageGet(sessionStorageRef, sessionKey) === 'true') return

      const dismissedUntil = Number(storageGet(localStorageRef, dismissedKey) || 0)
      if (dismissedUntil && Date.now() < dismissedUntil) return

      const token = await getIdToken()
      if (!token || cancelled) return

      try {
        const res = await fetch('/api/premium/check', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok || cancelled) return

        const data = await res.json() as PremiumStatusResponse
        if (data.premium) {
          setOpen(false)
          storageRemove(localStorageRef, dismissedKey)
          storageRemove(sessionStorageRef, sessionKey)
          return
        }

        promptTimer = setTimeout(() => {
          if (cancelled) return
          storageSet(sessionStorageRef, sessionKey, 'true')
          setOpen(true)
        }, PROMPT_DELAY_MS)
      } catch {
        // If premium cannot be verified, do not show advertising.
      }
    }

    void verifyAndPrompt()

    return () => {
      cancelled = true
      if (promptTimer) clearTimeout(promptTimer)
    }
  }, [authLoading, getIdToken, pathname, user, userScope])

  const handleClose = () => {
    if (userScope) {
      const localStorageRef = typeof window === 'undefined' ? undefined : window.localStorage
      storageSet(
        localStorageRef,
        scopedKey(DISMISSED_UNTIL_KEY, userScope),
        String(Date.now() + DISMISS_COOLDOWN_MS)
      )
    }
    setOpen(false)
  }

  return (
    <PremiumUpgradeModal
      open={open}
      onClose={handleClose}
      redirectTo={redirectTo}
      secondaryActionLabel="Ahora no, seguir usando la app"
    />
  )
}
