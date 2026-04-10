import { Bot, Download } from 'lucide-react'
import { AgentAction } from './AgentAction'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'

interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  toolCalls?: ToolCall[]
  toolCallsStatus?: 'running' | 'done'
  quickActions?: QuickAction[]
}

export interface QuickAction {
  label: string
  message: string
}

interface ChatMessageProps {
  message: Message
  isLast?: boolean
  onDownloadRequest?: (format: 'pdf' | 'zip') => void
  onQuickAction?: (text: string) => void
}

export function ChatMessage({ message, isLast, onDownloadRequest, onQuickAction }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const downloadToolCall = message.toolCalls?.find(
    (tc) => tc.name === 'descargarMolde' && message.toolCallsStatus === 'done'
  )

  const showQuickActions = isLast && !isUser && message.quickActions && message.quickActions.length > 0
    && message.toolCallsStatus !== 'running'

  return (
    <div className={`py-2 ${isUser ? 'flex justify-end' : ''}`}>
      <div className={`${isUser ? 'max-w-[80%]' : 'w-full'}`}>
        {/* User message — burbuja alineada a la derecha */}
        {isUser && (
          <div className="flex flex-col items-end gap-2">
            {message.imageUrl && (
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden border border-white/10">
                <Image
                  src={message.imageUrl}
                  alt="Imagen enviada"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            {message.content && (
              <div className="bg-[#2f2f2f] text-white px-4 py-2.5 rounded-3xl text-[15px] leading-relaxed">
                {message.content}
              </div>
            )}
          </div>
        )}

        {/* Assistant message — sin burbuja, con ícono */}
        {!isUser && (
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-0.5">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              {/* Tool calls */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {message.toolCalls.map((tc, i) => (
                    <AgentAction
                      key={i}
                      name={tc.name}
                      args={tc.args}
                      status={message.toolCallsStatus ?? 'done'}
                    />
                  ))}
                </div>
              )}

              {/* Text */}
              {message.content && (
                <div className="text-[15px] leading-relaxed text-white/90 prose-invert">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-white/80">{children}</li>,
                      code: ({ children }) => (
                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-purple-300">{children}</code>
                      ),
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline hover:text-purple-300">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Download button */}
              {downloadToolCall && onDownloadRequest && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onDownloadRequest((downloadToolCall.args.formato as 'pdf' | 'zip') || 'pdf')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                  >
                    <Download className="h-4 w-4" />
                    Descargar {String((downloadToolCall.args.formato as string) || 'pdf').toUpperCase()}
                  </button>
                </div>
              )}

              {/* Quick action buttons */}
              {showQuickActions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.quickActions!.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => onQuickAction?.(action.message)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-purple-500/30 text-purple-300 hover:bg-purple-500/15 hover:border-purple-500/50 hover:text-purple-200 transition-all"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Image from assistant */}
              {message.imageUrl && (
                <div className="relative w-52 h-52 rounded-2xl overflow-hidden border border-white/10 mt-2">
                  <Image
                    src={message.imageUrl}
                    alt="Imagen"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
