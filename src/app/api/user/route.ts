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
    })
  }

  const user = getUser(session.user.email)

  if (!user) {
    return NextResponse.json({
      loggedIn: true,
      designCredits: 0,
      hasCredits: false,
      watermark: true,
      freeDownloadsUsed: 0,
      freeDownloadsLimit: FREE_DAILY_LIMIT,
    })
  }

  const now = Date.now()
  const freeDownloads = { ...user.freeDownloadsToday }
  if (now >= freeDownloads.resetAt) freeDownloads.count = 0

  const hasCredits = user.designCredits > 0

  return NextResponse.json({
    loggedIn: true,
    designCredits: user.designCredits,
    hasCredits,
    watermark: !hasCredits,
    freeDownloadsUsed: freeDownloads.count,
    freeDownloadsLimit: FREE_DAILY_LIMIT,
  })
}
