'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Form = {
  email: string
  firstName: string
  lastName: string
  password: string
}

export default function RegisterPage() {
  const [form, setForm] = useState<Form>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  })
  const [err, setErr] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        router.push('/login')
      } else {
        const text = await res.text()
        setErr(text || 'No se pudo registrar.')
      }
    } catch {
      setErr('Error de red. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const FIELDS: { key: keyof Form; label: string; type?: 'text' | 'password' | 'email' }[] = [
    { key: 'email', label: 'email', type: 'email' },
    { key: 'firstName', label: 'firstName', type: 'text' },
    { key: 'lastName', label: 'lastName', type: 'text' },
    { key: 'password', label: 'password', type: 'password' },
  ]

  const disabled =
    !form.email || !form.firstName || !form.lastName || form.password.length < 6 || loading

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-xl font-semibold">Crear cuenta</h1>

      {FIELDS.map((f) => (
        <input
          key={f.key}
          className="border p-2 w-full"
          placeholder={f.label}
          type={f.type ?? 'text'}
          value={form[f.key]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
          }
          required
        />
      ))}

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <button
        className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-60"
        disabled={disabled}
      >
        {loading ? 'Registrando…' : 'Registrarme'}
      </button>

      <p className="text-xs text-zinc-500">
        * La contraseña debe tener al menos 6 caracteres.
      </p>
    </form>
  )
}
