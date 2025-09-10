'use client'
import { useEffect, useState } from 'react'

type Me = {
  id: number
  email: string
  firstName: string
  lastName: string
  permissions: string[]
}

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const abort = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include', signal: abort.signal })
        if (res.ok) setMe(await res.json())
      } catch {/* noop */}
      finally {
        setLoading(false)
      }
    })()
    return () => abort.abort()
  }, [])

  if (loading) return <p>Verificando sesión…</p>
  if (!me) return <p>Debes iniciar sesión.</p>

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">Mi cuenta</h1>
      <p className="text-sm text-zinc-600">
        {me.firstName} {me.lastName} — {me.email}
      </p>
      <div className="border rounded-xl p-4">
        <h2 className="font-medium mb-2">Mis pedidos</h2>
        <p className="text-sm text-zinc-500">Aún no tienes pedidos.</p>
      </div>
    </section>
  )
}
