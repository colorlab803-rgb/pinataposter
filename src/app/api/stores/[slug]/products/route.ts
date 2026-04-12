import { NextResponse } from 'next/server'
import { getFirestore } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const db = getFirestore()

  // Buscar la tienda por slug
  const storeSnap = await db.collection('stores').where('slug', '==', slug).limit(1).get()
  if (storeSnap.empty) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  }

  const storeId = storeSnap.docs[0].id

  // Obtener productos disponibles
  const productsSnap = await db
    .collection('products')
    .where('storeId', '==', storeId)
    .where('available', '==', true)
    .orderBy('order', 'asc')
    .get()

  const products = productsSnap.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency,
      category: data.category,
      sizes: data.sizes,
      images: data.images,
      available: data.available,
      productionTime: data.productionTime,
    }
  })

  return NextResponse.json({ products })
}
