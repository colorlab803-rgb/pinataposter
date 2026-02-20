import type { Metadata } from 'next'
import { PricingPage } from './PricingPageClient'

export const metadata: Metadata = {
  title: 'Precios',
  description: 'Packs de diseños para PiñataPoster. Sin suscripciones, sin sorpresas. Compra créditos y descarga sin marca de agua con mejora de calidad AI.',
  alternates: { canonical: '/pricing' },
}

export default function Page() {
  return <PricingPage />
}
