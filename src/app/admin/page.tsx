'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Lock,
  LogOut,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  Scissors,
  Calendar,
  BarChart3,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

interface SurveyData {
  total: number
  positive: number
  negative: number
  feedbacks: Array<{ id: number; feedback: string; created_at: string }>
}

interface StatsData {
  totalVisits: number
  totalGeneratorUses: number
  todayVisits: number
  todayGeneratorUses: number
  visitsByDay: Array<{ date: string; count: number }>
  generatorByDay: Array<{ date: string; action: string; count: number }>
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [logging, setLogging] = useState(false)
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [storedPassword, setStoredPassword] = useState('')

  const fetchData = useCallback(async (pwd: string) => {
    setLoading(true)
    try {
      const [surveyRes, statsRes] = await Promise.all([
        fetch('/api/survey', { headers: { 'x-admin-password': pwd } }),
        fetch('/api/stats', { headers: { 'x-admin-password': pwd } }),
      ])

      if (surveyRes.ok) setSurveyData(await surveyRes.json())
      if (statsRes.ok) setStatsData(await statsRes.json())
    } catch {
      // Error silencioso
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_password')
    if (saved) {
      setStoredPassword(saved)
      setAuthenticated(true)
      fetchData(saved)
    }
  }, [fetchData])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLogging(true)
    setLoginError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        sessionStorage.setItem('admin_password', password)
        setStoredPassword(password)
        setAuthenticated(true)
        fetchData(password)
      } else {
        setLoginError('Contraseña incorrecta')
      }
    } catch {
      setLoginError('Error de conexión')
    } finally {
      setLogging(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_password')
    setAuthenticated(false)
    setSurveyData(null)
    setStatsData(null)
    setPassword('')
    setStoredPassword('')
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <Lock className="h-6 w-6 text-purple-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Admin</h1>
              <p className="text-sm text-purple-300 mt-1">Ingresa la contraseña</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              {loginError && (
                <p className="text-red-400 text-sm text-center">{loginError}</p>
              )}
              <Button
                type="submit"
                disabled={logging || !password}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {logging ? 'Verificando...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/" className="text-xs text-purple-400 hover:text-purple-300">
                ← Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const positivePercent = surveyData && surveyData.total > 0
    ? Math.round((surveyData.positive / surveyData.total) * 100)
    : 0
  const negativePercent = surveyData && surveyData.total > 0
    ? Math.round((surveyData.negative / surveyData.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-white">Panel de Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchData(storedPassword)}
              disabled={loading}
              className="text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10 gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Estadísticas de encuesta */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            Encuesta
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-3xl font-bold text-white">{surveyData?.total ?? '—'}</p>
                <p className="text-sm text-purple-300 mt-1">Total respuestas</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-400" />
                  <p className="text-3xl font-bold text-green-400">{positivePercent}%</p>
                </div>
                <p className="text-sm text-purple-300 mt-1">Les gusta ({surveyData?.positive ?? 0})</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <ThumbsDown className="h-5 w-5 text-red-400" />
                  <p className="text-3xl font-bold text-red-400">{negativePercent}%</p>
                </div>
                <p className="text-sm text-purple-300 mt-1">No les gusta ({surveyData?.negative ?? 0})</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feedbacks negativos */}
        {surveyData && surveyData.feedbacks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-red-400" />
              Sugerencias de mejora
            </h2>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-2">
                <div className="space-y-3">
                  {surveyData.feedbacks.map((item) => (
                    <div key={item.id} className="border-b border-white/5 pb-3 last:border-0">
                      <p className="text-sm text-white">{item.feedback}</p>
                      <p className="text-xs text-purple-400 mt-1">
                        {new Date(item.created_at + 'Z').toLocaleString('es-MX')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Estadísticas de uso */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            Uso de la App
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-4 text-center">
                <Eye className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{statsData?.todayVisits ?? '—'}</p>
                <p className="text-xs text-purple-300 mt-1">Visitas hoy</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-4 text-center">
                <Scissors className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{statsData?.todayGeneratorUses ?? '—'}</p>
                <p className="text-xs text-purple-300 mt-1">Usos generador hoy</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-4 text-center">
                <Eye className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{statsData?.totalVisits ?? '—'}</p>
                <p className="text-xs text-purple-300 mt-1">Visitas totales</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-4 text-center">
                <Scissors className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{statsData?.totalGeneratorUses ?? '—'}</p>
                <p className="text-xs text-purple-300 mt-1">Usos generador total</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Visitas por día */}
        {statsData && statsData.visitsByDay.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Visitas por día (últimos 30 días)
            </h2>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-2">
                <div className="space-y-2">
                  {statsData.visitsByDay.map((day) => {
                    const maxCount = Math.max(...statsData.visitsByDay.map((d) => d.count))
                    const width = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="text-xs text-purple-300 w-24 flex-shrink-0">
                          {new Date(day.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </span>
                        <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-10 text-right">{day.count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Usos del generador por día */}
        {statsData && statsData.generatorByDay.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              Usos del generador por día (últimos 30 días)
            </h2>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 pb-2">
                <div className="space-y-2">
                  {(() => {
                    const grouped: Record<string, { upload: number; download: number }> = {}
                    for (const item of statsData.generatorByDay) {
                      if (!grouped[item.date]) grouped[item.date] = { upload: 0, download: 0 }
                      if (item.action === 'upload') grouped[item.date].upload = item.count
                      if (item.action === 'download') grouped[item.date].download = item.count
                    }
                    const entries = Object.entries(grouped)
                    const maxCount = Math.max(...entries.map(([, v]) => v.upload + v.download))

                    return entries.map(([date, counts]) => {
                      const total = counts.upload + counts.download
                      const width = maxCount > 0 ? (total / maxCount) * 100 : 0
                      return (
                        <div key={date} className="flex items-center gap-3">
                          <span className="text-xs text-purple-300 w-24 flex-shrink-0">
                            {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                          </span>
                          <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-xs text-purple-300 w-28 text-right">
                            {counts.upload}↑ {counts.download}↓ ({total})
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Estado vacío */}
        {!loading && statsData && statsData.visitsByDay.length === 0 && surveyData && surveyData.total === 0 && (
          <div className="text-center py-12">
            <p className="text-purple-300">No hay datos todavía. Los datos aparecerán cuando los usuarios usen la app.</p>
          </div>
        )}
      </main>
    </div>
  )
}
