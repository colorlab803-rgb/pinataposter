import { NextRequest, NextResponse } from 'next/server'
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  SchemaType,
  type Tool,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai'

const SYSTEM_PROMPT = `Eres MoldeGPT, un asistente experto en crear moldes de piñatas para PiñataPoster.

PERSONALIDAD:
- Eres un piñatero experto, amigable y conversacional
- Hablas en español latinoamericano, natural y cálido
- Eres interactivo: guías al usuario paso a paso antes de actuar

CAPACIDADES (herramientas que puedes ejecutar):
1. configurarTamano(ancho, alto) — configura dimensiones del molde en cm
2. configurarPapel(tamanoPapel, orientacion) — selecciona tipo de papel
3. upscalarImagen() — mejora calidad de imagen con IA
4. descargarMolde(formato) — genera PDF o ZIP listo para imprimir

COMPORTAMIENTO INTERACTIVO — ESTO ES CRÍTICO:
Cuando el usuario envía una IMAGEN (sin especificar medidas):
1. Analiza qué es (personaje, forma, silueta, etc.) y descríbelo brevemente
2. PREGUNTA al usuario qué tamaño quiere para la piñata (sugiere opciones basadas en lo que ves)
3. NO ejecutes herramientas hasta tener la información del usuario

Cuando el usuario PROVEE las medidas o confirma un tamaño:
1. EJECUTA configurarTamano con las dimensiones indicadas
2. PREGUNTA qué tipo de papel prefiere (sugiere el mejor según el tamaño)
3. Si el usuario confirma o elige papel, EJECUTA configurarPapel

Cuando toda la configuración está lista:
1. Dile al usuario que el molde está listo
2. EJECUTA descargarMolde para que aparezca el botón de descarga
3. NO descargues automáticamente — el usuario decidirá cuándo descargar con el botón

EXCEPCIÓN — si el usuario da TODA la info en un solo mensaje (ej: "hazme un molde de 80x60 en Letter"):
- En ese caso SÍ ejecuta todas las herramientas de una vez, porque el usuario ya decidió

Cuando el usuario pide cambios:
- Si es claro (ej: "más grande", "cámbialo a Legal"), ejecuta la herramienta directamente
- Si es ambiguo, pregunta para clarificar

TAMAÑOS REFERENCIA DE PIÑATAS:
- Mini/de mesa: 30-40 cm alto, 25-30 cm ancho
- Mediana estándar: 60-80 cm alto, 45-60 cm ancho
- Grande: 80-100 cm alto, 60-75 cm ancho
- Gigante: 100-120 cm alto, 75-90 cm ancho

PAPEL RECOMENDADO (para sugerir al usuario):
- Piñatas hasta 80cm: Letter portrait
- Piñatas altas (>80cm): Legal portrait
- Piñatas anchas (ancho > alto): Letter landscape
- Piñatas gigantes (>100cm): Tabloid portrait

REGLAS:
- NUNCA ejecutes todas las herramientas de golpe sin que el usuario haya dado la información necesaria.
- Siempre PREGUNTA las medidas antes de configurar, a menos que el usuario ya las haya dado.
- NUNCA descargues automáticamente. Siempre usa descargarMolde para que aparezca el botón, pero solo cuando todo esté configurado.
- Usa emojis moderadamente para ser amigable 🪅✅📐
- Respuestas cortas y directas, máximo 3-4 líneas de texto.
- Cuando sugieras tamaños, ofrece opciones claras (ej: "¿Mini (35cm), Mediana (70cm), Grande (90cm) o Gigante (110cm)?").`

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

const CHAT_MODEL = 'gemini-2.5-flash'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY no configurada' }, { status: 500 })
  }

  let body: {
    messages: { role: string; content: string }[]
    imageBase64?: string
    imageMimeType?: string
    generatorState?: Record<string, unknown>
    userSettings?: Record<string, unknown> & { defaultPinataSize?: string; defaultPaperSize?: string; defaultOrientation?: string; autoDownloadPdf?: boolean }
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { messages, imageBase64, imageMimeType, generatorState, userSettings } = body

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages requerido' }, { status: 400 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    tools,
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
  })

  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]
  const lastParts: Part[] = []

  if (imageBase64) {
    lastParts.push({
      inlineData: {
        mimeType: imageMimeType || 'image/png',
        data: imageBase64,
      },
    })
  }

  let textContent = lastMessage.content || ''
  if (generatorState) {
    textContent += `\n\n[Estado actual del generador: ${JSON.stringify(generatorState)}]`
  }
  if (userSettings) {
    const sizeMap: Record<string, string> = {
      mini: '35cm alto, 25cm ancho',
      mediana: '70cm alto, 50cm ancho',
      grande: '90cm alto, 65cm ancho',
      gigante: '110cm alto, 80cm ancho',
    }
    textContent += `\n\n[Preferencias del usuario: tamaño preferido=${sizeMap[userSettings.defaultPinataSize ?? ''] || 'mediana'}, papel=${userSettings.defaultPaperSize || 'Letter'}, orientación=${userSettings.defaultOrientation || 'portrait'}, auto-descarga=${userSettings.autoDownloadPdf !== false ? 'sí' : 'no'}]`
  }
  if (imageBase64) {
    textContent += '\n\n[El usuario acaba de enviar una imagen. Analízala, describe lo que ves, y pregunta qué tamaño de piñata quiere antes de configurar.]'
  }
  lastParts.push({ text: textContent })

  // === STREAMING SSE ===
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const chat = model.startChat({ history })
        let maxIterations = 5
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentParts: any = lastParts

        while (maxIterations > 0) {
          maxIterations--

          const result = await chat.sendMessageStream(currentParts)
          const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = []

          for await (const chunk of result.stream) {
            for (const candidate of chunk.candidates ?? []) {
              for (const part of candidate.content.parts) {
                if ('text' in part && part.text) {
                  send({ type: 'text', content: part.text })
                }
                if ('functionCall' in part && part.functionCall) {
                  functionCalls.push({
                    name: part.functionCall.name,
                    args: (part.functionCall.args ?? {}) as Record<string, unknown>,
                  })
                }
              }
            }
          }

          if (functionCalls.length === 0) break

          send({ type: 'tool_calls', calls: functionCalls })

          const functionResponses = functionCalls.map((fc) => ({
            functionResponse: {
              name: fc.name,
              response: {
                success: true,
                message: `${fc.name} ejecutado correctamente`,
                estado: generatorState,
              },
            },
          }))

          currentParts = functionResponses
        }

        send({ type: 'done' })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        console.error(`MoldeGPT streaming error [${CHAT_MODEL}]:`, msg)

        let userMessage = 'Error al procesar la solicitud.'
        if (msg.includes('API key')) {
          userMessage = 'La API key de Gemini es inválida o expiró. Contacta al administrador.'
        } else if (msg.includes('not found') || msg.includes('not available')) {
          userMessage = `El modelo ${CHAT_MODEL} no está disponible. Contacta al administrador.`
        } else if (msg.includes('quota') || msg.includes('429')) {
          userMessage = 'Se excedió el límite de uso de la API. Intenta más tarde.'
        }

        send({ type: 'error', message: userMessage })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

