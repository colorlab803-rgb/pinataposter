'use client'

import { ProductForm } from '@/components/catalog/ProductForm'

export default function NuevoProductoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Agregar producto</h1>
        <p className="text-gray-400 mt-1">Agrega una piñata o producto a tu catálogo</p>
      </div>
      <ProductForm />
    </div>
  )
}
