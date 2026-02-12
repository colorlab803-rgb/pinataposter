import { useCallback, useEffect, useState } from 'react'

// Breakpoints
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

// Hook para detectar dispositivos móviles muy pequeños
export function useIsMobileSmall() {
  const [isMobileSmall, setIsMobileSmall] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      setIsMobileSmall(window.innerWidth < BREAKPOINTS.xs)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  return isMobileSmall
}

// Hook para detectar dispositivos móviles
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.sm)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  return isMobile
}

// Hook para detectar dispositivos de baja gama
export function useLowEndDevice() {
  const [isLowEnd, setIsLowEnd] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      // Detectar dispositivos de baja gama basado en memoria y CPU
      const memory = (navigator as any).deviceMemory
      const cores = (navigator as any).hardwareConcurrency
      
      setIsLowEnd(
        (memory && memory <= 4) || // 4GB o menos de RAM
        (cores && cores <= 4) || // 4 cores o menos
        /Mobile|Android/.test(navigator.userAgent) // Es un dispositivo móvil
      )
    }
    
    checkDevice()
  }, [])

  return isLowEnd
}

// Hook para detectar orientación
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation('portrait')
      } else {
        setOrientation('landscape')
      }
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    return () => window.removeEventListener('resize', updateOrientation)
  }, [])

  return orientation
}

// Hook para manejar el viewport en móviles
export function useMobileViewport() {
  const setViewportHeight = useCallback(() => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }, [])

  useEffect(() => {
    setViewportHeight()
    window.addEventListener('resize', setViewportHeight)
    return () => window.removeEventListener('resize', setViewportHeight)
  }, [setViewportHeight])
}
