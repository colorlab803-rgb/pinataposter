import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { checkUpscaleAccess } from '@/lib/db'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

// Real-ESRGAN model en Replicate
const REPLICATE_MODEL = 'nightmareai/real-esrgan'

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string
  error?: string
}

/**
 * POST /api/upscale — Inicia una predicción de upscale y retorna el ID inmediatamente.
 * No bloquea esperando el resultado (evita timeout de Cloudflare ~100s).
 */
export async function POST(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'El servicio de upscale no está configurado. Falta REPLICATE_API_TOKEN.' },
      { status: 500 }
    )
  }

  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión con Google para usar el upscale.' },
      { status: 401 }
    )
  }

  const usageCheck = await checkUpscaleAccess(session.user.email)
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

    // Crear prediction en Replicate — retorna inmediatamente sin esperar resultado
    const createRes = await fetch(
      `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
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

    const prediction: ReplicatePrediction = await createRes.json()

    // Retornar el ID de la predicción para que el frontend haga polling
    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
    })
  } catch (error) {
    console.error('Upscale start error:', error)
    const msg = error instanceof Error ? error.message : 'Error interno al procesar el upscale.'
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upscale?id=xxx — Consulta el estado de una predicción.
 * El frontend llama esto cada ~3 segundos hasta que termine.
 */
export async function GET(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Servicio no configurado.' },
      { status: 500 }
    )
  }

  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'No autenticado.' },
      { status: 401 }
    )
  }

  const predictionId = request.nextUrl.searchParams.get('id')
  if (!predictionId) {
    return NextResponse.json(
      { error: 'Falta el ID de predicción.' },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
      }
    )

    if (!res.ok) {
      console.error('Replicate poll error:', res.status, res.statusText)
      return NextResponse.json(
        { error: 'Error consultando el estado del upscale.' },
        { status: 502 }
      )
    }

    const prediction: ReplicatePrediction = await res.json()

    if (prediction.status === 'failed') {
      console.error('Replicate prediction failed:', prediction.error)
      return NextResponse.json({
        status: 'failed',
        error: prediction.error || 'El upscale falló. Inténtalo con otra imagen.',
      })
    }

    if (prediction.status === 'canceled') {
      return NextResponse.json({
        status: 'canceled',
        error: 'El upscale fue cancelado.',
      })
    }

    if (prediction.status === 'succeeded') {
      if (!prediction.output) {
        return NextResponse.json({
          status: 'failed',
          error: 'El upscale no generó resultado.',
        })
      }

      // Descargar la imagen en el servidor para evitar CORS en el cliente
      const imgRes = await fetch(prediction.output)
      if (!imgRes.ok) {
        return NextResponse.json({
          status: 'failed',
          error: 'Error descargando la imagen mejorada.',
        })
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      const contentType = imgRes.headers.get('content-type') || 'image/png'
      const base64 = `data:${contentType};base64,${buffer.toString('base64')}`

      return NextResponse.json({
        status: 'succeeded',
        output: base64,
      })
    }

    // Todavía procesando
    return NextResponse.json({
      status: prediction.status, // 'starting' | 'processing'
    })
  } catch (error) {
    console.error('Upscale poll error:', error)
    return NextResponse.json(
      { error: 'Error consultando el estado del upscale.' },
      { status: 500 }
    )
  }
}
