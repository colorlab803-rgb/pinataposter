import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getUser } from '@/lib/db'
import { TIER_LIMITS, TIER_NAMES, type UserTier } from '@/lib/tiers'

export async function GET() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json({
      loggedIn: false,
      tier: 'free' as UserTier,
      tierName: TIER_NAMES.free,
      limits: { ...TIER_LIMITS.free, upscalesPerDay: 0, upscalesPerHour: 0, upscalesPerMonth: 0 },
      upscaleCredits: 0,
      usage: null,
    })
  }

  const user = getUser(session.user.email)

  if (!user) {
    return NextResponse.json({
      loggedIn: true,
      tier: 'free' as UserTier,
      tierName: TIER_NAMES.free,
      limits: TIER_LIMITS.free,
      upscaleCredits: 0,
      usage: null,
    })
  }

  const now = Date.now()

  // Calcular uso restante
  const upscaleUsage = { ...user.upscaleUsage }
  if (now >= upscaleUsage.hourly.resetAt) upscaleUsage.hourly = { count: 0, resetAt: now + 3600000 }
  if (now >= upscaleUsage.daily.resetAt) upscaleUsage.daily = { count: 0, resetAt: now + 86400000 }
  if (now >= upscaleUsage.monthly.resetAt) upscaleUsage.monthly = { count: 0, resetAt: now + 2592000000 }

  const downloads = { ...user.downloadsToday }
  if (now >= downloads.resetAt) downloads.count = 0

  const limits = TIER_LIMITS[user.tier]

  return NextResponse.json({
    loggedIn: true,
    tier: user.tier,
    tierName: TIER_NAMES[user.tier],
    limits,
    upscaleCredits: user.upscaleCredits,
    usage: {
      upscalesHour: upscaleUsage.hourly.count,
      upscalesDay: upscaleUsage.daily.count,
      upscalesMonth: upscaleUsage.monthly.count,
      downloadsToday: downloads.count,
    },
    hasSubscription: !!user.subscriptionId && user.subscriptionStatus === 'active',
  })
}
