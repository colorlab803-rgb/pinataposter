import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/firebase-admin'
import { getFirestore } from '@/lib/db'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = getFirestore()
  const snapshot = await db.collection('stores').where('userId', '==', user.uid).limit(1).get()

  if (snapshot.empty) {
    return NextResponse.json({ store: null })
  }

  const doc = snapshot.docs[0]
  return NextResponse.json({ store: { id: doc.id, ...doc.data() } })
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { businessName, description, logo, bannerImage, whatsappNumber, socialMedia, location, theme } = body

  if (!businessName?.trim()) {
    return NextResponse.json({ error: 'El nombre del negocio es requerido' }, { status: 400 })
  }

  const db = getFirestore()

  // Verificar que no tenga ya una tienda
  const existing = await db.collection('stores').where('userId', '==', user.uid).limit(1).get()
  if (!existing.empty) {
    return NextResponse.json({ error: 'Ya tienes una tienda creada. Usa PUT para actualizar.' }, { status: 409 })
  }

  // Generar slug único
  let slug = slugify(businessName)
  let slugExists = true
  let attempts = 0
  while (slugExists && attempts < 10) {
    const slugCheck = await db.collection('stores').where('slug', '==', slug).limit(1).get()
    if (slugCheck.empty) {
      slugExists = false
    } else {
      slug = `${slugify(businessName)}-${Math.random().toString(36).slice(2, 6)}`
      attempts++
    }
  }

  const now = new Date().toISOString()
  const storeData = {
    userId: user.uid,
    slug,
    businessName: businessName.trim(),
    description: description?.trim() || '',
    logo: logo || null,
    bannerImage: bannerImage || null,
    whatsappNumber: whatsappNumber || '',
    socialMedia: {
      instagram: socialMedia?.instagram || null,
      facebook: socialMedia?.facebook || null,
      tiktok: socialMedia?.tiktok || null,
    },
    location: {
      city: location?.city || '',
      state: location?.state || '',
      country: location?.country || 'México',
    },
    theme: theme || 'default',
    createdAt: now,
    updatedAt: now,
  }

  const docRef = await db.collection('stores').add(storeData)
  return NextResponse.json({ store: { id: docRef.id, ...storeData } }, { status: 201 })
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const db = getFirestore()

  const snapshot = await db.collection('stores').where('userId', '==', user.uid).limit(1).get()
  if (snapshot.empty) {
    return NextResponse.json({ error: 'No tienes una tienda creada' }, { status: 404 })
  }

  const doc = snapshot.docs[0]
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }

  if (body.businessName?.trim()) updates.businessName = body.businessName.trim()
  if (body.description !== undefined) updates.description = body.description.trim()
  if (body.logo !== undefined) updates.logo = body.logo
  if (body.bannerImage !== undefined) updates.bannerImage = body.bannerImage
  if (body.whatsappNumber !== undefined) updates.whatsappNumber = body.whatsappNumber
  if (body.socialMedia) {
    updates.socialMedia = {
      instagram: body.socialMedia.instagram || null,
      facebook: body.socialMedia.facebook || null,
      tiktok: body.socialMedia.tiktok || null,
    }
  }
  if (body.location) {
    updates.location = {
      city: body.location.city || '',
      state: body.location.state || '',
      country: body.location.country || 'México',
    }
  }
  if (body.theme) updates.theme = body.theme

  // Cambio de slug
  if (body.slug && body.slug !== doc.data().slug) {
    const slugCheck = await db.collection('stores').where('slug', '==', body.slug).limit(1).get()
    if (!slugCheck.empty) {
      return NextResponse.json({ error: 'Ese slug ya está en uso' }, { status: 409 })
    }
    updates.slug = body.slug
  }

  await doc.ref.update(updates)
  const updated = await doc.ref.get()
  return NextResponse.json({ store: { id: doc.id, ...updated.data() } })
}
