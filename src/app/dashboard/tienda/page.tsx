'use client'

import { StoreForm } from '@/components/catalog/StoreForm'

export default function TiendaPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Mi Tienda</h1>
        <p className="text-gray-400 mt-1">Configura los datos de tu negocio para tu catálogo público</p>
      </div>
      <StoreForm />
    </div>
  )
}
