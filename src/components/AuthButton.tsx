'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, User, Package, Loader2 } from 'lucide-react'

interface AuthButtonProps {
  onOpenPricing?: () => void
  designCredits?: number
}

export function AuthButton({ onOpenPricing, designCredits = 0 }: AuthButtonProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Button variant="ghost" size="sm" disabled className="text-white">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!session) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signIn('google')}
        className="text-white hover:text-purple-300 hover:bg-white/10"
      >
        <LogIn className="h-4 w-4 mr-2" />
        Iniciar sesión
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Badge de créditos */}
      {designCredits > 0 ? (
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/30">
          <Package className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-100">{designCredits} crédito{designCredits !== 1 ? 's' : ''}</span>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenPricing}
          className="hidden md:flex text-purple-300 hover:text-purple-100 hover:bg-white/10 text-xs"
        >
          <Package className="h-3.5 w-3.5 mr-1" />
          Comprar créditos
        </Button>
      )}

      {/* User info */}
      <div className="flex items-center gap-2">
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt=""
            className="w-7 h-7 rounded-full border border-white/20"
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className="h-5 w-5 text-white" />
        )}
        <span className="text-sm text-white hidden md:inline max-w-[120px] truncate">
          {session.user?.name?.split(' ')[0]}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut()}
        className="text-white/60 hover:text-white hover:bg-white/10"
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )  
}
