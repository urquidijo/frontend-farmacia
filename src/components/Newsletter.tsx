// components/Newsletter.tsx
'use client'
import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState<string>('')
  const [ok, setOk] = useState<boolean>(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Aquí podrías POSTear a /api/newsletter; por ahora solo feedback.
    setOk(true)
    setEmail('')
  }

  return (
    <div className="rounded-2xl border p-5 md:p-6">
      <h3 className="font-semibold">Recibe ofertas y novedades</h3>
      <p className="text-sm text-zinc-600 mt-1">Descuentos en dermocosmética, vitaminas y más.</p>
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          className="w-full border rounded-md px-3 py-2"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />
        <button className="whitespace-nowrap bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700">
          Suscribirme
        </button>
      </form>
      {ok && <p className="mt-2 text-sm text-emerald-700">¡Listo! Te llegarán nuestras promociones.</p>}
    </div>
  )
}
