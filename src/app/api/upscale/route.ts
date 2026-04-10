import { NextRequest, NextResponse } from 'next/server'

const REPLICATE_MODEL = 'nightmareai/real-esrgan'
const UPSCALE_FACTOR = 4
const MAX_POLL_TIME_MS = 120_000
const POLL_INTERVAL_MS = 1500

export async function POST(req: NextRequest) {
  try {
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (!replicateKey) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN no configurada' },
        { status: 500 }
      )
    }

    const { imageBase64, mimeType = 'image/png' } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 requerido' }, { status: 400 })
    }

    if (imageBase64.length > 20_000_000) {
      return NextResponse.json(
        { error: 'Imagen demasiado grande para upscale (máx ~15MB)' },
        { status: 413 }
      )
    }

    const dataUri = `data:${mimeType};base64,${imageBase64}`

    // Crear predicción
    const createRes = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          image: dataUri,
          scale: UPSCALE_FACTOR,
          face_enhance: false,
        },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      console.error('Replicate create error:', err)
      return NextResponse.json(
        { error: `Error al iniciar upscale: ${(err as { detail?: string }).detail || createRes.statusText}` },
        { status: createRes.status }
      )
    }

    const prediction = await createRes.json() as {
      id: string
      status: string
      output?: string
      error?: string
      urls: { get: string }
    }

    // Poll hasta completar
    const startTime = Date.now()
    let result = prediction

    while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled') {
      if (Date.now() - startTime > MAX_POLL_TIME_MS) {
        return NextResponse.json(
          { error: 'El upscale tardó demasiado. Intenta con una imagen más pequeña.' },
          { status: 504 }
        )
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))

      const pollRes = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${replicateKey}` },
      })
      result = await pollRes.json() as typeof result
    }

    if (result.status === 'failed') {
      console.error('Replicate prediction failed:', result.error)
      return NextResponse.json(
        { error: `Upscale falló: ${result.error || 'Error desconocido'}` },
        { status: 500 }
      )
    }

    if (!result.output) {
      return NextResponse.json(
        { error: 'No se obtuvo imagen del upscale' },
        { status: 500 }
      )
    }

    // Descargar la imagen resultado y convertir a base64
    const imageRes = await fetch(result.output)
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: 'Error al descargar imagen mejorada' },
        { status: 500 }
      )
    }

    const imageBuffer = await imageRes.arrayBuffer()
    const outputBase64 = Buffer.from(imageBuffer).toString('base64')
    const outputMimeType = imageRes.headers.get('content-type') || 'image/png'

    return NextResponse.json({
      imageBase64: outputBase64,
      mimeType: outputMimeType,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Upscale API error:', msg)
    return NextResponse.json(
      { error: `Error al procesar el upscale: ${msg}` },
      { status: 500 }
    )
  }
}
