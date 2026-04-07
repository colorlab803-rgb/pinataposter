'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const VISIT_KEY = 'pinataposter_visit_tracked'

export function TrackVisit() {
  const pathname = usePathname()
  const tracked = useRef(false)

  useEffect(() => {
    const sessionKey = `${VISIT_KEY}_${pathname}`
    if (tracked.current || sessionStorage.getItem(sessionKey)) return
    tracked.current = true
    sessionStorage.setItem(sessionKey, 'true')

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'visit', page: pathname }),
    }).catch(() => {})
  }, [pathname])

  return null
}

export function trackGeneratorUse(action: 'upload' | 'download') {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'generator', action }),
  }).catch(() => {})
}
