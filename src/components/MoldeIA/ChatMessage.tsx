import { Bot, User } from 'lucide-react'
import { AgentAction } from './AgentAction'

interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-purple-600 text-white'
            : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Contenido */}
      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Texto */}
        {message.content && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-purple-600 text-white rounded-tr-sm'
                : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/10'
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.toolCalls.map((tc, i) => (
              <AgentAction key={i} name={tc.name} args={tc.args} status="done" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
