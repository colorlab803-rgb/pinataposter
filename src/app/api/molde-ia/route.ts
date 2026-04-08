import { NextRequest, NextResponse } from 'next/server'
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  SchemaType,
  type Tool,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'

const SYSTEM_PROMPT = `Eres MoldeIA, un agente experto en crear moldes de piñatas para PiñataPoster.

PERSONALIDAD:
- Eres un piñatero experto, amigable y eficiente
- Hablas en español latinoamericano, natural y cálido
- Eres MUY proactivo: cuando tienes la info necesaria, actúas sin pedir confirmación

CAPACIDADES (herramientas que puedes ejecutar):
1. configurarTamano(ancho, alto) — configura dimensiones del molde en cm
2. configurarPapel(tamanoPapel, orientacion) — selecciona tipo de papel
3. upscalarImagen() — mejora calidad de imagen con IA
4. descargarMolde(formato) — genera PDF o ZIP listo para imprimir

COMPORTAMIENTO AGÉNTICO — ESTO ES CRÍTICO:
Cuando el usuario envía una IMAGEN:
1. Analiza qué es (personaje, forma, silueta, etc.)
2. EJECUTA configurarTamano con dimensiones apropiadas para una piñata
3. EJECUTA configurarPapel con el mejor papel para esas dimensiones
4. EJECUTA descargarMolde('pdf') para generar el PDF automáticamente
5. Explica brevemente lo que hiciste

Cuando el usuario pide cambios:
- Ejecuta las herramientas inmediatamente sin preguntar
- Si dice "más grande", aumenta dimensiones y reconfigura

TAMAÑOS REFERENCIA DE PIÑATAS:
- Mini/de mesa: 30-40 cm alto, 25-30 cm ancho
- Mediana estándar: 60-80 cm alto, 45-60 cm ancho
- Grande: 80-100 cm alto, 60-75 cm ancho
- Gigante: 100-120 cm alto, 75-90 cm ancho
- Si no especifica tamaño: usa 70cm alto (mediana estándar)

PAPEL RECOMENDADO:
- Piñatas hasta 80cm: Letter portrait
- Piñatas altas (>80cm): Legal portrait
- Piñatas anchas (ancho > alto): Letter landscape
- Piñatas gigantes (>100cm): Tabloid portrait

REGLAS:
- SIEMPRE ejecuta las herramientas cuando tengas la información. No preguntes "¿quieres que configure?"—simplemente hazlo.
- Cuando recibas una imagen, DEBES llamar las 3 herramientas (tamano + papel + descarga) en tu respuesta.
- Si el usuario ya tiene una imagen cargada (según el estado del generador), puedes configurar y descargar directamente.
- Usa emojis moderadamente para ser amigable 🪅✅📐
- Respuestas cortas y directas, máximo 3-4 líneas de texto.`

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'configurarTamano',
    description: 'Configura el tamaño real del molde en centímetros. Llama SIEMPRE cuando sepas las dimensiones.',
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
    description: 'Configura tipo de papel y orientación. Llama después de configurar tamaño.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tamanoPapel: {
          type: SchemaType.STRING,
          description: 'Tipo de papel',
          enum: ['Letter', 'Legal', 'Tabloid', 'A4', 'A3'],
        } as never,
        orientacion: {
          type: SchemaType.STRING,
          description: 'Orientación del papel',
          enum: ['portrait', 'landscape'],
        } as never,
      },
      required: ['tamanoPapel', 'orientacion'],
    },
  },
  {
    name: 'upscalarImagen',
    description: 'Mejora la calidad/resolución de la imagen cargada con IA.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'descargarMolde',
    description: 'Genera y descarga el molde en PDF o ZIP. Llama después de configurar tamaño y papel.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        formato: {
          type: SchemaType.STRING,
          description: 'Formato de descarga',
          enum: ['pdf', 'zip'],
        } as never,
      },
      required: ['formato'],
    },
  },
]

const tools: Tool[] = [{ functionDeclarations }]

function extractFromResponse(response: { candidates?: Array<{ content: { parts: Part[] } }> }) {
  let text = ''
  const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = []

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content.parts) {
      if ('text' in part && part.text) text += part.text
      if ('functionCall' in part && part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: (part.functionCall.args ?? {}) as Record<string, unknown>,
        })
      }
    }
  }

  return { text, functionCalls }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY no configurada' }, { status: 500 })
    }

    const { messages, imageBase64, imageMimeType, generatorState } = await req.json()

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

    // Construir historial (todos los mensajes excepto el último)
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    // Construir el mensaje del usuario (último mensaje + imagen opcional + estado)
    const lastMessage = messages[messages.length - 1]
    const lastParts: Part[] = []

    // Agregar imagen si existe
    if (imageBase64) {
      lastParts.push({
        inlineData: {
          mimeType: imageMimeType || 'image/png',
          data: imageBase64,
        },
      })
    }

    // Texto del usuario + estado del generador como contexto
    let textContent = lastMessage.content || ''
    if (generatorState) {
      textContent += `\n\n[Estado actual del generador: ${JSON.stringify(generatorState)}]`
    }
    if (imageBase64) {
      textContent += '\n\n[El usuario acaba de enviar una imagen. Analízala y ejecuta las herramientas para crear el molde automáticamente.]'
    }
    lastParts.push({ text: textContent })

    const chat = model.startChat({ history })

    // === LOOP AGÉNTICO ===
    // El agente puede llamar herramientas y el servidor simula las respuestas
    // para que el agente pueda encadenar múltiples acciones en una sola interacción
    const allToolCalls: Array<{ name: string; args: Record<string, unknown> }> = []
    let finalText = ''
    let maxIterations = 5

    let result = await chat.sendMessage(lastParts)

    while (maxIterations > 0) {
      maxIterations--
      const extracted = extractFromResponse(result.response)

      if (extracted.functionCalls.length === 0) {
        finalText = extracted.text
        break
      }

      // Recolectar tool calls
      allToolCalls.push(...extracted.functionCalls)

      // Si también hay texto, guardarlo
      if (extracted.text) finalText = extracted.text

      // Simular respuestas exitosas de las funciones y continuar el loop
      const functionResponses = extracted.functionCalls.map((fc) => ({
        functionResponse: {
          name: fc.name,
          response: {
            success: true,
            message: `${fc.name} ejecutado correctamente`,
            estado: generatorState,
          },
        },
      }))

      result = await chat.sendMessage(functionResponses)
    }

    return NextResponse.json({
      text: finalText,
      toolCalls: allToolCalls,
    })
  } catch (error) {
    console.error('MoldeIA API error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

