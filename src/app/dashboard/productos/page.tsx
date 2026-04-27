import { redirect } from 'next/navigation'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'
import ProductosPageClient from './ProductosPageClient'

export default function ProductosPage() {
  if (!DIGITAL_CATALOG_ENABLED) {
    redirect('/dashboard')
  }

  return <ProductosPageClient />
}
