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
      model: 'gemini-3.1-flash-image-preview',
      // @ts-expect-error — responseModalities no está en los tipos pero es necesario para forzar respuesta de imagen
      generationConfig: { responseModalities: ['Text', 'Image'] },
    })

    const upscalePrompt = 'You are an image enhancement AI. Take this input image and generate an improved, higher-resolution version of the same image. Increase sharpness, enhance details, and improve overall visual quality. Output ONLY the enhanced image, keeping the same composition, colors, and content.'

    // Intentar hasta 2 veces con prompts variados
    const prompts = [
      upscalePrompt,
      'Generate a new high-quality version of this image with better resolution, sharper details, and enhanced clarity. The output must be an image that looks like an improved version of the input.',
    ]

    for (const prompt of prompts) {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        { text: prompt },
      ])

      const response = result.response

      // Verificar si fue rechazada por IMAGE_RECITATION
      const finishReason = response.candidates?.[0]?.finishReason as string | undefined
      if (finishReason === 'IMAGE_RECITATION') {
        console.warn('Upscale: IMAGE_RECITATION, reintentando con prompt alternativo...')
        continue
      }

      // Extraer imagen generada de la respuesta
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
