'use client'

import { motion } from 'framer-motion'
import { PosterGenerator } from '@/components/PosterGenerator'
import { HighDemandGate } from '@/components/HighDemandGate'
import { Scissors, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AdNativeBanner } from '@/components/ads/AdNativeBanner'
import Link from 'next/link'

export default function GeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scissors className="h-4 w-4 text-primary" />
                  </div>
                  <h1 className="text-lg font-bold tracking-tight hidden sm:block">
                    PinataPoster
                  </h1>
                </motion.div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main>
          <HighDemandGate>
            <PosterGenerator />
          </HighDemandGate>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AdNativeBanner />
          </div>
        </main>
      </div>
    </div>
  )
}
