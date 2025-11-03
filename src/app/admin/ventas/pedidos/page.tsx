'use client'

import { useEffect, useMemo, useState } from 'react'

type EstadoOrden = 'PENDIENTE' | 'PAGADA' | 'ENVIADA' | 'ENTREGADA' | 'CANCELADA'

type Pedido = {
  id: number
  estado: EstadoOrden
  total: number
  createdAt: string
  updatedAt: string
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
  items: Array<{
    id: number
    productoId: number
    cantidad: number
    precioUnitario: number
    subtotal: number
    producto?: {
      id: number
      nombre: string
      imageUrl?: string | null
    } | null
  }>
  pago: {
    id: number
    estado: string
    metodo: string | null
    facturaUrl: string | null
    monto: number
    createdAt: string
  } | null
}

type ListResponse = {
  items: Pedido[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PAGE_SIZE = 10

const STATUS_LABELS: Record<EstadoOrden, string> = {
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  ENVIADA: 'Enviada',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
}

const STATUS_ORDER: EstadoOrden[] = ['PENDIENTE', 'PAGADA', 'ENVIADA', 'ENTREGADA', 'CANCELADA']

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<EstadoOrden | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

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
        if (status) params.set('status', status)
        if (from) params.set('from', from)
        if (to) params.set('to', to)

        const res = await fetch(`/api/pedidos?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(await res.text())
        const json: ListResponse = await res.json()
        if (!controller.signal.aborted) {
          setPedidos(json.items)
          setMeta({ total: json.total, totalPages: json.totalPages })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error al cargar pedidos', err)
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [page, debouncedSearch, status, from, to])

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(PAGE_SIZE))
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (status) params.set('status', status)
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const res = await fetch(`/api/pedidos?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      const json: ListResponse = await res.json()
      setPedidos(json.items)
      setMeta({ total: json.total, totalPages: json.totalPages })
    } catch (err) {
      console.error('Error al refrescar pedidos', err)
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (pedidoId: number, estado: EstadoOrden) => {
    setUpdating(pedidoId)
    setError('')
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado }),
      })
      if (!res.ok) throw new Error(await res.text())
      await refresh()
    } catch (err) {
      console.error('Error al actualizar estado', err)
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado del pedido')
    } finally {
      setUpdating(null)
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

  const renderMoney = (value: number) => `Bs. ${value.toFixed(2)}`

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-800">Gestion de pedidos</h1>
        <p className="text-sm text-zinc-500">
          Supervisa ventas, estados logisticos y pagos asociados a cada pedido.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Buscar
          </label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Pedido, cliente o producto"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as EstadoOrden | '')
              setPage(1)
            }}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos</option>
            {STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Desde
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Hasta
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-zinc-500">
        {meta.total} pedido{meta.total === 1 ? '' : 's'} encontrados
      </div>

      {error && (
        <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
          Cargando pedidos...
        </div>
      )}

      {!loading && pedidos.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
          No hay pedidos que coincidan con los filtros seleccionados.
        </div>
      )}

      {!loading &&
        pedidos.map((pedido) => {
          const isExpanded = expanded === pedido.id
          return (
            <article
              key={pedido.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-emerald-200 transition"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    <span className="font-semibold text-zinc-800">Pedido #{pedido.id}</span>
                    <span>-</span>
                    <span>{new Date(pedido.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {pedido.user.firstName} {pedido.user.lastName}{' '}
                    <span className="text-zinc-400">({pedido.user.email})</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-semibold text-zinc-900">
                    {renderMoney(pedido.total)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        pedido.estado === 'CANCELADA'
                          ? 'bg-red-100 text-red-700'
                          : pedido.estado === 'PENDIENTE'
                          ? 'bg-amber-100 text-amber-700'
                          : pedido.estado === 'ENTREGADA'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {STATUS_LABELS[pedido.estado]}
                    </span>
                    <select
                      value={pedido.estado}
                      disabled={updating === pedido.id}
                      onChange={(e) => handleStatusChange(pedido.id, e.target.value as EstadoOrden)}
                      className="rounded-lg border border-zinc-200 px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {STATUS_ORDER.map((value) => (
                        <option key={value} value={value}>
                          {STATUS_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setExpanded(isExpanded ? null : pedido.id)}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
                {updating === pedido.id && (
                  <span className="text-xs text-zinc-500">Actualizando estado...</span>
                )}
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <h4 className="text-sm font-semibold text-zinc-700">Articulos</h4>
                  <div className="mt-2 space-y-3">
                    {pedido.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="font-medium text-zinc-800">
                            {item.producto?.nombre ?? `Producto #${item.productoId}`}
                          </div>
                          <div className="text-xs text-zinc-500">
                            Cantidad: {item.cantidad} - Precio unitario: {renderMoney(item.precioUnitario)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-zinc-800">
                          {renderMoney(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-zinc-600 md:grid-cols-2">
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Actualizado
                      </h5>
                      <p>{new Date(pedido.updatedAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Pago
                      </h5>
                      {pedido.pago ? (
                        <div className="space-y-1">
                          <div className="font-medium text-zinc-700">
                            {renderMoney(pedido.pago.monto)} - {pedido.pago.estado}
                          </div>
                          {pedido.pago.metodo && (
                            <div className="text-xs text-zinc-500">
                              Metodo: {pedido.pago.metodo}
                            </div>
                          )}
                          {pedido.pago.facturaUrl && (
                            <a
                              href={pedido.pago.facturaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                            >
                              Ver factura
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500">Sin pago registrado</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}

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
    </section>
  )
}
