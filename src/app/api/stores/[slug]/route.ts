import { NextResponse } from 'next/server'
import { getFirestore } from '@/lib/db'
import { getCatalogAccessForOwner, isCatalogPubliclyAccessible } from '@/lib/catalog-access'
import { catalogDisabledResponse } from '@/lib/digital-catalog.server'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!DIGITAL_CATALOG_ENABLED) {
    return catalogDisabledResponse()
  }

  const { slug } = await params
  const db = getFirestore()

  const snapshot = await db.collection('stores').where('slug', '==', slug).limit(1).get()
  if (snapshot.empty) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  }

  const doc = snapshot.docs[0]
  const data = doc.data()
  const catalogAccess = await getCatalogAccessForOwner(data.userId, data.createdAt)

  if (!isCatalogPubliclyAccessible(catalogAccess)) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  }

  // Solo devolver datos públicos
  return NextResponse.json({
    store: {
      id: doc.id,
      slug: data.slug,
      businessName: data.businessName,
      description: data.description,
      logo: data.logo,
      bannerImage: data.bannerImage,
      whatsappNumber: data.whatsappNumber,
      socialMedia: data.socialMedia,
      location: data.location,
      theme: data.theme,
    },
  })
}
