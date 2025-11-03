'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'

type Proveedor = {
  id: number
  nombre: string
  contacto?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  notas?: string | null
  createdAt: string
  updatedAt: string
}

type ListResponse = {
  items: Proveedor[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const EMPTY_FORM: Omit<Proveedor, 'id' | 'createdAt' | 'updatedAt'> = {
  nombre: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  notas: '',
}

const PAGE_SIZE = 10

export default function ProveedoresAdmin() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(PAGE_SIZE))
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

        const res = await fetch(`/api/proveedores?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(await res.text())
        const json: ListResponse = await res.json()
        if (!controller.signal.aborted) {
          setProveedores(json.items)
          setMeta({ total: json.total, totalPages: json.totalPages })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error al cargar proveedores', err)
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los proveedores')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [page, debouncedSearch])

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(PAGE_SIZE))
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      const res = await fetch(`/api/proveedores?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      const json: ListResponse = await res.json()
      setProveedores(json.items)
      setMeta({ total: json.total, totalPages: json.totalPages })
    } catch (err) {
      console.error('Error al refrescar proveedores', err)
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los proveedores')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (prov: Proveedor) => {
    setEditing(prov)
    setForm({
      nombre: prov.nombre ?? '',
      contacto: prov.contacto ?? '',
      telefono: prov.telefono ?? '',
      email: prov.email ?? '',
      direccion: prov.direccion ?? '',
      notas: prov.notas ?? '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setSaving(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre del proveedor es obligatorio')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        nombre: form.nombre.trim(),
        contacto: form.contacto?.trim() || undefined,
        telefono: form.telefono?.trim() || undefined,
        email: form.email?.trim() || undefined,
        direccion: form.direccion?.trim() || undefined,
        notas: form.notas?.trim() || undefined,
      }
      const url = editing ? `/api/proveedores/${editing.id}` : '/api/proveedores'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      closeForm()
      await refresh()
    } catch (err) {
      console.error('Error al guardar proveedor', err)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el proveedor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (prov: Proveedor) => {
    if (!confirm(`Eliminar al proveedor "${prov.nombre}"?`)) return
    setError('')
    try {
      const res = await fetch(`/api/proveedores/${prov.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      await refresh()
    } catch (err) {
      console.error('Error al eliminar proveedor', err)
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el proveedor')
    }
  }

  const pagination = useMemo(() => {
    const pages = []
    for (let i = 1; i <= meta.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded-md border text-sm ${
            page === i ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-zinc-100'
          }`}
        >
          {i}
        </button>,
      )
    }
    return pages
  }, [meta.totalPages, page])

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-800">Proveedores</h1>
          <p className="text-sm text-zinc-500">
            Administra la información de contacto y notas de tus proveedores.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 transition"
        >
          Nuevo proveedor
        </button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Buscar por nombre, contacto o email"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            buscar
          </span>
        </div>
        <div className="text-sm text-zinc-500">
          {meta.total} proveedor{meta.total === 1 ? '' : 'es'}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Actualizado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-sm">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Cargando proveedores...
                </td>
              </tr>
            )}
            {!loading && proveedores.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  No se encontraron proveedores con los filtros actuales.
                </td>
              </tr>
            )}
            {!loading &&
              proveedores.map((prov) => (
                <tr key={prov.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-800">{prov.nombre}</div>
                    {prov.direccion && (
                      <div className="text-xs text-zinc-500">Dirección: {prov.direccion}</div>
                    )}
                    {prov.notas && (
                      <div className="mt-1 text-xs text-zinc-500">{prov.notas}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{prov.contacto || '—'}</td>
                  <td className="px-4 py-3 text-zinc-700">{prov.telefono || '—'}</td>
                  <td className="px-4 py-3 text-zinc-700">{prov.email || '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(prov.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(prov)}
                        className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(prov)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-zinc-200 px-3 py-1 text-sm text-zinc-600 disabled:opacity-50"
          >
            Anterior
          </button>
          {pagination}
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="rounded-md border border-zinc-200 px-3 py-1 text-sm text-zinc-600 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-800">
                  {editing ? 'Editar proveedor' : 'Nuevo proveedor'}
                </h2>
                <p className="text-sm text-zinc-500">
                  Completa los datos del contacto para registrar o actualizar al proveedor.
                </p>
              </div>
              <button
                onClick={closeForm}
                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Nombre *
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                  maxLength={120}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Persona de contacto
                  </label>
                  <input
                    value={form.contacto || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, contacto: e.target.value }))}
                    maxLength={120}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Teléfono</label>
                  <input
                    value={form.telefono || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                    maxLength={30}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    maxLength={160}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Dirección</label>
                  <input
                    value={form.direccion || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
                    maxLength={200}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Notas</label>
                <textarea
                  value={form.notas || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
