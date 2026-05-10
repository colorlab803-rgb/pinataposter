import { NextResponse } from 'next/server'
import { getAnnualPassPricing } from '@/lib/annual-pass-pricing'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getAnnualPassPricing(), {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
