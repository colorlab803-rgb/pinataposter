'use client'

import { useState, useMemo } from 'react'
import { SquarePen, Search, Trash2, MessageSquare, X, PanelLeftClose } from 'lucide-react'
import { type ConversationMeta } from '@/lib/chatStorage'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatSidebarProps {
  conversations: ConversationMeta[]
  activeId: string | null
  isOpen: boolean
  onClose: () => void
  onNewConversation: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onOpenSettings: () => void
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return new Date(timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

// Agrupa conversaciones por período
function groupConversations(conversations: ConversationMeta[]) {
  const now = Date.now()
  const today: ConversationMeta[] = []
  const yesterday: ConversationMeta[] = []
  const thisWeek: ConversationMeta[] = []
  const older: ConversationMeta[] = []

  for (const c of conversations) {
    const diff = now - c.updatedAt
    const days = diff / 86400000
    if (days < 1) today.push(c)
    else if (days < 2) yesterday.push(c)
    else if (days < 7) thisWeek.push(c)
    else older.push(c)
  }

  const groups: { label: string; items: ConversationMeta[] }[] = []
  if (today.length) groups.push({ label: 'Hoy', items: today })
  if (yesterday.length) groups.push({ label: 'Ayer', items: yesterday })
  if (thisWeek.length) groups.push({ label: 'Esta semana', items: thisWeek })
  if (older.length) groups.push({ label: 'Anteriores', items: older })
  return groups
}

export function ChatSidebar({
  conversations,
  activeId,
  isOpen,
  onClose,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenSettings,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
    )
  }, [conversations, search])

  const groups = useMemo(() => groupConversations(filtered), [filtered])

  const handleDelete = (id: string) => {
    if (deletingId === id) {
      onDeleteConversation(id)
      setDeletingId(null)
    } else {
      setDeletingId(id)
      setTimeout(() => setDeletingId(null), 3000)
    }
  }

  const sidebarContent = (
    <div className="h-full w-[260px] bg-[#171717] flex flex-col">
      {/* Top nav */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
          title="Cerrar sidebar"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            onNewConversation()
            if (window.innerWidth < 768) onClose()
          }}
          className="p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
          title="Nuevo chat"
        >
          <SquarePen className="h-5 w-5" />
        </button>
      </div>

      {/* Nav items */}
      <div className="px-2 py-2 flex-shrink-0 space-y-0.5">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Buscar chats</span>
        </button>
      </div>

      {/* Search input */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-2 overflow-hidden flex-shrink-0"
          >
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Buscar…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-8 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setSearchOpen(false) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <MessageSquare className="h-8 w-8 text-white/10 mb-2" />
            <p className="text-xs text-white/30">
              {search ? 'Sin resultados' : 'Sin conversaciones'}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 py-1.5 text-xs font-medium text-white/30">
                {group.label}
              </p>
              {group.items.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id)
                    if (window.innerWidth < 768) onClose()
                  }}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    activeId === conv.id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/80 truncate leading-snug">
                      {conv.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/20 flex-shrink-0 group-hover:hidden">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(conv.id)
                    }}
                    className={`flex-shrink-0 p-0.5 rounded transition-colors hidden group-hover:block ${
                      deletingId === conv.id
                        ? 'text-red-400'
                        : 'text-white/30 hover:text-red-400'
                    }`}
                    title={deletingId === conv.id ? 'Confirmar' : 'Eliminar'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/5 flex-shrink-0">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
            M
          </div>
          <span className="truncate">MoldeIA</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop móvil */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop: sidebar estático */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="hidden md:block h-full overflow-hidden flex-shrink-0"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile: overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 h-full z-50 md:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
