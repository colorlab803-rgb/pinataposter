import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFirestore } from '@/lib/db'
import { getCatalogAccessForOwner, isCatalogPubliclyAccessible } from '@/lib/catalog-access'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'
import CatalogoClient from './CatalogoClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!DIGITAL_CATALOG_ENABLED) {
    return { title: 'Catálogo no encontrado' }
  }

  const { slug } = await params
  const db = getFirestore()
  const snapshot = await db.collection('stores').where('slug', '==', slug).limit(1).get()

  if (snapshot.empty) {
    return { title: 'Catálogo no encontrado' }
  }

  const store = snapshot.docs[0].data()
  const catalogAccess = await getCatalogAccessForOwner(store.userId, store.createdAt)

  if (!isCatalogPubliclyAccessible(catalogAccess)) {
    return { title: 'Catálogo no encontrado' }
  }

  const title = `${store.businessName} — Catálogo de Piñatas`
  const description = store.description || `Descubre el catálogo de piñatas de ${store.businessName}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(store.logo ? { images: [{ url: store.logo, width: 400, height: 400 }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function CatalogoPage({ params }: Props) {
  if (!DIGITAL_CATALOG_ENABLED) {
    notFound()
  }

  const { slug } = await params
  return <CatalogoClient slug={slug} />
}
