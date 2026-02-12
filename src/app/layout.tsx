import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider';

const siteUrl = 'https://pinataposter.com';
const title = 'PiñataPoster - Imprime Imágenes Grandes en Varias Hojas';
const description = 'Divide cualquier imagen para imprimirla a gran escala. Ideal para pósters, piñatas, patrones y manualidades. Sube tu imagen, define el tamaño y descarga el PDF listo para imprimir en hojas tamaño carta, oficio, tabloide y más.';
const ogImageUrl = `${siteUrl}/og-image.png`;

export const metadata: Metadata = {
  title: title,
  description: description,
  keywords: ['imprimir poster', 'dividir imagen', 'imagen gigante', 'piñata', 'manualidades', 'poster en varias hojas', 'imprimir imagen grande', 'posterizar', 'piñata poster', 'seccionar imagen'],
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
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Vista previa de la aplicación PiñataPoster',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: title,
    description: description,
    images: [ogImageUrl],
  },
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
          {children}
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
