import Link from 'next/link'
import { Scissors, ArrowRight, FileDown, Layers, Ruler } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PiñataPoster</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Imprime imágenes{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                a gran escala
              </span>
            </h1>
            <p className="text-lg md:text-xl text-purple-200 max-w-lg mx-auto">
              Divide cualquier imagen en hojas imprimibles. Ideal para pósters, piñatas, patrones y manualidades.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
              <Layers className="h-6 w-6 text-purple-400" />
              <span className="text-sm text-purple-200">Divide en hojas</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
              <Ruler className="h-6 w-6 text-cyan-400" />
              <span className="text-sm text-purple-200">Tamaño exacto</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
              <FileDown className="h-6 w-6 text-pink-400" />
              <span className="text-sm text-purple-200">PDF listo</span>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-2xl shadow-purple-500/25 transition-all hover:scale-105"
          >
            Crear Póster
            <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="text-sm text-purple-300/60">
            Carta · Oficio · Tabloide · A4 · A3
          </p>
        </div>
      </main>
    </div>
  )
}