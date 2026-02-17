'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PosterGenerator } from '@/components/PosterGenerator'
import { Scissors, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthButton } from '@/components/AuthButton'
import { PricingDialog } from '@/components/PricingDialog'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function GeneratorPage() {
  const { data: session } = useSession()
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [designCredits, setDesignCredits] = useState(0)

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/user')
      const data = await res.json()
      setDesignCredits(data.designCredits ?? 0)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [session, fetchUserData])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-purple-300 hover:bg-white/10"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Volver
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Scissors className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Dividir Imagen</h1>
                    <p className="text-xs text-purple-300">Convierte imágenes en secciones imprimibles</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AuthButton onOpenPricing={() => setIsPricingOpen(true)} designCredits={designCredits} />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PosterGenerator 
              showImageUpload={true}
              showTitle={false}
              onOpenPricing={() => setIsPricingOpen(true)}
            />
          </motion.div>
        </main>
      </div>

      <PricingDialog
        open={isPricingOpen}
        onOpenChange={setIsPricingOpen}
        currentCredits={designCredits}
      />
    </div>
  )
}
