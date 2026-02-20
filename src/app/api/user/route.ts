import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getUser } from '@/lib/db'
import { FREE_DAILY_LIMIT } from '@/lib/tiers'

export async function GET() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json({
      loggedIn: false,
      designCredits: 0,
      hasCredits: false,
      watermark: true,
      freeDownloadsUsed: 0,
      freeDownloadsLimit: FREE_DAILY_LIMIT,
      freeDownloadsResetAt: null,
      planLabel: 'anonymous',
    })
  }

  const user = await getUser(session.user.email)

  if (!user) {
    return NextResponse.json({
      loggedIn: true,
      designCredits: 0,
      hasCredits: false,
      watermark: true,
      freeDownloadsUsed: 0,
      freeDownloadsLimit: FREE_DAILY_LIMIT,
      freeDownloadsResetAt: null,
      planLabel: 'free',
    })
  }

  const now = Date.now()
  const freeDownloads = { ...user.freeDownloadsToday }
  const isResetExpired = now >= freeDownloads.resetAt
  if (isResetExpired) freeDownloads.count = 0

  const hasCredits = user.designCredits > 0
  const planLabel = hasCredits ? 'credits' : 'free'

  return NextResponse.json({
    loggedIn: true,
    designCredits: user.designCredits,
    hasCredits,
    watermark: !hasCredits,
    freeDownloadsUsed: freeDownloads.count,
    freeDownloadsLimit: FREE_DAILY_LIMIT,
    freeDownloadsResetAt: isResetExpired ? null : freeDownloads.resetAt,
    planLabel,
  })
}
