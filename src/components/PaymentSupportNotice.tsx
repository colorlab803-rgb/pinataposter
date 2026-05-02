'use client'

import { LifeBuoy, Mail, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const SUPPORT_EMAIL = 'rickying0328@gmail.com'

const SUPPORT_SUBJECT = 'Reporte de pago no activado - PiñataPoster'
const SUPPORT_BODY = `Hola, realicé mi pago anual de PiñataPoster pero mi acceso de 12 meses no se activó automáticamente. Adjunto los datos para que lo activen manualmente:

- Nombre completo:
- Correo con el que estoy registrado:
- Fecha y hora aproximada del pago:
- Comprobante de pago (adjunto):

Gracias.`

interface PaymentSupportNoticeProps {
  variant?: 'card' | 'compact' | 'inline'
  className?: string
}

export function PaymentSupportNotice({
  variant = 'card',
  className = '',
}: PaymentSupportNoticeProps) {
  const [copied, setCopied] = useState(false)

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    SUPPORT_SUBJECT
  )}&body=${encodeURIComponent(SUPPORT_BODY)}`

  function copyEmail(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (variant === 'compact') {
    return (
      <div
        className={`rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-left ${className}`}
      >
        <div className="flex items-start gap-2">
          <LifeBuoy className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-200">
              ¿Pagaste y tu acceso no se activó?
            </p>
            <p className="text-[11px] leading-relaxed text-amber-100/80">
              Escríbenos a{' '}
              <a
                href={mailto}
                className="font-semibold text-amber-200 underline decoration-dotted underline-offset-2 hover:text-white"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              con tu nombre, correo registrado, fecha y hora aproximada del pago, y comprobante.
              Activamos tu acceso manualmente.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-amber-200/80 leading-relaxed ${className}`}>
        ¿Pagaste y no se activó tu acceso? Repórtalo a{' '}
        <a
          href={mailto}
          className="font-semibold text-amber-200 underline decoration-dotted underline-offset-2 hover:text-white"
        >
          {SUPPORT_EMAIL}
        </a>{' '}
        con tu nombre, correo registrado, fecha y hora del pago y comprobante.
      </p>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 p-4 sm:p-5 text-left shadow-lg shadow-amber-500/5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/30">
          <LifeBuoy className="h-4.5 w-4.5 text-amber-300" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-100">
              ¿Hiciste tu pago y tu acceso de 12 meses no se activó?
            </h3>
            <p className="text-xs leading-relaxed text-amber-100/80">
              No te preocupes. Repórtalo y activamos tu acceso manualmente. Envíanos un correo con
              tu <strong className="text-amber-100">comprobante de pago</strong> e incluye estos
              datos:
            </p>
          </div>

          <ul className="space-y-1 text-xs text-amber-100/85">
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
              <span>Fecha y hora aproximada del pago</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-300" />
              <span>Comprobante de pago (captura o PDF)</span>
            </li>
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href={mailto}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500/90 px-3 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-amber-400"
            >
              <Mail className="h-3.5 w-3.5" />
              Enviar correo a soporte
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-400/30 bg-transparent px-3 py-2 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-400/10"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  ¡Correo copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar {SUPPORT_EMAIL}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
