import { redirect } from 'next/navigation'
import { ProductForm } from '@/components/catalog/ProductForm'
import { CatalogPremiumGuard } from '@/components/catalog/CatalogPremiumGuard'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'

export default function NuevoProductoPage() {
  if (!DIGITAL_CATALOG_ENABLED) {
    redirect('/dashboard')
  }

  return (
    <CatalogPremiumGuard>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Agregar producto</h1>
          <p className="text-gray-400 mt-1">Agrega una piñata o producto a tu catálogo</p>
        </div>
        <ProductForm />
      </div>
    </CatalogPremiumGuard>
  )
}
