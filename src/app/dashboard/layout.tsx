'use client'

import { useAuth } from '@/components/AuthProvider'
import { AuthGuard } from '@/components/AuthGuard'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, Package, LayoutDashboard, ExternalLink, LogOut, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/tienda', label: 'Mi Tienda', icon: Store },
  { href: '/dashboard/productos', label: 'Productos', icon: Package },
]

function DashboardSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside className="w-64 bg-gray-900/50 border-r border-gray-800 min-h-screen flex flex-col max-lg:hidden">
      <div className="p-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🪅</span>
          <span className="font-bold text-white">PiñataPoster</span>
        </Link>
        <p className="text-xs text-gray-500 mt-1">Catálogo Digital</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-purple-600/20 text-purple-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link
          href="/generator"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Generador de Moldes
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
        {user && (
          <div className="px-3 py-2 text-xs text-gray-600 truncate">
            {user.email}
          </div>
        )}
      </div>
    </aside>
  )
}

function MobileHeader() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🪅</span>
          <span className="font-bold text-white text-sm">Catálogo</span>
        </Link>
        <button
          onClick={signOut}
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-purple-600/20 text-purple-400 font-medium'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <item.icon className="h-3 w-3" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-950">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader />
          <main className="flex-1 p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
