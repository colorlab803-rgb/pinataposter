import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/firebase-admin'
import { getFirestore } from '@/lib/db'

async function verifyProductOwnership(productId: string, userId: string) {
  const db = getFirestore()
  const productDoc = await db.collection('products').doc(productId).get()
  if (!productDoc.exists) return null

  const product = productDoc.data()!
  const storeSnap = await db.collection('stores').where('userId', '==', userId).limit(1).get()
  if (storeSnap.empty || storeSnap.docs[0].id !== product.storeId) return null

  return { doc: productDoc, data: product }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await verifyProductOwnership(id, user.uid)
  if (!result) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ product: { id: result.doc.id, ...result.data } })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await verifyProductOwnership(id, user.uid)
  if (!result) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const body = await request.json()
  const db = getFirestore()
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }

  if (body.name?.trim()) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description.trim()
  if (body.price !== undefined) updates.price = Number(body.price) || 0
  if (body.currency) updates.currency = body.currency
  if (body.category !== undefined) updates.category = body.category
  if (body.sizes !== undefined) updates.sizes = Array.isArray(body.sizes) ? body.sizes : []
  if (body.images !== undefined) updates.images = Array.isArray(body.images) ? body.images.slice(0, 5) : []
  if (body.available !== undefined) updates.available = body.available
  if (body.productionTime !== undefined) updates.productionTime = body.productionTime
  if (body.order !== undefined) updates.order = body.order

  await db.collection('products').doc(id).update(updates)
  const updated = await db.collection('products').doc(id).get()
  return NextResponse.json({ product: { id, ...updated.data() } })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await verifyProductOwnership(id, user.uid)
  if (!result) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const db = getFirestore()
  await db.collection('products').doc(id).delete()
  return NextResponse.json({ success: true })
}
