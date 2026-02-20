'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Scissors, ArrowRight, Check, Star, Sparkles, Package,
  Shield, Loader2, Zap, CreditCard, HelpCircle
} from 'lucide-react'

interface PackOption {
  id: string
  name: string
  credits: number
  price: string
  priceMXN: number
  perDesign: string
  priceEnvKey: string
  popular?: boolean
  savings?: string
}

const packs: PackOption[] = [
  { id: 'pack_5', name: '5 diseños', credits: 5, price: '$25', priceMXN: 25, perDesign: '$5.00/diseño', priceEnvKey: 'pack_5' },
  { id: 'pack_15', name: '15 diseños', credits: 15, price: '$65', priceMXN: 65, perDesign: '$4.33/diseño', priceEnvKey: 'pack_15', popular: true, savings: 'Ahorra 13%' },
  { id: 'pack_50', name: '50 diseños', credits: 50, price: '$199', priceMXN: 199, perDesign: '$3.98/diseño', priceEnvKey: 'pack_50', savings: 'Ahorra 20%' },
]

export function PricingPage() {
  const { data: session } = useSession()
  const [loadingPack, setLoadingPack] = useState<string | null>(null)

  const handleCheckout = async (priceEnvKey: string) => {
    if (!session) {
      signIn('google')
      return
    }

    setLoadingPack(priceEnvKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceEnvKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error('Error', { description: data.error })
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error('Error', { description: 'No se pudo iniciar el pago.' })
    } finally {
      setLoadingPack(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white">PiñataPoster</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/generator" className="text-sm text-purple-300 hover:text-white transition-colors hidden sm:inline">
              Crear diseño
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-12 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs sm:text-sm">
              <CreditCard className="h-3.5 w-3.5" />
              Sin suscripciones · Paga una vez
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              Precios simples y{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                transparentes
              </span>
            </h1>
            <p className="text-base sm:text-lg text-purple-200 max-w-xl mx-auto">
              Prueba gratis. Compra créditos solo cuando los necesites. Los créditos nunca expiran.
            </p>
          </div>
        </section>

        {/* Comparativa Gratis vs Créditos */}
        <section className="pb-8 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-5 sm:p-6">
              <h3 className="font-semibold text-white text-lg mb-3">Gratis</h3>
              <div className="text-3xl font-bold text-white mb-4">$0</div>
              <ul className="space-y-2.5 text-sm text-purple-300">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  1 diseño por día
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Todas las funciones del editor
                </li>
                <li className="flex items-start gap-2 opacity-50">
                  <span className="h-4 w-4 mt-0.5 flex-shrink-0 text-center">×</span>
                  Con marca de agua
                </li>
                <li className="flex items-start gap-2 opacity-50">
                  <span className="h-4 w-4 mt-0.5 flex-shrink-0 text-center">×</span>
                  Sin mejora de calidad
                </li>
              </ul>
              <Link
                href="/generator"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-colors"
              >
                Probar gratis
              </Link>
            </div>

            <div className="rounded-xl bg-purple-500/10 border-2 border-purple-500/40 p-5 sm:p-6">
              <h3 className="font-semibold text-purple-300 text-lg mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Con créditos
              </h3>
              <div className="text-3xl font-bold text-white mb-4">
                Desde <span className="text-purple-400">$25</span>
              </div>
              <ul className="space-y-2.5 text-sm text-purple-200">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Sin marca de agua
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Mejora de calidad con AI (upscale)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Los créditos nunca expiran
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Sin suscripciones
                </li>
              </ul>
              <a
                href="#packs"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                Ver packs
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Packs de diseños */}
        <section className="py-12 sm:py-16 px-4 sm:px-6" id="packs">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
              Elige tu pack
            </h2>
            <p className="text-purple-300 text-center mb-10 max-w-md mx-auto">
              Cada crédito = 1 diseño sin marca de agua + mejora de calidad incluida
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative rounded-2xl p-6 text-center transition-all hover:shadow-xl ${
                    pack.popular
                      ? 'border-2 border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10 scale-[1.02]'
                      : 'border border-white/10 bg-white/5 hover:border-purple-500/30'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-lg">
                      <Star className="h-3 w-3" /> Más popular
                    </div>
                  )}

                  <div className="text-4xl font-bold text-white mt-2">{pack.credits}</div>
                  <div className="text-sm text-purple-300 mb-4">diseños</div>

                  <div className="text-3xl font-bold text-white">{pack.price}</div>
                  <div className="text-xs text-purple-300/70 mb-1">MXN</div>
                  <div className="text-sm text-purple-400 font-medium">{pack.perDesign}</div>
                  {pack.savings && (
                    <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                      <Zap className="h-3 w-3" />
                      {pack.savings}
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      onClick={() => handleCheckout(pack.priceEnvKey)}
                      disabled={loadingPack === pack.priceEnvKey}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 ${
                        pack.popular
                          ? 'text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20'
                          : 'text-white bg-white/10 hover:bg-white/20 border border-white/10'
                      }`}
                    >
                      {loadingPack === pack.priceEnvKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {session ? 'Comprar ahora' : 'Iniciar sesión para comprar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona la compra */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-black/20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
              ¿Cómo funciona?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Elige tu pack', desc: 'Selecciona el pack de diseños que mejor se adapte a tus necesidades.', icon: Package },
                { step: '2', title: 'Paga con Stripe', desc: 'Pago seguro con tarjeta de crédito/débito. Sin crear cuenta extra.', icon: CreditCard },
                { step: '3', title: 'Usa tus créditos', desc: 'Tus créditos aparecen al instante. Descarga sin marca de agua y en alta calidad.', icon: Sparkles },
              ].map((item) => (
                <div key={item.step} className="relative text-center p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-purple-500 text-white text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <item.icon className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-purple-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ de precios */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10 flex items-center justify-center gap-2">
              <HelpCircle className="h-7 w-7 text-purple-400" />
              Preguntas frecuentes
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: '¿Los créditos expiran?',
                  a: 'No. Los créditos que compras son permanentes y puedes usarlos cuando quieras. Sin prisa, sin presión.',
                },
                {
                  q: '¿Qué incluye cada crédito?',
                  a: 'Cada crédito te permite descargar 1 diseño sin marca de agua con mejora de calidad de imagen mediante inteligencia artificial (upscale). Obtienes un PDF listo para imprimir en la mejor calidad posible.',
                },
                {
                  q: '¿Puedo seguir usando PiñataPoster gratis?',
                  a: 'Sí. Puedes crear 1 diseño gratis por día con acceso a todas las herramientas del editor. Las descargas gratuitas incluyen marca de agua y no tienen mejora de calidad.',
                },
                {
                  q: '¿Qué métodos de pago aceptan?',
                  a: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) a través de Stripe, la plataforma de pagos más segura del mundo. No almacenamos datos de tu tarjeta.',
                },
                {
                  q: '¿Hay reembolsos?',
                  a: 'Si no has utilizado tus créditos y necesitas un reembolso, contáctanos y lo resolveremos. Tu satisfacción es importante.',
                },
                {
                  q: '¿Es una suscripción?',
                  a: 'No. PiñataPoster funciona con packs de pago único. Compras una vez y usas tus créditos cuando quieras. Sin cobros recurrentes ni sorpresas.',
                },
              ].map((item, i) => (
                <details key={i} className="group rounded-xl bg-white/5 border border-white/10">
                  <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer text-white font-medium text-sm sm:text-base">
                    {item.q}
                    <span className="text-purple-400 transition-transform group-open:rotate-45 text-lg ml-4 flex-shrink-0">+</span>
                  </summary>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-purple-300 -mt-1">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Garantías */}
        <section className="pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Shield className="h-5 w-5 text-green-400" />
                Pago 100% seguro con Stripe
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Package className="h-5 w-5 text-purple-400" />
                Los créditos nunca expiran
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Sin suscripciones ni cargos ocultos
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 text-center bg-black/20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              ¿Listo para crear tu piñata?
            </h2>
            <p className="text-purple-300 mb-6">
              Empieza gratis y mejora cuando lo necesites.
            </p>
            <Link
              href="/generator"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-2xl shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
            >
              Empezar ahora — es gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-white/10 py-6 px-4 text-center">
          <p className="text-xs text-purple-300/40">
            © {new Date().getFullYear()} PiñataPoster. Hecho con ❤️ para la comunidad piñatera.
          </p>
        </footer>
      </main>
    </div>
  )
}
