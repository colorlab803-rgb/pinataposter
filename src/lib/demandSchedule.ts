/**
 * Lógica de horario para el banner de alta demanda.
 * 
 * Reglas:
 * - Día de lanzamiento (13 abril 2026): TODO el día
 * - Días pares desde launch: TODO el día
 * - Días impares: horas alternadas desde las 9am (1h sí, 1h no)
 *   Antes de las 9am en días impares = no visible
 */

const LAUNCH_DATE = new Date(2026, 3, 13) // 13 abril 2026 (mes 0-indexed)

function getDaysSinceLaunch(): number {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfLaunch = new Date(LAUNCH_DATE.getFullYear(), LAUNCH_DATE.getMonth(), LAUNCH_DATE.getDate())
  const diffMs = startOfToday.getTime() - startOfLaunch.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function shouldShowDemandBanner(): boolean {
  const daysSinceLaunch = getDaysSinceLaunch()

  // Antes del lanzamiento: no mostrar
  if (daysSinceLaunch < 0) return false

  // Día de lanzamiento (día 0) o días pares: TODO el día
  if (daysSinceLaunch % 2 === 0) return true

  // Días impares: alternar horas desde las 9am
  const currentHour = new Date().getHours()

  // Antes de las 9am: no mostrar
  if (currentHour < 9) return false

  // Desde las 9am: hora par (0, 2, 4...) desde las 9 = visible
  const hoursSince9 = currentHour - 9
  return hoursSince9 % 2 === 0
}
