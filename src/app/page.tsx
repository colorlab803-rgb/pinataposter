import Link from 'next/link'
import { Scissors, ArrowRight, FileDown, Layers, Ruler, Zap, Store } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DonationBanner } from '@/components/DonationBanner'
import { AdBanner } from '@/components/ads/AdBanner'
import { AdNativeBanner } from '@/components/ads/AdNativeBanner'
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
      '@type': 'Offer',
      priceCurrency: 'MXN',
      price: '0',
      availability: 'https://schema.org/InStock',
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
          text: 'Sí, PiñataPoster es completamente gratis. Puedes usar todas las funciones sin registro, sin pagos y sin marcas de agua.',
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
        name: '¿Qué formatos de descarga ofrece?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PiñataPoster permite descargar en PDF (listo para imprimir con guías de corte y plano de armado) o en ZIP (con cada hoja como imagen individual).',
        },
      },
    ],
  }

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Cómo imprimir un molde de piñata en tamaño real',
    description: 'Guía paso a paso para imprimir moldes de piñatas, patrones y diseños grandes en hojas normales usando PiñataPoster.',
    totalTime: 'PT5M',
    tool: [
      { '@type': 'HowToTool', name: 'Impresora doméstica' },
      { '@type': 'HowToTool', name: 'Tijeras' },
      { '@type': 'HowToTool', name: 'Cinta adhesiva' },
    ],
    supply: [
      { '@type': 'HowToSupply', name: 'Hojas de papel carta, oficio o tabloide' },
    ],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Sube tu diseño',
        text: 'Carga la imagen de tu piñata, personaje o patrón en formato JPG o PNG.',
        url: 'https://pinataposter.com/generator',
      },
      {
        '@type': 'HowToStep',
        name: 'Define el tamaño real',
        text: 'Establece las medidas reales en centímetros. Por ejemplo, 80 cm de alto para una piñata mediana.',
        url: 'https://pinataposter.com/generator',
      },
      {
        '@type': 'HowToStep',
        name: 'Descarga, imprime y arma',
        text: 'Descarga el PDF con guías de corte, imprime en hojas normales, recorta por las líneas y pega las hojas para obtener tu molde a escala real.',
        url: 'https://pinataposter.com/generator',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
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
              Crear molde
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
                100% gratis · Sin registro · Sin marca de agua
              </p>
            </div>
          </div>
        </section>

        {/* Ad Banner - después del hero */}
        <div className="relative px-4 sm:px-6">
          <AdNativeBanner />
        </div>

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

        {/* Catálogo Digital */}
        <section className="relative py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs sm:text-sm mb-4">
              <Store className="h-3.5 w-3.5" />
              Nuevo: Catálogo Digital
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Crea tu catálogo de piñatas online
            </h2>
            <p className="text-purple-300 max-w-lg mx-auto mb-8">
              ¿Eres piñatero o piñatera? Muestra tus creaciones a tus clientes con un catálogo digital profesional y gratuito. Compártelo por WhatsApp y redes sociales.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {[
                { emoji: '🏪', title: 'Tu tienda online', desc: 'Logo, datos, redes sociales' },
                { emoji: '📸', title: 'Fotos de productos', desc: 'Múltiples fotos, precios, tallas' },
                { emoji: '💬', title: 'Contacto directo', desc: 'Botón de WhatsApp integrado' },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl mb-2">{item.emoji}</div>
                  <h3 className="font-semibold text-white text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-purple-300">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link
              href="/auth/registro"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl shadow-2xl shadow-pink-500/25 transition-all hover:scale-105 active:scale-95"
            >
              Crear mi catálogo gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Ad Banner - entre secciones */}
        <div className="relative px-4 sm:px-6">
          <AdBanner />
        </div>

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
                  q: '¿PiñataPoster es gratis?',
                  a: 'Sí, PiñataPoster es completamente gratis. Puedes usar todas las funciones sin registro, sin pagos y sin marcas de agua.',
                },
                {
                  q: '¿En qué tamaños de papel puedo imprimir?',
                  a: 'Soportamos Carta, Oficio, Tabloide, A4 y A3 en orientación vertical u horizontal. Cada hoja incluye guías de corte y sangrado para un armado perfecto.',
                },
                {
                  q: '¿Qué formatos de imagen acepta?',
                  a: 'PiñataPoster acepta imágenes en formato JPG y PNG de hasta 50 MB. También incluye herramientas de recorte y autorecorte para preparar tu imagen.',
                },
                {
                  q: '¿Qué formatos de descarga ofrece?',
                  a: 'PiñataPoster permite descargar en PDF (listo para imprimir con guías de corte y plano de armado) o en ZIP (con cada hoja como imagen individual).',
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

        {/* Ad Banner - antes del footer */}
        <div className="relative px-4 sm:px-6">
          <AdNativeBanner />
        </div>

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
              Empezar ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Donation Banner */}
        <DonationBanner />

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
