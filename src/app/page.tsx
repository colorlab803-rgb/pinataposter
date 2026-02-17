import { Scissors } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg mx-auto">
          <Scissors className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          PiñataPoster
        </h1>
        <div className="space-y-2">
          <p className="text-lg text-purple-200">
            🔧 Página en reparación
          </p>
          <p className="text-sm text-purple-300/60">
            Estamos trabajando para mejorar tu experiencia. Volvemos pronto.
          </p>
        </div>
      </div>
    </div>
  )
}
