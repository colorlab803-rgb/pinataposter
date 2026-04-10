import { type Message } from '@/components/MoldeIA/ChatMessage'

// ── Interfaces ──────────────────────────────────────────────

export interface Conversation {
  id: string
  userId?: string | null
  title: string
  createdAt: number
  updatedAt: number
  preview: string
  messages: Message[]
}

export interface UserSettings {
  defaultPinataSize: 'mini' | 'mediana' | 'grande' | 'gigante'
  defaultPaperSize: 'Letter' | 'Legal' | 'Tabloid' | 'A4' | 'A3'
  defaultOrientation: 'portrait' | 'landscape'
  autoDownloadPdf: boolean
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultPinataSize: 'mediana',
  defaultPaperSize: 'Letter',
  defaultOrientation: 'portrait',
  autoDownloadPdf: false,
}

export interface ConversationMeta {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  preview: string
}

// ── Interfaz abstracta (preparada para Firestore futuro) ────

export interface IChatStorage {
  getConversations(): ConversationMeta[]
  getConversation(id: string): Conversation | null
  saveConversation(conversation: Conversation): void
  deleteConversation(id: string): void
  clearAllConversations(): void
  getSettings(): UserSettings
  saveSettings(settings: Partial<UserSettings>): void
}

// ── Implementación localStorage ─────────────────────────────

const CONVERSATIONS_KEY = 'moldeia-conversations'
const SETTINGS_KEY = 'moldeia-settings'

class LocalChatStorage implements IChatStorage {
  private readConversationsMap(): Record<string, Conversation> {
    if (typeof window === 'undefined') return {}
    try {
      const raw = localStorage.getItem(CONVERSATIONS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  private writeConversationsMap(map: Record<string, Conversation>): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(map))
  }

  getConversations(): ConversationMeta[] {
    const map = this.readConversationsMap()
    return Object.values(map)
      .map(({ id, title, createdAt, updatedAt, preview }) => ({
        id,
        title,
        createdAt,
        updatedAt,
        preview,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  getConversation(id: string): Conversation | null {
    const map = this.readConversationsMap()
    return map[id] ?? null
  }

  saveConversation(conversation: Conversation): void {
    const map = this.readConversationsMap()
    const cleaned: Conversation = {
      ...conversation,
      messages: conversation.messages.map(({ imageUrl: _, ...rest }) => rest),
    }
    map[conversation.id] = cleaned
    this.writeConversationsMap(map)
  }

  deleteConversation(id: string): void {
    const map = this.readConversationsMap()
    delete map[id]
    this.writeConversationsMap(map)
  }

  clearAllConversations(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(CONVERSATIONS_KEY)
  }

  getSettings(): UserSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (!raw) return { ...DEFAULT_SETTINGS }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  saveSettings(settings: Partial<UserSettings>): void {
    if (typeof window === 'undefined') return
    const current = this.getSettings()
    const merged = { ...current, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
  }
}

// ── Singleton ───────────────────────────────────────────────

export const chatStorage: IChatStorage = new LocalChatStorage()

// ── Welcome message ─────────────────────────────────────────

export const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Hola! Soy **MoldeGPT** 🪅\n\nEnvíame la foto de tu piñata y yo me encargo de crear el molde listo para imprimir.\n\n📷 Arrastra una imagen aquí, pégala, o usa el botón de foto.',
}

// ── Helpers ─────────────────────────────────────────────────

export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function generateTitle(messages: Message[]): string {
  const firstUserMsg = messages.find((m) => m.role === 'user')
  if (!firstUserMsg || !firstUserMsg.content) return 'Nueva conversación'

  const text = firstUserMsg.content.replace(/📷\s*Imagen enviada/g, '').trim()
  if (!text) return '📷 Conversación con imagen'

  return text.length > 50 ? text.slice(0, 47) + '…' : text
}

export function generatePreview(messages: Message[]): string {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.content)
  if (lastAssistant?.content) {
    const clean = lastAssistant.content.replace(/\*\*/g, '').replace(/\n/g, ' ').trim()
    return clean.length > 80 ? clean.slice(0, 77) + '…' : clean
  }
  return 'Sin respuesta aún'
}
