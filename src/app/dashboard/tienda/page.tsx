import { redirect } from 'next/navigation'
import { StoreForm } from '@/components/catalog/StoreForm'
import { CatalogPremiumGuard } from '@/components/catalog/CatalogPremiumGuard'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'

export default function TiendaPage() {
  if (!DIGITAL_CATALOG_ENABLED) {
    redirect('/dashboard')
  }

  return (
    <CatalogPremiumGuard>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Mi Tienda</h1>
          <p className="text-gray-400 mt-1">Configura los datos de tu negocio para tu catálogo público</p>
        </div>
        <StoreForm />
      </div>
    </CatalogPremiumGuard>
  )
}
