// src/components/NavBar.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import UserMenu, { Me } from './UserMenu'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const can = (p: string) => Boolean(me?.permissions?.includes(p))

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch('/api/me', { credentials: 'include', cache: 'no-store' })
      setMe(r.ok ? ((await r.json()) as Me) : null)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()

    const onAuthChanged = () => { void fetchMe() }
    const onFocus = () => { void fetchMe() }
    const onVisible = () => { if (!document.hidden) void fetchMe() }

    window.addEventListener('auth:changed', onAuthChanged)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('auth:changed', onAuthChanged)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchMe])

  const isAdminPath = pathname?.startsWith('/admin')

  // IMPORTANTE: los hooks ya se llamaron arriba.
  if (isAdminPath) return null

  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-14 flex items-center gap-4">
          <button
            className="md:hidden p-2 -ml-2 rounded hover:bg-zinc-100"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" /></svg>
          </button>

          <Link href="/" className="font-semibold">Farmacia</Link>

          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/productos" className="hover:text-emerald-700">Productos</Link>
            <Link href="/productos?cat=dermocosmética" className="hover:text-emerald-700">Dermocosmética</Link>
            <Link href="/productos?cat=bebe" className="hover:text-emerald-700">Bebés</Link>
            <Link href="/productos?cat=vitaminas" className="hover:text-emerald-700">Vitaminas</Link>
            {me && can('user.read') && (
              <Link href="/admin" className="ml-2 text-emerald-700 font-medium">Admin</Link>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {loading ? (
              <span className="text-xs text-zinc-500">Cargando…</span>
            ) : me ? (
              <UserMenu me={me} />
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <Link href="/login" className="hover:text-emerald-700">Ingresar</Link>
                <Link href="/register" className="bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700">
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-3 border-t text-sm">
            <nav className="flex flex-col gap-2 pt-3">
              <Link href="/productos" onClick={() => setMobileOpen(false)}>Productos</Link>
              <Link href="/productos?cat=dermocosmética" onClick={() => setMobileOpen(false)}>Dermocosmética</Link>
              <Link href="/productos?cat=bebe" onClick={() => setMobileOpen(false)}>Bebés</Link>
              <Link href="/productos?cat=vitaminas" onClick={() => setMobileOpen(false)}>Vitaminas</Link>
              {me && can('user.read') && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}>Admin</Link>
              )}
              {!me && (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Ingresar</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>Crear cuenta</Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
