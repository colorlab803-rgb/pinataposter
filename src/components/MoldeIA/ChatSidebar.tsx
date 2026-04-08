'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Trash2, MessageSquare, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes}m`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7) return `Hace ${days}d`
  return new Date(timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export function ChatSidebar({
  conversations,
  activeId,
  isOpen,
  onClose,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
    )
  }, [conversations, search])

  const handleDelete = (id: string) => {
    if (deletingId === id) {
      onDeleteConversation(id)
      setDeletingId(null)
    } else {
      setDeletingId(id)
      setTimeout(() => setDeletingId(null), 3000)
    }
  }

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

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed md:relative top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white/80">Conversaciones</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-7 w-7 text-white/40 hover:text-white md:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={onNewConversation}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm h-9 rounded-lg mb-2"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nueva conversación
              </Button>

              {/* Búsqueda */}
              {conversations.length > 3 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <input
                    type="text"
                    placeholder="Buscar…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              )}
            </div>

            {/* Lista de conversaciones */}
            <div className="flex-1 overflow-y-auto py-1.5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <MessageSquare className="h-10 w-10 text-white/10 mb-3" />
                  <p className="text-sm text-white/30">
                    {search ? 'Sin resultados' : 'Aún no hay conversaciones'}
                  </p>
                  {!search && (
                    <p className="text-xs text-white/20 mt-1">
                      Envía un mensaje para comenzar
                    </p>
                  )}
                </div>
              ) : (
                filtered.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id)
                      onClose()
                    }}
                    className={`group mx-1.5 mb-0.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      activeId === conv.id
                        ? 'bg-purple-600/20 border border-purple-500/30'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/90 font-medium truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-white/40 truncate mt-0.5">
                          {conv.preview}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-white/20" />
                          <span className="text-[10px] text-white/20">
                            {formatRelativeTime(conv.updatedAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(conv.id)
                        }}
                        className={`flex-shrink-0 p-1 rounded transition-colors ${
                          deletingId === conv.id
                            ? 'text-red-400 bg-red-500/20'
                            : 'text-white/20 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                        title={deletingId === conv.id ? 'Clic para confirmar' : 'Eliminar'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {conversations.length > 0 && (
              <div className="p-3 border-t border-white/10 flex-shrink-0">
                <p className="text-[10px] text-white/20 text-center">
                  {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
                </p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
