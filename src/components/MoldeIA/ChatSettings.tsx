'use client'

import { useState, useEffect } from 'react'
import { Settings2, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type UserSettings,
  DEFAULT_SETTINGS,
  chatStorage,
} from '@/lib/chatStorage'

interface ChatSettingsProps {
  isOpen: boolean
  onClose: () => void
  onClearHistory: () => void
  onSettingsChange: (settings: UserSettings) => void
}

const PINATA_SIZES = [
  { value: 'mini', label: 'Mini (30-40 cm)' },
  { value: 'mediana', label: 'Mediana (60-80 cm)' },
  { value: 'grande', label: 'Grande (80-100 cm)' },
  { value: 'gigante', label: 'Gigante (100-120 cm)' },
] as const

const PAPER_SIZES = [
  { value: 'Letter', label: 'Carta (Letter)' },
  { value: 'Legal', label: 'Oficio (Legal)' },
  { value: 'Tabloid', label: 'Tabloide (Tabloid)' },
  { value: 'A4', label: 'A4' },
  { value: 'A3', label: 'A3' },
] as const

const ORIENTATIONS = [
  { value: 'portrait', label: '↕ Vertical' },
  { value: 'landscape', label: '↔ Horizontal' },
] as const

export function ChatSettings({
  isOpen,
  onClose,
  onClearHistory,
  onSettingsChange,
}: ChatSettingsProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSettings(chatStorage.getSettings())
      setConfirmClear(false)
    }
  }, [isOpen])

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    chatStorage.saveSettings(updated)
    onSettingsChange(updated)
  }

  const resetDefaults = () => {
    setSettings({ ...DEFAULT_SETTINGS })
    chatStorage.saveSettings(DEFAULT_SETTINGS)
    onSettingsChange(DEFAULT_SETTINGS)
  }

  const handleClearHistory = () => {
    if (confirmClear) {
      onClearHistory()
      setConfirmClear(false)
      onClose()
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 4000)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
            <Settings2 className="h-5 w-5 text-purple-400" />
            <h2 className="text-base font-semibold text-white">Configuración</h2>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Tamaño de piñata */}
            <div>
              <label className="text-sm text-white/70 font-medium mb-2 block">
                Tamaño de piñata por defecto
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PINATA_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateSetting('defaultPinataSize', s.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.defaultPinataSize === s.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamaño de papel */}
            <div>
              <label className="text-sm text-white/70 font-medium mb-2 block">
                Papel por defecto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAPER_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateSetting('defaultPaperSize', s.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.defaultPaperSize === s.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientación */}
            <div>
              <label className="text-sm text-white/70 font-medium mb-2 block">
                Orientación por defecto
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ORIENTATIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => updateSetting('defaultOrientation', o.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.defaultOrientation === o.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-descargar */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-white/70 font-medium">Auto-descargar PDF</p>
                <p className="text-xs text-white/40">El agente descarga el molde automáticamente</p>
              </div>
              <button
                onClick={() => updateSetting('autoDownloadPdf', !settings.autoDownloadPdf)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.autoDownloadPdf ? 'bg-purple-600' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.autoDownloadPdf ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Separador */}
            <div className="border-t border-white/10" />

            {/* Restaurar defaults */}
            <button
              onClick={resetDefaults}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar valores predeterminados
            </button>

            {/* Borrar historial */}
            <button
              onClick={handleClearHistory}
              className={`flex items-center gap-2 text-sm transition-colors ${
                confirmClear
                  ? 'text-red-400 font-medium'
                  : 'text-red-400/60 hover:text-red-400'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmClear ? '¿Confirmar? Se borrarán todas las conversaciones' : 'Borrar todo el historial'}
            </button>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/10 flex justify-end">
            <Button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm h-9 px-5 rounded-lg"
            >
              Listo
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
