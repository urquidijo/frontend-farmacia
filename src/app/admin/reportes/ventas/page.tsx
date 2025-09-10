'use client'

import { useState } from 'react'

type FiltrosVentas = {
  desde: string
  hasta: string
  granularidad: 'DIA' | 'SEMANA' | 'MES'
  metodo?: '' | 'CARD' | 'QR' | 'CASH'
}

export default function ReporteVentas() {
  const [f, setF] = useState<FiltrosVentas>({
    // placeholders; en prod puedes prefijar al mes actual
    desde: '',
    hasta: '',
    granularidad: 'DIA',
    metodo: '',
  })

  function onFiltrar(e: React.FormEvent) {
    e.preventDefault()
    // TODO: fetch a /api/reportes/ventas?desde=...&hasta=...&granularidad=...&metodo=...
    alert('Aplicar filtros (placeholder)')
  }

  function onExportar() {
    // TODO: exportación CSV/Excel desde tu API
    alert('Exportar CSV (placeholder)')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold">Reporte de ventas</h1>

      {/* Filtros */}
      <form onSubmit={onFiltrar} className="rounded-xl border p-3 grid gap-2 md:grid-cols-5 md:items-end">
        <label className="text-sm grid gap-1">
          <span className="text-zinc-600">Desde</span>
          <input
            type="date"
            className="border rounded-md px-3 py-2"
            value={f.desde}
            onChange={(e) => setF({ ...f, desde: e.target.value })}
          />
        </label>
        <label className="text-sm grid gap-1">
          <span className="text-zinc-600">Hasta</span>
          <input
            type="date"
            className="border rounded-md px-3 py-2"
            value={f.hasta}
            onChange={(e) => setF({ ...f, hasta: e.target.value })}
          />
        </label>
        <label className="text-sm grid gap-1">
          <span className="text-zinc-600">Granularidad</span>
          <select
            className="border rounded-md px-3 py-2"
            value={f.granularidad}
            onChange={(e) => setF({ ...f, granularidad: e.target.value as FiltrosVentas['granularidad'] })}
          >
            <option value="DIA">Día</option>
            <option value="SEMANA">Semana</option>
            <option value="MES">Mes</option>
          </select>
        </label>
        <label className="text-sm grid gap-1">
          <span className="text-zinc-600">Método de pago</span>
          <select
            className="border rounded-md px-3 py-2"
            value={f.metodo}
            onChange={(e) => setF({ ...f, metodo: e.target.value as FiltrosVentas['metodo'] })}
          >
            <option value="">Todos</option>
            <option value="CARD">Tarjeta</option>
            <option value="QR">QR</option>
            <option value="CASH">Efectivo</option>
          </select>
        </label>

        <div className="flex gap-2 md:justify-end">
          <button type="button" onClick={onExportar} className="px-3 py-2 rounded border hover:bg-zinc-50 w-full md:w-auto">
            Exportar
          </button>
          <button className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 w-full md:w-auto">
            Filtrar
          </button>
        </div>
      </form>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ventas totales', value: '—' },
          { label: 'Pedidos', value: '—' },
          { label: 'Ticket promedio', value: '—' },
          { label: 'Tasa de pago', value: '—' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">{k.label}</div>
            <div className="text-xl font-semibold mt-1">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Serie temporal (placeholder) */}
      <section className="rounded-xl border p-4">
        <div className="text-sm text-zinc-600 mb-2">Ventas por {f.granularidad.toLowerCase()}</div>
        <div className="h-48 rounded-lg bg-zinc-100 grid place-items-center text-zinc-400 text-sm">
          Gráfico (placeholder)
        </div>
      </section>

      {/* Tabla desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="[&>th]:py-3 [&>th]:px-4 text-left">
              <th>Fecha</th>
              <th>Pedidos</th>
              <th>Pagados</th>
              <th>Cancelados</th>
              <th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t [&>td]:py-3 [&>td]:px-4">
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td className="text-right">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        <article className="rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Fecha: —</div>
            <div className="text-right font-medium">Monto: —</div>
          </div>
          <div className="text-sm text-zinc-600 mt-1">Pedidos: — · Pagados: — · Cancelados: —</div>
        </article>
      </div>
    </div>
  )
}
