import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Generador de Moldes para Piñatas - Divide e Imprime en Tamaño Real',
  description:
    'Sube tu imagen, define el tamaño en centímetros y descarga un PDF dividido en hojas carta, oficio, tabloide, A4 o A3. Sin marca de agua. Ideal para moldes de piñatas, patrones y pósters.',
  alternates: {
    canonical: '/generator',
  },
  openGraph: {
    title: 'Generador de Moldes para Piñatas - PiñataPoster',
    description:
      'Crea moldes de piñatas en tamaño real. Sube tu diseño, elige el tamaño y descarga un PDF listo para imprimir.',
    url: 'https://pinataposter.com/generator',
  },
}

export default function GeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
