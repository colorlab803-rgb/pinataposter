import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { TrackVisit } from '@/components/TrackVisit';

const siteUrl = 'https://pinataposter.com';
const title = 'PiñataPoster - Imprime Moldes y Diseños de Piñatas en Tamaño Real';
const description = 'Herramienta para piñateros: sube tu diseño, elige el tamaño real de tu piñata y descarga un PDF dividido en hojas carta, oficio o tabloide listo para imprimir, recortar y armar. Ideal para moldes de piñatas, patrones a escala y pósters grandes.';
const ogImageUrl = `${siteUrl}/screenshots/desktop.png`;

export const metadata: Metadata = {
  title: {
    default: title,
    template: '%s | PiñataPoster',
  },
  description: description,
  keywords: [
    'moldes de piñatas', 'patrones para piñatas', 'imprimir piñata tamaño real',
    'diseño de piñatas', 'plantillas piñatas', 'piñata poster', 'hacer piñatas',
    'imprimir imagen grande', 'dividir imagen en hojas', 'poster en varias hojas',
    'imprimir molde grande', 'piñatas personalizadas', 'manualidades piñatas',
    'como hacer una piñata', 'molde piñata carta', 'patron piñata PDF',
    'posterizar imagen', 'imprimir poster casero', 'piñatero', 'piñatería',
    'molde piñata tamaño real PDF', 'imprimir patron grande en hojas carta',
    'dividir imagen para imprimir en varias hojas', 'poster casero sin plotter',
    'molde piñata para imprimir', 'herramienta para piñateros',
    'imprimir diseño grande en casa', 'patron costura tamaño real',
    'ampliar imagen para imprimir', 'piñata de Spiderman molde',
    'piñata de número molde', 'molde piñata estrella',
  ],
  authors: [{ name: 'Ricardo Hernández' }],
  creator: 'Ricardo Hernández',
  publisher: 'Ricardo Hernández',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: title,
    description: description,
    siteName: 'PiñataPoster',
    locale: 'es_MX',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'PiñataPoster - Imprime moldes de piñatas en tamaño real',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: title,
    description: description,
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'tools',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#22c55e" />
      </head>
      <body className="font-sans antialiased min-h-screen relative overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <footer className="relative border-t border-white/10 bg-gray-950 px-4 py-4 text-center">
            <p className="text-xs text-gray-400">
              Soporte:{' '}
              <a
                href="mailto:rickying0328@gmail.com"
                className="font-medium text-purple-300 hover:text-white"
              >
                rickying0328@gmail.com
              </a>
            </p>
          </footer>
          <TrackVisit />
          <Toaster 
            theme="dark" 
            position="top-center" 
            toastOptions={{
              style: {
                background: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white'
              }
            }}
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
