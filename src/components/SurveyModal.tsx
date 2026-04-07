'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, Send, Heart } from 'lucide-react'

const SURVEY_KEY = 'pinataposter_survey_completed'

type Step = 'question' | 'feedback' | 'thanks'

export function SurveyModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('question')
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    const completed = localStorage.getItem(SURVEY_KEY)
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  async function submitSurvey(likesApp: boolean, feedbackText?: string) {
    try {
      setSending(true)
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likesApp, feedback: feedbackText || null }),
      })
    } catch {
      // Silencioso - no interrumpir la experiencia del usuario
    } finally {
      setSending(false)
      localStorage.setItem(SURVEY_KEY, 'true')
    }
  }

  function handleLike() {
    submitSurvey(true)
    setStep('thanks')
  }

  function handleDislike() {
    setStep('feedback')
  }

  async function handleSubmitFeedback() {
    await submitSurvey(false, feedback)
    setStep('thanks')
  }

  function handleClose() {
    if (step === 'question') {
      localStorage.setItem(SURVEY_KEY, 'true')
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        {step === 'question' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                ¿Te gusta PiñataPoster? 🪅
              </DialogTitle>
              <DialogDescription className="text-center">
                Tu opinión nos ayuda a mejorar
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-4 pt-4">
              <Button
                onClick={handleLike}
                className="flex-1 h-16 text-lg gap-2 bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="h-6 w-6" />
                ¡Sí!
              </Button>
              <Button
                onClick={handleDislike}
                variant="outline"
                className="flex-1 h-16 text-lg gap-2 border-red-500/30 hover:bg-red-500/10"
              >
                <ThumbsDown className="h-6 w-6" />
                No
              </Button>
            </div>
          </>
        )}

        {step === 'feedback' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                ¿Qué te gustaría que mejoráramos? 🤔
              </DialogTitle>
              <DialogDescription className="text-center">
                Cuéntanos cómo podemos hacer PiñataPoster mejor para ti
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Escribe tus sugerencias aquí..."
                className="w-full h-28 px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                onClick={handleSubmitFeedback}
                disabled={sending || !feedback.trim()}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Enviando...' : 'Enviar sugerencia'}
              </Button>
            </div>
          </>
        )}

        {step === 'thanks' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                ¡Gracias! 🎉
              </DialogTitle>
              <DialogDescription className="text-center">
                <span className="flex items-center justify-center gap-1 mt-2">
                  Tu opinión es muy valiosa para nosotros <Heart className="h-4 w-4 text-red-500 inline" />
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center pt-2">
              <Button onClick={() => setOpen(false)} className="gap-2">
                Continuar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
