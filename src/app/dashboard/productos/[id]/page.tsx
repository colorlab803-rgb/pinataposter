'use client'

import { use } from 'react'
import { ProductForm } from '@/components/catalog/ProductForm'
import { CatalogPremiumGuard } from '@/components/catalog/CatalogPremiumGuard'

export default function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <CatalogPremiumGuard>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Editar producto</h1>
          <p className="text-gray-400 mt-1">Modifica los datos de tu producto</p>
        </div>
        <ProductForm productId={id} />
      </div>
    </CatalogPremiumGuard>
  )
}
