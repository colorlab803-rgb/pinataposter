'use client'

import { useEffect, useState } from 'react'
import { LifeBuoy, Mail, Copy, Check, X } from 'lucide-react'

const SUPPORT_EMAIL = 'rickying0328@gmail.com'
const STORAGE_KEY = 'pinataposter:payment-support-notice-v1'

const SUPPORT_SUBJECT = 'Reporte de pago no activado - PiñataPoster'
const SUPPORT_BODY = `Hola, realicé mi pago anual de PiñataPoster pero mi acceso de 12 meses no se activó automáticamente. Adjunto los datos para que lo activen manualmente:

- Nombre completo:
- Correo con el que estoy registrado:
- Fecha y hora aproximada del pago:
- Comprobante de pago (adjunto):

Gracias.`

export function PaymentSupportAnnouncementModal() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY)
      if (!dismissed) {
        const t = setTimeout(() => setOpen(true), 1200)
        return () => clearTimeout(t)
      }
    } catch {
      setOpen(true)
    }
  }, [])

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    SUPPORT_SUBJECT
  )}&body=${encodeURIComponent(SUPPORT_BODY)}`

  function dismissForever() {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch {}
    setOpen(false)
  }

  function closeOnce() {
    setOpen(false)
  }

  function copyEmail() {
    navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-6 overflow-y-auto">
      <div className="max-w-lg w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-400/30 shadow-2xl shadow-amber-500/20 overflow-hidden relative my-auto">
        <button
          onClick={closeOnce}
          aria-label="Cerrar"
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-400/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center ring-1 ring-amber-400/30">
              <LifeBuoy className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Aviso importante de soporte</h2>
              <p className="text-xs text-amber-200/80">
                Léelo si pagaste y tu acceso no se activó
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-amber-100 leading-relaxed">
            Si <strong className="text-white">ya realizaste tu pago anual de $50 MXN</strong> (hoy
            o en días pasados) y tu acceso de <strong className="text-white">12 meses</strong> no
            se activó automáticamente,{' '}
            <strong className="text-white">no necesitas pagar de nuevo</strong>. Repórtalo a
            nuestro correo de soporte y activamos tu acceso manualmente.
          </p>

          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-300" />
              <p className="text-sm font-semibold text-white">
                Envíanos un correo a:
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/60 border border-amber-400/20 px-3 py-2">
              <code className="text-sm font-mono text-amber-200 break-all">
                {SUPPORT_EMAIL}
              </code>
              <button
                onClick={copyEmail}
                className="shrink-0 inline-flex items-center gap-1 rounded-md border border-amber-400/30 px-2 py-1 text-[11px] font-medium text-amber-100 hover:bg-amber-400/10 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-semibold text-amber-100">Incluye estos datos:</p>
              <ul className="space-y-1 text-xs text-amber-100/85 pl-1">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-300" />
                  <span>Tu nombre completo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-300" />
                  <span>El correo con el que estás registrado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-300" />
                  <span>Fecha y hora aproximada de tu pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-300" />
                  <span>Comprobante de pago (captura o PDF)</span>
                </li>
              </ul>
            </div>
          </div>

          <a
            href={mailto}
            onClick={dismissForever}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-orange-400 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Mail className="h-4 w-4" />
            Abrir correo y reportar mi pago
          </a>

          <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-white/5">
            <button
              onClick={dismissForever}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-purple-200 hover:bg-white/10 transition-colors"
            >
              Entendido, no volver a mostrar
            </button>
            <button
              onClick={closeOnce}
              className="flex-1 rounded-lg px-3 py-2 text-xs text-purple-300/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cerrar (mostrar de nuevo)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
