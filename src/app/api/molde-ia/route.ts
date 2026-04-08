import { NextRequest, NextResponse } from 'next/server'
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  SchemaType,
  type Tool,
  type FunctionDeclaration,
} from '@google/generative-ai'

const SYSTEM_PROMPT = `Eres MoldeIA, el asistente de inteligencia artificial de PiñataPoster.
Tu misión es guiar a los usuarios paso a paso para crear moldes de piñatas listos para imprimir.

Puedes realizar las siguientes acciones usando tus herramientas:
- Configurar el tamaño real del molde (ancho y alto en cm)
- Configurar el tipo de papel y orientación
- Solicitar upscale (mejora de calidad) de la imagen cargada
- Iniciar la descarga del molde terminado en PDF o ZIP

Flujo sugerido:
1. Saluda y pregunta qué tipo de molde quieren crear
2. Pide que suban una imagen en el panel de la derecha (si no lo han hecho)
3. Pregunta el tamaño real en centímetros
4. Confirma y configura las dimensiones con tu herramienta
5. Pregunta el tipo de papel preferido (Carta, Oficio, A4, etc.)
6. Si la imagen se ve pixelada, ofrece hacer upscale
7. Ofrece descargar en PDF o ZIP

Responde siempre en español, de forma amigable y concisa.
Cuando uses una herramienta, explícale al usuario qué estás haciendo.`

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'configurarTamano',
    description: 'Configura el tamaño real del molde en el generador. Llama esta función cuando el usuario especifique las dimensiones deseadas.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ancho: { type: SchemaType.NUMBER, description: 'Ancho del molde en centímetros' } as never,
        alto: { type: SchemaType.NUMBER, description: 'Alto del molde en centímetros' } as never,
      },
      required: ['ancho', 'alto'],
    },
  },
  {
    name: 'configurarPapel',
    description: 'Configura el tipo de papel y orientación en el generador.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tamanoPapel: {
          type: SchemaType.STRING,
          description: 'Tipo de papel: Letter, Legal, Tabloid, A4 o A3',
          enum: ['Letter', 'Legal', 'Tabloid', 'A4', 'A3'],
        } as never,
        orientacion: {
          type: SchemaType.STRING,
          description: 'Orientación del papel: portrait o landscape',
          enum: ['portrait', 'landscape'],
        } as never,
      },
      required: ['tamanoPapel', 'orientacion'],
    },
  },
  {
    name: 'upscalarImagen',
    description: 'Mejora la calidad y resolución de la imagen actualmente cargada en el generador.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'descargarMolde',
    description: 'Inicia la descarga del molde configurado en el formato especificado.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        formato: {
          type: SchemaType.STRING,
          description: 'Formato de descarga: pdf o zip',
          enum: ['pdf', 'zip'],
        } as never,
      },
      required: ['formato'],
    },
  },
]

const tools: Tool[] = [{ functionDeclarations }]

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_AI_API_KEY no configurada' },
        { status: 500 }
      )
    }

    const { messages, generatorState } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages requerido' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools,
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    })

    // Convertir historial al formato de Gemini
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const lastMessage = messages[messages.length - 1]
    const userMessage = generatorState
      ? `${lastMessage.content}\n\n[Estado actual del generador: ${JSON.stringify(generatorState)}]`
      : lastMessage.content

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(userMessage)
    const response = result.response

    // Extraer tool calls si los hay
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = []
    for (const candidate of response.candidates ?? []) {
      for (const part of candidate.content.parts) {
        if (part.functionCall) {
          toolCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args as Record<string, unknown>,
          })
        }
      }
    }

    const text = response.text()

    return NextResponse.json({
      text,
      toolCalls,
    })
  } catch (error) {
    console.error('MoldeIA API error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
