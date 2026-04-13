'use client'

import { useEffect, useRef } from 'react'

export function AdNativeBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !containerRef.current) return
    loaded.current = true

    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = 'https://pl29137818.profitablecpmratenetwork.com/254bc49b50ced40c080088849078eeaf/invoke.js'
    containerRef.current.appendChild(script)
  }, [])

  return (
    <div className="flex justify-center py-4">
      <div ref={containerRef}>
        <div id="container-254bc49b50ced40c080088849078eeaf" />
      </div>
    </div>
  )
}
