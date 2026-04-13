'use client'

import { useEffect, useRef } from 'react'

export function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !containerRef.current) return
    loaded.current = true

    const atScript = document.createElement('script')
    atScript.type = 'text/javascript'
    atScript.text = `
      atOptions = {
        'key' : '815ef3b2be924c972d18a41ef743b63a',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };
    `
    containerRef.current.appendChild(atScript)

    const invokeScript = document.createElement('script')
    invokeScript.type = 'text/javascript'
    invokeScript.src = 'https://www.highperformanceformat.com/815ef3b2be924c972d18a41ef743b63a/invoke.js'
    containerRef.current.appendChild(invokeScript)
  }, [])

  return (
    <div className="flex justify-center py-4">
      <div ref={containerRef} className="min-h-[300px] min-w-[160px]" />
    </div>
  )
}
