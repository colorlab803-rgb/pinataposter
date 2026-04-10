import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const IMAGE_MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation',
]

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

    if (imageBase64.length > 14_000_000) {
      return NextResponse.json(
        { error: 'Imagen demasiado grande para upscale (máx ~10MB)' },
        { status: 413 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    const prompts = [
      'You are an image enhancement AI. Take this input image and generate an improved, higher-resolution version of the same image. Increase sharpness, enhance details, and improve overall visual quality. Output ONLY the enhanced image, keeping the same composition, colors, and content.',
      'Generate a new high-quality version of this image with better resolution, sharper details, and enhanced clarity. The output must be an image that looks like an improved version of the input.',
    ]

    for (const modelName of IMAGE_MODELS) {
      const model = genAI.getGenerativeModel({
        model: modelName,
        // @ts-expect-error — responseModalities no está en los tipos pero la API lo requiere para generar imágenes
        generationConfig: { responseModalities: ['Text', 'Image'] },
      })

      for (const prompt of prompts) {
        try {
          const result = await model.generateContent([
            { inlineData: { mimeType, data: imageBase64 } },
            { text: prompt },
          ])

          const response = result.response
          const finishReason = response.candidates?.[0]?.finishReason as string | undefined

          if (finishReason === 'IMAGE_RECITATION') {
            console.warn(`Upscale [${modelName}]: IMAGE_RECITATION, reintentando…`)
            continue
          }

          for (const candidate of response.candidates ?? []) {
            for (const part of candidate.content?.parts ?? []) {
              if (part.inlineData?.data) {
                return NextResponse.json({
                  imageBase64: part.inlineData.data,
                  mimeType: part.inlineData.mimeType ?? 'image/png',
                })
              }
            }
          }
        } catch (modelError) {
          const msg = modelError instanceof Error ? modelError.message : String(modelError)
          console.warn(`Upscale [${modelName}] falló: ${msg}`)
          if (msg.includes('not found') || msg.includes('not available') || msg.includes('404')) {
            break // Modelo no existe, probar el siguiente
          }
        }
      }
    }

    return NextResponse.json(
      { error: 'No se pudo generar imagen mejorada. Todos los modelos fallaron.' },
      { status: 500 }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Upscale API error:', msg)
    return NextResponse.json(
      { error: `Error al procesar el upscale: ${msg}` },
      { status: 500 }
    )
  }
}
