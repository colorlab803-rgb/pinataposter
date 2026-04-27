import { notFound } from 'next/navigation'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'
import ProductDetailClient from './ProductDetailClient'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>
}) {
  if (!DIGITAL_CATALOG_ENABLED) {
    notFound()
  }

  const { slug, productId } = await params
  return <ProductDetailClient slug={slug} productId={productId} />
}
