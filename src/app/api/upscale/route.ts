import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { checkUpscaleAccess } from '@/lib/db'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

// Real-ESRGAN model en Replicate (usando modelo en vez de version hash)
const REPLICATE_MODEL = 'nightmareai/real-esrgan'

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string
  error?: string
  urls?: { get: string }
}

async function pollPrediction(id: string): Promise<ReplicatePrediction> {
  const maxAttempts = 90 // máximo ~3 minutos
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    })

    if (!res.ok) {
      console.error('Replicate poll error:', res.status, res.statusText)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      continue
    }

    const data: ReplicatePrediction = await res.json()

    if (data.status === 'succeeded' || data.status === 'failed' || data.status === 'canceled') {
      return data
    }

    // Esperar 2 segundos entre chequeos
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error('Timeout: el upscale tardó demasiado.')
}

/**
 * Descarga la imagen desde la URL de Replicate y la devuelve como base64 data URI.
 * Esto evita problemas de CORS en el cliente.
 */
async function downloadImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Error descargando imagen upscaled: ${res.status}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/png'
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

export async function POST(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'El servicio de upscale no está configurado. Falta REPLICATE_API_TOKEN.' },
      { status: 500 }
    )
  }

  // Verificar autenticación
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión con Google para usar el upscale.' },
      { status: 401 }
    )
  }

  // Verificar límite de upscale — solo con créditos de diseño
  const usageCheck = checkUpscaleAccess(session.user.email)
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { error: usageCheck.reason || 'Necesitas créditos para usar upscale.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { image, scale } = body as { image?: string; scale?: number }

    if (!image) {
      return NextResponse.json(
        { error: 'No se proporcionó una imagen.' },
        { status: 400 }
      )
    }

    const upscaleScale = scale && [2, 4].includes(scale) ? scale : 4

    // Crear prediction en Replicate usando el modelo (sin version hash hardcodeado)
    const createRes = await fetch(
      `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({
          input: {
            image,
            scale: upscaleScale,
            face_enhance: false,
          },
        }),
      }
    )

    if (!createRes.ok) {
      const errorText = await createRes.text().catch(() => 'Sin detalles')
      console.error('Replicate API error:', createRes.status, errorText)
      return NextResponse.json(
        { error: 'Error al iniciar el upscale. Inténtalo de nuevo.' },
        { status: 502 }
      )
    }

    let prediction: ReplicatePrediction = await createRes.json()

    // Si Replicate no completó con "Prefer: wait", hacer polling
    if (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      prediction = await pollPrediction(prediction.id)
    }

    if (prediction.status === 'failed') {
      console.error('Replicate prediction failed:', prediction.error)
      return NextResponse.json(
        { error: prediction.error || 'El upscale falló. Inténtalo con otra imagen.' },
        { status: 500 }
      )
    }

    if (prediction.status === 'canceled') {
      return NextResponse.json(
        { error: 'El upscale fue cancelado.' },
        { status: 500 }
      )
    }

    if (!prediction.output) {
      return NextResponse.json(
        { error: 'El upscale no generó resultado. Inténtalo con otra imagen.' },
        { status: 500 }
      )
    }

    // Descargar la imagen del CDN de Replicate en el servidor para evitar CORS en el cliente
    const base64Image = await downloadImageAsBase64(prediction.output)

    return NextResponse.json({
      output: base64Image,
      message: `Imagen escalada ${upscaleScale}x exitosamente.`,
    })
  } catch (error) {
    console.error('Upscale error:', error)
    const msg = error instanceof Error ? error.message : 'Error interno al procesar el upscale.'
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}
