import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_AI_API_KEY no configurada' },
        { status: 500 }
      )
    }

    const { imageBase64, mimeType = 'image/png' } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 requerido' }, { status: 400 })
    }

    // Validar tamaño (~10MB máx en base64)
    if (imageBase64.length > 14_000_000) {
      return NextResponse.json(
        { error: 'Imagen demasiado grande para upscale (máx ~10MB)' },
        { status: 413 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-preview-image-generation',
    })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      {
        text: 'Mejora la calidad y nitidez de esta imagen manteniendo exactamente el mismo diseño, colores y composición. Hazla más nítida, con más detalle y resolución visual. No cambies el contenido, solo mejora la calidad.',
      },
    ])

    const response = result.response

    // Extraer imagen generada de la respuesta
    for (const candidate of response.candidates ?? []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return NextResponse.json({
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType ?? 'image/png',
          })
        }
      }
    }

    return NextResponse.json(
      { error: 'No se pudo generar imagen mejorada' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Upscale API error:', error)
    return NextResponse.json(
      { error: 'Error al procesar el upscale' },
      { status: 500 }
    )
  }
}
