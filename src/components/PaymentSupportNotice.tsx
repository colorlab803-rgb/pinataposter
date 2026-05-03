'use client'

import { LifeBuoy, MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '524493468117'
const WHATSAPP_DISPLAY = '449 346 8117'

const WHATSAPP_MESSAGE = `Hola, realicé mi pago anual de PiñataPoster pero mi acceso de 12 meses no se activó automáticamente. Adjunto comprobante y mis datos:

- Nombre completo:
- Correo registrado:
- Fecha y hora del pago:
- (Adjunto comprobante de pago)`

interface PaymentSupportNoticeProps {
  variant?: 'card' | 'compact' | 'inline'
  className?: string
}

export function PaymentSupportNotice({
  variant = 'card',
  className = '',
}: PaymentSupportNoticeProps) {
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

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
              Escríbenos por WhatsApp al{' '}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-amber-200 underline decoration-dotted underline-offset-2 hover:text-white"
              >
                {WHATSAPP_DISPLAY}
              </a>{' '}
              con tu nombre, correo registrado, fecha y hora del pago y{' '}
              <strong className="text-amber-200">comprobante de pago (obligatorio)</strong>.
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
        ¿Pagaste y no se activó tu acceso? Repórtalo por WhatsApp al{' '}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-amber-200 underline decoration-dotted underline-offset-2 hover:text-white"
        >
          {WHATSAPP_DISPLAY}
        </a>{' '}
        con tu nombre, correo, fecha del pago y comprobante.{' '}
        <strong className="text-red-300">No se responde sin comprobante.</strong>
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
              No te preocupes. Repórtalo por WhatsApp y activamos tu acceso manualmente. Envía tu{' '}
              <strong className="text-amber-100">comprobante de pago</strong> junto con estos datos:
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
              <strong className="text-amber-200">Comprobante de pago (captura o PDF) — obligatorio</strong>
            </li>
          </ul>

          {/* Aviso de comprobante obligatorio */}
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2">
            <p className="text-xs font-semibold text-red-300">
              ⚠️ No se responderá el WhatsApp si no se envía comprobante de pago.
            </p>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600/90 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-500"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Escribir por WhatsApp ({WHATSAPP_DISPLAY})
          </a>
        </div>
      </div>
    </div>
  )
}
