import { NextResponse } from 'next/server'
import { getFirestore } from '@/lib/db'
import { catalogDisabledResponse } from '@/lib/digital-catalog.server'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'

export async function GET(request: Request) {
  if (!DIGITAL_CATALOG_ENABLED) {
    return catalogDisabledResponse()
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Slug requerido' }, { status: 400 })
  }

  const db = getFirestore()
  const snapshot = await db.collection('stores').where('slug', '==', slug).limit(1).get()

  return NextResponse.json({ available: snapshot.empty })
}
