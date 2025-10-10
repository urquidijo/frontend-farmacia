// src/components/NavBar.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import UserMenu, { Me } from './UserMenu'
import { usePathname } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [carritoCount, setCarritoCount] = useState(0)
  const can = (p: string) => Boolean(me?.permissions?.includes(p))

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch('/api/me', { credentials: 'include', cache: 'no-store' })
      const user = r.ok ? ((await r.json()) as Me) : null
      setMe(user)

      // Si está autenticado, obtener el carrito
      if (user) {
        fetchCarritoCount()
      } else {
        setCarritoCount(0)
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCarritoCount = useCallback(async () => {
    try {
      const response = await fetch('/api/carrito', { credentials: 'include', cache: 'no-store' })
      if (response.ok) {
        const items = await response.json()
        setCarritoCount(items.length)
      }
    } catch {
      // noop
    }
  }, [])

  useEffect(() => {
    fetchMe()

    // Solo escuchar cambios importantes, no focus/visibility
    const onAuthChanged = () => { void fetchMe() }
    const onCarritoChanged = () => { void fetchCarritoCount() }

    window.addEventListener('auth:changed', onAuthChanged)
    window.addEventListener('carrito:changed', onCarritoChanged)

    return () => {
      window.removeEventListener('auth:changed', onAuthChanged)
      window.removeEventListener('carrito:changed', onCarritoChanged)
    }
  }, [fetchMe, fetchCarritoCount])

  const isAdminPath = pathname?.startsWith('/admin')
  if (isAdminPath) return null

  const links = [
    { href: '/productos', label: 'Productos' },
    { href: '/facturas', label: 'Mis Facturas' },

  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-14 flex items-center gap-6">
          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 -ml-2 rounded hover:bg-zinc-100"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="font-bold text-lg text-emerald-700">
            Farmacia
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {links.map(link => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative transition-colors
                    ${isActive
                      ? 'text-emerald-700 font-semibold'
                      : 'text-zinc-700 hover:text-emerald-600'}
                  `}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-emerald-700 rounded"></span>
                  )}
                </Link>
              )
            })}
            {me && can('user.read') && (
              <Link
                href="/admin"
                className={`ml-2 relative ${
                  pathname.startsWith('/admin')
                    ? 'text-emerald-700 font-semibold'
                    : 'text-zinc-700 hover:text-emerald-600'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Botón carrito */}
            {me && (
              <Link
                href="/carrito"
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
                title="Ver carrito"
              >
                <ShoppingCart size={22} className="text-gray-700" />
                {carritoCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {carritoCount}
                  </span>
                )}
              </Link>
            )}

            {loading ? (
              <span className="text-xs text-zinc-500">Cargando…</span>
            ) : me ? (
              <UserMenu me={me} />
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <Link href="/login" className="hover:text-emerald-700">
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-3 border-t text-sm">
            <nav className="flex flex-col gap-2 pt-3">
              {me && (
                <Link
                  href="/carrito"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-1 rounded hover:bg-zinc-50 flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  <span>Mi Carrito</span>
                  {carritoCount > 0 && (
                    <span className="ml-auto bg-emerald-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {carritoCount}
                    </span>
                  )}
                </Link>
              )}
              {links.map(link => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-2 py-1 rounded ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'hover:bg-zinc-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              {me && can('user.read') && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`px-2 py-1 rounded ${
                    pathname.startsWith('/admin')
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'hover:bg-zinc-50'
                  }`}
                >
                  Admin
                </Link>
              )}
              {!me && (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    Ingresar
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    Crear cuenta
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
