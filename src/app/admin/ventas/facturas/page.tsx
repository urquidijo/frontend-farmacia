'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface Factura {
  id: number
  monto: number
  estado: string
  facturaUrl: string | null
  orden: {
    id: number
    total: number
    createdAt: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

export default function FacturasAdmin() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [filteredFacturas, setFilteredFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // ✅ FETCH estilo Bitácora
  useEffect(() => {
    let cancel = false
    const t = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/pagos/facturas', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!res.ok) throw new Error('No se pudieron cargar las facturas')

        const json = await res.json()
        if (cancel) return

        if (Array.isArray(json)) {
          setFacturas(json)
          setFilteredFacturas(json)
        } else if (json.items) {
          setFacturas(json.items)
          setFilteredFacturas(json.items)
        } else {
          console.warn('Respuesta inesperada de API:', json)
          setFacturas([])
          setFilteredFacturas([])
        }
      } catch (err) {
        if (!cancel) {
          console.error('Error al cargar facturas:', err)
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    }, 250)
    return () => {
      cancel = true
      clearTimeout(t)
    }
  }, [])

  // ✅ FILTRO POR FECHA
  const aplicarFiltro = () => {
    if (!fechaInicio && !fechaFin) {
      setFilteredFacturas(facturas)
      return
    }
    const inicio = fechaInicio ? new Date(fechaInicio) : null
    const fin = fechaFin ? new Date(fechaFin) : null
    const filtradas = facturas.filter((f) => {
      const d = new Date(f.orden.createdAt)
      if (inicio && d < inicio) return false
      if (fin && d > fin) return false
      return true
    })
    setFilteredFacturas(filtradas)
  }

  // ✅ EXPORTAR PDF
  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text('Reporte de Facturas', 14, 15)
    const tabla = filteredFacturas.map((f, idx) => [
      idx + 1,
      `${f.orden.user.firstName} ${f.orden.user.lastName}`,
      f.orden.user.email,
      `Bs. ${f.monto.toFixed(2)}`,
      f.estado,
      new Date(f.orden.createdAt).toLocaleDateString(),
    ])
    autoTable(doc, {
      startY: 25,
      head: [['#', 'Cliente', 'Email', 'Monto', 'Estado', 'Fecha']],
      body: tabla,
    })
    doc.save('facturas_admin.pdf')
  }

  // ✅ EXPORTAR EXCEL
  const exportarExcel = () => {
    const datos = filteredFacturas.map((f) => ({
      Cliente: `${f.orden.user.firstName} ${f.orden.user.lastName}`,
      Email: f.orden.user.email,
      Monto: f.monto,
      Estado: f.estado,
      Fecha: new Date(f.orden.createdAt).toLocaleDateString(),
      Factura: f.facturaUrl ?? 'No disponible',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, 'facturas_admin.xlsx')
  }

  // ✅ EXPORTAR HTML
  const exportarHTML = () => {
    const hoy = new Date()
    const periodo =
      (fechaInicio ? new Date(fechaInicio).toLocaleDateString() : 'Todos') +
      ' — ' +
      (fechaFin ? new Date(fechaFin).toLocaleDateString() : 'Todos')

    const resumen = {
      total: filteredFacturas.reduce((acc, f) => acc + f.monto, 0),
      pagadas: filteredFacturas.filter((f) => f.estado === 'PAGADA').length,
      pendientes: filteredFacturas.filter((f) => f.estado !== 'PAGADA').length,
      cantidad: filteredFacturas.length,
    }

    const filas = filteredFacturas
      .map(
        (f, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${f.orden.user.firstName} ${f.orden.user.lastName}</td>
        <td>${f.orden.user.email}</td>
        <td>${new Date(f.orden.createdAt).toLocaleDateString()}</td>
        <td style="text-align:right;">Bs. ${f.monto.toFixed(2)}</td>
        <td>${f.estado}</td>
      </tr>
    `
      )
      .join('')

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reporte de Facturas</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #222; padding: 20px; }
    h1 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
    th { background-color: #f4f4f4; text-align: left; }
    tfoot td { font-weight: bold; background-color: #fafafa; }
    .summary { margin-top: 10px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>REPORTE DE FACTURAS - FARMACIA</h1>
  <p><strong>Período:</strong> ${periodo}</p>
  <p><strong>Fecha de generación:</strong> ${hoy.toLocaleString()}</p>

  <div class="summary">
    <p><strong>Total facturas:</strong> ${resumen.cantidad}</p>
    <p><strong>Pagadas:</strong> ${resumen.pagadas} | <strong>Pendientes:</strong> ${resumen.pendientes}</p>
    <p><strong>Total general:</strong> Bs. ${resumen.total.toFixed(2)}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Cliente</th>
        <th>Email</th>
        <th>Fecha</th>
        <th>Monto</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${filas || `<tr><td colspan="6" style="text-align:center;">Sin datos</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align:right;">TOTAL</td>
        <td style="text-align:right;">Bs. ${resumen.total.toFixed(2)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
    `

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    saveAs(blob, 'reporte_facturas.html')
  }

  if (loading) return <div className="p-8 text-center">Cargando facturas...</div>

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Facturas</h1>
        <p className="text-gray-600">Panel de administración</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={aplicarFiltro}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Aplicar filtro
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={exportarHTML}
            className="bg-gray-700 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            Exportar HTML
          </button>
          <button
            onClick={exportarPDF}
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            Exportar PDF
          </button>
          <button
            onClick={exportarExcel}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-4 text-center">{error}</div>}

      {filteredFacturas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No hay facturas registradas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Factura
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFacturas.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {f.orden.user.firstName} {f.orden.user.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {f.orden.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(f.orden.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      Bs. {f.monto.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          f.estado === 'PAGADA'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {f.facturaUrl ? (
                        <Link
                          href={f.facturaUrl}
                          target="_blank"
                          className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                        >
                          Ver factura
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">No disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
