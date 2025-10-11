'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, CheckCircle2, XCircle, Calendar, RotateCcw, Download } from 'lucide-react'

export type EstadoBitacora = 'EXITOSO' | 'FALLIDO'

export type UserLite = {
  id: number
  email: string
  firstName: string
  lastName: string
}

export type BitacoraRow = {
  id: number
  userId: number
  user?: UserLite | null
  ip?: string | null
  acciones?: string | null
  estado: EstadoBitacora
  // Ambos vienen YA formateados en backend a America/La_Paz
  fecha_entrada: string // YYYY-MM-DD
  hora_entrada: string  // HH:mm:ss
}

type ApiResp = {
  items: BitacoraRow[]
  total: number
}

// ---------------- Utils ----------------
function clsx(...arr: (string | false | null | undefined)[]) {
  return arr.filter(Boolean).join(' ')
}

function toCSV(rows: BitacoraRow[]) {
  const header = ['Fecha', 'Hora', 'Usuario', 'Email', 'IP', 'Accion', 'Estado']
  const data = rows.map((r) => [
    r.fecha_entrada,
    r.hora_entrada,
    r.user ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() : '',
    r.user?.email ?? '',
    r.ip ?? '',
    r.acciones ?? '',
    r.estado,
  ])
  const csv = [header, ...data]
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  return csv
}

type EstadoFiltro = EstadoBitacora | 'TODOS'
function isEstadoFiltro(v: string): v is EstadoFiltro {
  return v === 'TODOS' || v === 'EXITOSO' || v === 'FALLIDO'
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  try {
    return typeof err === 'string' ? err : JSON.stringify(err)
  } catch {
    return 'Error desconocido'
  }
}

// ---------------- Componente ----------------
export default function BitacoraPage() {
  const [rows, setRows] = useState<BitacoraRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // filtros
  const [qNombre, setQNombre] = useState('') // nombre/apellido/email
  const [estado, setEstado] = useState<EstadoFiltro>('TODOS')
  const [from, setFrom] = useState<string>('') // YYYY-MM-DD (zona Bolivia)
  const [to, setTo] = useState<string>('')     // YYYY-MM-DD (zona Bolivia)

  // paginación
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  // Build query string con America/La_Paz (-04:00)
  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (qNombre.trim()) p.set('nombre', qNombre.trim())
    if (estado !== 'TODOS') p.set('estado', estado)
    const mkStart = (d: string) => `${d}T00:00:00-04:00`
    const mkEnd   = (d: string) => `${d}T23:59:59-04:00`
    if (from) p.set('desde', mkStart(from))
    if (to)   p.set('hasta', mkEnd(to))
    p.set('page', String(page))
    p.set('pageSize', String(pageSize))
    return p.toString()
  }, [qNombre, estado, from, to, page, pageSize])

  // Carga con debounce
  useEffect(() => {
    let cancel = false
    const t = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/bitacora?${queryString}`, { credentials: 'include', cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudo cargar la bitácora')
        const json = (await res.json()) as ApiResp | BitacoraRow[]
        if (cancel) return
        if (Array.isArray(json)) {
          setRows(json)
          setTotal(json.length)
        } else {
          setRows(json.items ?? [])
          setTotal(typeof json.total === 'number' ? json.total : (json.items?.length ?? 0))
        }
      } catch (e: unknown) {
        if (!cancel) setError(getErrorMessage(e))
      } finally {
        if (!cancel) setLoading(false)
      }
    }, 250)
    return () => {
      cancel = true
      clearTimeout(t)
    }
  }, [queryString])

  function resetFiltros() {
    setQNombre('')
    setEstado('TODOS')
    setFrom('')
    setTo('')
    setPage(1)
  }

  function handleExportCSV() {
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bitacora_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Bitácora</h1>
        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
        >
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Email</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Ej: Juan, Pérez, juan@correo.com"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={qNombre}
                onChange={(e) => { setPage(1); setQNombre(e.target.value) }}
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              className="w-full pr-4 py-2 border rounded-lg"
              value={estado}
              onChange={(e) => {
                const val = e.target.value
                if (isEstadoFiltro(val)) {
                  setPage(1)
                  setEstado(val)
                }
              }}
            >
              <option value="TODOS">Todos</option>
              <option value="EXITOSO">EXITOSO</option>
              <option value="FALLIDO">FALLIDO</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde (BO)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={from}
                onChange={(e) => { setPage(1); setFrom(e.target.value) }}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta (BO)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={to}
                onChange={(e) => { setPage(1); setTo(e.target.value) }}
              />
            </div>
          </div>

          <div className="md:col-span-12 flex justify-end">
            <button
              onClick={resetFiltros}
              className="px-4 py-2 border rounded hover:bg-gray-50 text-sm inline-flex items-center gap-2"
            >
              <RotateCcw size={16} /> Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                  </div>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  No hay registros que coincidan con los filtros.
                </td>
              </tr>
            )}

            {!loading && rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.fecha_entrada}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.hora_entrada}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {r.user ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() : '—'}
                  </div>
                  <div className="text-sm text-gray-500">{r.user?.email ?? ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.ip ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.acciones ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <EstadoBadge estado={r.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Página {page} de {totalPages}
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="ml-2 px-2 py-1 border rounded text-sm"
          >
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}/página</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  )
}

function EstadoBadge({ estado }: { estado: EstadoBitacora }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        estado === 'EXITOSO' && 'bg-green-100 text-green-800',
        estado === 'FALLIDO' && 'bg-red-100 text-red-800'
      )}
    >
      {estado === 'EXITOSO' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} {estado}
    </span>
  )
}
