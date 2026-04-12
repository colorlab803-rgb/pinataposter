import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/firebase-admin'
import { uploadImage } from '@/lib/storage'
import { randomUUID } from 'crypto'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: Request) {
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

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen excede 2MB' }, { status: 400 })
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
