import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/firebase-admin'
import { catalogDisabledResponse } from '@/lib/digital-catalog.server'
import { uploadImage } from '@/lib/storage'
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from '@/lib/types/catalog'
import { DIGITAL_CATALOG_ENABLED } from '@/lib/feature-flags'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  if (!DIGITAL_CATALOG_ENABLED) {
    return catalogDisabledResponse()
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: `La imagen excede ${MAX_IMAGE_SIZE_MB}MB` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
    const filename = `${randomUUID()}.${ext}`
    const path = `${user.uid}/${folder}/${filename}`

    const url = await uploadImage(buffer, path, file.type)

    return NextResponse.json({ url, path })
  } catch (error) {
    console.error('Error al subir imagen:', error)
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
  }
}
