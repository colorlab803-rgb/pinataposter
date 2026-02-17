import Link from 'next/link'
import { Scissors, ArrowRight, FileDown, Layers, Ruler, Star, Sparkles, Check, Package, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PiñataPoster',
    url: 'https://pinataposter.com',
    description: 'Herramienta para piñateros: imprime moldes y diseños de piñatas en tamaño real divididos en hojas carta, oficio o tabloide.',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'MXN',
      lowPrice: '0',
      highPrice: '199',
      offerCount: '4',
    },
    creator: {
      '@type': 'Person',
      name: 'Ricardo Hernández',
    },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cómo imprimo un molde de piñata en tamaño real?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sube tu diseño a PiñataPoster, define el tamaño real en centímetros (por ejemplo 80 cm de alto) y la herramienta divide la imagen automáticamente en hojas tamaño carta u oficio. Descarga el PDF, imprime, recorta y pega las hojas para obtener tu molde a escala real.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo usar PiñataPoster gratis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, puedes crear 1 diseño gratis por día con marca de agua. Para descargar sin marca de agua y con mejora de calidad de imagen, puedes adquirir packs de diseños desde $25 MXN.',
        },
      },
      {
        '@type': 'Question',
        name: '¿En qué tamaños de papel puedo imprimir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PiñataPoster soporta hojas Carta, Oficio, Tabloide, A4 y A3, tanto en orientación vertical como horizontal. Incluye líneas de corte, sangrado y plano de armado para facilitar el ensamblaje.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Los créditos de diseños expiran?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, los créditos que compras nunca expiran. Cada crédito te permite descargar un diseño sin marca de agua con mejora de calidad incluida.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white">PiñataPoster</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/generator" className="text-sm text-purple-300 hover:text-white transition-colors hidden sm:inline">
              Crear diseño
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] px-4 sm:px-6 text-center safe-area-padding">
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs sm:text-sm mb-2">
                <Zap className="h-3.5 w-3.5" />
                La herramienta favorita de los piñateros
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white leading-tight">
                Imprime tus moldes de piñata{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  en tamaño real
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-purple-200 max-w-xl mx-auto">
                Sube tu diseño, define el tamaño y descarga un PDF dividido en hojas listas para imprimir, recortar y armar. Sin programas complicados.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto">
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                <span className="text-xs sm:text-sm text-purple-200">Divide en hojas</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                <Ruler className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                <span className="text-xs sm:text-sm text-purple-200">Tamaño exacto</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                <FileDown className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" />
                <span className="text-xs sm:text-sm text-purple-200">PDF listo</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/generator"
                className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-2xl shadow-purple-500/25 transition-all hover:scale-105 active:scale-95 touch-target"
              >
                Crear mi molde gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-xs sm:text-sm text-purple-300/60">
                1 diseño gratis al día · Sin registro obligatorio para probar
              </p>
            </div>

            <p className="text-xs sm:text-sm text-purple-300/60">
              Carta · Oficio · Tabloide · A4 · A3
            </p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="relative py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
              ¿Cómo funciona?
            </h2>
            <p className="text-purple-300 text-center mb-10 sm:mb-14 max-w-lg mx-auto">
              En 3 pasos simples, tu molde pasa de la pantalla al tamaño real
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { step: '1', title: 'Sube tu diseño', desc: 'Carga la imagen de tu piñata, personaje o patrón en JPG o PNG.', icon: '📷' },
                { step: '2', title: 'Define el tamaño', desc: 'Pon las medidas reales en centímetros. Ej: 80 cm de alto para una piñata mediana.', icon: '📐' },
                { step: '3', title: 'Imprime y arma', desc: 'Descarga el PDF, imprime en hojas normales, recorta por las guías y pega.', icon: '🖨️' },
              ].map((item) => (
                <div key={item.step} className="relative text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-purple-500 text-white text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-purple-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Casos de uso */}
        <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-black/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
              Perfecto para piñateros y creativos
            </h2>
            <p className="text-purple-300 text-center mb-10 sm:mb-14 max-w-lg mx-auto">
              Miles de personas ya usan PiñataPoster para sus proyectos
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { emoji: '🪅', title: 'Piñatas', desc: 'Imprime moldes de personajes a escala real para tus piñatas' },
                { emoji: '🎨', title: 'Manualidades', desc: 'Patrones grandes para proyectos escolares y decoración' },
                { emoji: '🖼️', title: 'Pósters', desc: 'Fotos y diseños en gran formato sin impresora especial' },
                { emoji: '📏', title: 'Patrones', desc: 'Moldes de costura, carpintería o cualquier proyecto a escala' },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                  <div className="text-2xl mb-2">{item.emoji}</div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-purple-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Precios transparentes */}
        <section className="relative py-16 sm:py-24 px-4 sm:px-6" id="precios">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
              Precios simples y transparentes
            </h2>
            <p className="text-purple-300 text-center mb-10 sm:mb-14 max-w-lg mx-auto">
              Prueba gratis. Compra créditos solo cuando los necesites. Sin suscripciones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
              {/* Plan Gratis */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                <h3 className="font-semibold text-white text-lg mb-1">Gratis</h3>
                <div className="text-3xl font-bold text-white mb-1">$0</div>
                <p className="text-xs text-purple-300 mb-4">por siempre</p>
                <ul className="text-xs text-purple-300 space-y-2 text-left">
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> 1 diseño por día</li>
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> Todas las funciones</li>
                  <li className="flex items-start gap-2 opacity-50">× Marca de agua</li>
                  <li className="flex items-start gap-2 opacity-50">× Sin mejora de calidad</li>
                </ul>
              </div>

              {/* Pack 5 */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                <h3 className="font-semibold text-white text-lg mb-1">5 diseños</h3>
                <div className="text-3xl font-bold text-white mb-1">$25</div>
                <p className="text-xs text-purple-300 mb-1">MXN</p>
                <p className="text-xs text-purple-400 font-medium mb-4">$5.00/diseño</p>
                <ul className="text-xs text-purple-300 space-y-2 text-left">
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> Sin marca de agua</li>
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> Mejora de calidad (AI)</li>
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> No expiran</li>
                </ul>
              </div>

              {/* Pack 15 - Popular */}
              <div className="relative p-6 rounded-xl bg-purple-500/10 border-2 border-purple-500 text-center shadow-lg shadow-purple-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" /> Más popular
                </div>
                <h3 className="font-semibold text-white text-lg mb-1">15 diseños</h3>
                <div className="text-3xl font-bold text-white mb-1">$65</div>
                <p className="text-xs text-purple-300 mb-1">MXN</p>
                <p className="text-xs text-purple-400 font-medium mb-4">$4.33/diseño</p>
                <ul className="text-xs text-purple-300 space-y-2 text-left">
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> Sin marca de agua</li>
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> Mejora de calidad (AI)</li>
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> No expiran</li>
                </ul>
              </div>

              {/* Pack 50 */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                <h3 className="font-semibold text-white text-lg mb-1">50 diseños</h3>
                <div className="text-3xl font-bold text-white mb-1">$199</div>
                <p className="text-xs text-purple-300 mb-1">MXN</p>
                <p className="text-xs text-purple-400 font-medium mb-4">$3.98/diseño</p>
                <ul className="text-xs text-purple-300 space-y-2 text-left">
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> Sin marca de agua</li>
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> Mejora de calidad (AI)</li>
                  <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" /> No expiran</li>
                  <li className="flex items-start gap-2"><Sparkles className="h-3.5 w-3.5 text-purple-400 mt-0.5 flex-shrink-0" /> Mejor precio</li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-6">
              <Link
                href="/generator"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                Empezar gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-purple-300/50 mt-3">
                Los créditos nunca expiran · Pago seguro con Stripe · Sin suscripciones
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-black/20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10 sm:mb-14">
              Preguntas frecuentes
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: '¿Cómo imprimo un molde de piñata en tamaño real?',
                  a: 'Sube tu diseño a PiñataPoster, define el tamaño real en centímetros (por ejemplo 80 cm de alto) y la herramienta divide la imagen automáticamente en hojas tamaño carta u oficio. Descarga el PDF, imprime, recorta por las guías y pega las hojas.',
                },
                {
                  q: '¿Puedo usar PiñataPoster gratis?',
                  a: 'Sí. Puedes crear 1 diseño gratis por día con acceso a todas las funciones. Las descargas gratuitas incluyen marca de agua. Para descargar sin marca de agua y con mejora de calidad, adquiere un pack de diseños.',
                },
                {
                  q: '¿En qué tamaños de papel puedo imprimir?',
                  a: 'Soportamos Carta, Oficio, Tabloide, A4 y A3 en orientación vertical u horizontal. Cada hoja incluye guías de corte y sangrado para un armado perfecto.',
                },
                {
                  q: '¿Los créditos de diseños expiran?',
                  a: 'No. Los créditos que compras son permanentes y puedes usarlos cuando quieras. Cada crédito = 1 descarga sin marca de agua + mejora de calidad incluida.',
                },
                {
                  q: '¿Qué formatos de imagen acepta?',
                  a: 'PiñataPoster acepta imágenes en formato JPG y PNG de hasta 50 MB. También incluye herramientas de recorte y autorecorte para preparar tu imagen.',
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

        {/* Footer CTA */}
        <section className="relative py-16 sm:py-20 px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              ¿Listo para crear tu piñata?
            </h2>
            <p className="text-purple-300 mb-6">
              Miles de piñateros ya imprimen sus moldes con PiñataPoster.
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