'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading, configured } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !configured)) {
      router.replace('/auth/login')
    }
  }, [user, loading, configured, router])

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
