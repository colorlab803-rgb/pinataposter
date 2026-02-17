import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { recordUpscaleUsage } from '@/lib/db'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

// Real-ESRGAN model on Replicate
const REAL_ESRGAN_MODEL_VERSION =
  'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa'

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string
  error?: string
}

async function pollPrediction(id: string): Promise<ReplicatePrediction> {
  const maxAttempts = 60 // máximo ~2 minutos
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    })
    const data: ReplicatePrediction = await res.json()

    if (data.status === 'succeeded' || data.status === 'failed' || data.status === 'canceled') {
      return data
    }

    // Esperar 2 segundos entre chequeos
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error('Timeout: el upscale tardó demasiado.')
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

  // Verificar límite de upscale según tier
  const usageCheck = recordUpscaleUsage(session.user.email)
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { error: usageCheck.reason || 'Límite de upscale alcanzado.' },
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

    // Crear prediction en Replicate
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: REAL_ESRGAN_MODEL_VERSION,
        input: {
          image,
          scale: upscaleScale,
          face_enhance: false,
        },
      }),
    })

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => ({}))
      console.error('Replicate API error:', errorData)
      return NextResponse.json(
        { error: 'Error al iniciar el upscale. Inténtalo de nuevo.' },
        { status: 502 }
      )
    }

    const prediction: ReplicatePrediction = await createRes.json()

    // Polling hasta que termine
    const result = await pollPrediction(prediction.id)

    if (result.status === 'failed') {
      console.error('Replicate prediction failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'El upscale falló. Inténtalo con otra imagen.' },
        { status: 500 }
      )
    }

    if (result.status === 'canceled') {
      return NextResponse.json(
        { error: 'El upscale fue cancelado.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      output: result.output,
      message: `Imagen escalada ${upscaleScale}x exitosamente.`,
    })
  } catch (error) {
    console.error('Upscale error:', error)
    return NextResponse.json(
      { error: 'Error interno al procesar el upscale.' },
      { status: 500 }
    )
  }
}
