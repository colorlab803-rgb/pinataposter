'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Ruler, Download, ArrowRight, X } from 'lucide-react'

const STORAGE_KEY = 'moldeia-onboarding-seen'

const steps = [
  {
    icon: Camera,
    title: 'Sube una foto de tu piñata',
    description: 'Arrastra o selecciona la imagen que quieres convertir en molde.',
  },
  {
    icon: Ruler,
    title: 'Elige el tamaño',
    description: 'La IA te ayudará a elegir las medidas ideales para imprimir.',
  },
  {
    icon: Download,
    title: 'Descarga tu molde',
    description: 'Obtén un PDF listo para imprimir en hojas tamaño carta.',
  },
]

export function ChatOnboarding() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function close() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const isLast = step === steps.length - 1
  const { icon: Icon, title, description } = steps[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#212121] p-6 shadow-2xl"
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20">
              <Icon size={32} className="text-purple-400" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm leading-relaxed text-white/60">{description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step ? 'bg-purple-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <button
            onClick={isLast ? close : () => setStep(step + 1)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            {isLast ? 'Empezar' : 'Siguiente'}
            {!isLast && <ArrowRight size={16} />}
          </button>
          <button
            onClick={close}
            className="text-xs text-white/40 transition hover:text-white/70"
          >
            Omitir
          </button>
        </div>
      </motion.div>
    </div>
  )
}
