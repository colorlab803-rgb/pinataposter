import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/firebase-admin'
import { getFirestore } from '@/lib/db'
import { getCatalogAccessForUser, isCatalogWritable } from '@/lib/catalog-access'
import { catalogDisabledResponse } from '@/lib/digital-catalog.server'
import type { CatalogAccess } from '@/lib/types/catalog-access'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'

function premiumRequiredResponse(catalogAccess: CatalogAccess) {
  return NextResponse.json(
    {
      error: 'El catálogo digital ahora es exclusivo para usuarios premium',
      code: 'CATALOG_PREMIUM_REQUIRED',
      catalogAccess,
    },
    { status: 403 }
  )
}

export async function GET(request: Request) {
  if (!DIGITAL_CATALOG_ENABLED) {
    return catalogDisabledResponse()
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = getFirestore()

  // Buscar la tienda del usuario
  const storeSnap = await db.collection('stores').where('userId', '==', user.uid).limit(1).get()
  if (storeSnap.empty) {
    return NextResponse.json({ products: [] })
  }

  const storeId = storeSnap.docs[0].id
  const productsSnap = await db
    .collection('products')
    .where('storeId', '==', storeId)
    .orderBy('order', 'asc')
    .get()

  const products = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  if (!DIGITAL_CATALOG_ENABLED) {
    return catalogDisabledResponse()
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const catalogAccess = await getCatalogAccessForUser(user.uid)
  if (!isCatalogWritable(catalogAccess)) {
    return premiumRequiredResponse(catalogAccess)
  }

  const body = await request.json()
  const db = getFirestore()

  // Buscar la tienda del usuario
  const storeSnap = await db.collection('stores').where('userId', '==', user.uid).limit(1).get()
  if (storeSnap.empty) {
    return NextResponse.json({ error: 'Primero debes crear tu tienda' }, { status: 400 })
  }

  const storeId = storeSnap.docs[0].id

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'El nombre del producto es requerido' }, { status: 400 })
  }

  // Calcular el orden (último + 1)
  const lastProduct = await db
    .collection('products')
    .where('storeId', '==', storeId)
    .orderBy('order', 'desc')
    .limit(1)
    .get()

  const nextOrder = lastProduct.empty ? 0 : (lastProduct.docs[0].data().order || 0) + 1

  const now = new Date().toISOString()
  const productData = {
    storeId,
    name: body.name.trim(),
    description: body.description?.trim() || '',
    price: Number(body.price) || 0,
    currency: body.currency || 'MXN',
    category: body.category || '',
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    images: Array.isArray(body.images) ? body.images.slice(0, 5) : [],
    available: body.available !== false,
    productionTime: body.productionTime || '',
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = await db.collection('products').add(productData)
  return NextResponse.json({ product: { id: docRef.id, ...productData } }, { status: 201 })
}
