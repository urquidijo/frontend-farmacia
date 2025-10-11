'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, User, Printer } from 'lucide-react'

import Swal from 'sweetalert2'
import { jsPDF } from 'jspdf'

interface Cliente {
  id: number
  firstName: string
  lastName?: string
  email: string
  telefono?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export default function ClientesAdmin() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    telefono: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  })

  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [showReportActions, setShowReportActions] = useState(false)

  // Utilidades para reporte
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d)
    } catch {
      return iso
    }
  }

  const formatLongDate = (isoOrNow?: string) => {
    const d = isoOrNow ? new Date(isoOrNow) : new Date()
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d)
  }

  const calcMonthsBetween = (start: Date, end: Date) => {
    const years = end.getFullYear() - start.getFullYear()
    const months = end.getMonth() - start.getMonth()
    const total = years * 12 + months + 1
    return Math.max(1, total)
  }

  const buildReportHTML = (items: Cliente[]) => {
    const now = new Date()
    const periodoStr = fechaInicio && fechaFin
      ? `${formatLongDate(fechaInicio)} - ${formatLongDate(fechaFin)}`
      : 'Todos los registros'
    const generadoStr = formatLongDate()

    // Estadísticas
    const total = items.length
    const activos = items.filter(i => i.status === 'ACTIVE').length
    const pctActivos = total > 0 ? Math.round((activos / total) * 100) : 0

    // Promedio mensual
    let months = 1
    if (fechaInicio && fechaFin) {
      months = calcMonthsBetween(new Date(fechaInicio), new Date(fechaFin))
    } else if (items.length > 0) {
      const dates = items.map(i => new Date(i.createdAt)).sort((a, b) => +a - +b)
      months = calcMonthsBetween(dates[0], dates[dates.length - 1])
    }
    const promedio = total > 0 ? (total / months) : 0

    const rows = items.map((c, idx) => `
      <tr>
        <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${idx + 1}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${c.firstName} ${c.lastName ?? ''}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${c.email}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${c.telefono || '-'}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${c.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${formatDate(c.createdAt)}</td>
      </tr>
    `).join('')

    const css = `
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111; }
      /* A4 portrait visuals */
      .report { width: 210mm; min-height: 297mm; margin: 0 auto; border: 2px solid #333; padding: 16px; display: flex; flex-direction: column; }
      .report-content { flex: 1 1 auto; }
      .report-footer { flex: 0 0 auto; text-align: center; margin-top: auto; padding-top: 8mm; border-top: none; }
      .title { text-align:center; font-weight: bold; font-size: 18px; margin-top: 8px; }
      .subtitle { text-align:center; font-size: 14px; margin-bottom: 8px; }
      .section { border-top: 1px solid #333; margin-top: 12px; padding-top: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; border-bottom: 2px solid #333; padding: 6px 8px; font-size: 12px; }
      td { font-size: 12px; padding: 4px 8px; border-bottom: 1px solid #ccc; }
      .muted { color: #333; font-size: 12px; }
      .center { text-align:center; }
      .stats li { margin: 4px 0; }
      .signature-line { width: 60%; margin: 16px auto 0; border-top: 1px solid #333; padding-top: 8px; }
    `

    const html = `<!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Reporte de Clientes</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="report">
          <div class="report-content">
            <div class="title">REPORTE DE CLIENTES</div>
            <div class="subtitle">Farmacia</div>

            <div class="section">
              <div class="muted">PERÍODO: ${periodoStr}</div>
              <div class="muted">FECHA DE GENERACIÓN: ${generadoStr}</div>
            </div>

            <div class="section">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>NOMBRE COMPLETO</th>
                    <th>CORREO</th>
                    <th>TELÉFONO</th>
                    <th>ESTADO</th>
                    <th>FECHA</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>

            <div class="section center">
              <div style="font-weight:bold;">RESUMEN ESTADÍSTICO</div>
              <ul class="stats" style="list-style: disc; display:inline-block; text-align:left;">
                <li>Total clientes: ${total}</li>
                <li>Total clientes activos: ${activos} (${pctActivos}%)</li>
                <li>Promedio de registros por mes: ${promedio.toFixed(1)}</li>
                <li>Período analizado: ${months} ${months === 1 ? 'mes' : 'meses'}</li>
              </ul>
            </div>
          </div>

          <div class="report-footer">
            <div class="signature-line">Responsable del Reporte</div>
          </div>
        </div>
      </body>
    </html>`

    return html
  }

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadHTML = (html: string) => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    triggerDownload(blob, 'reporte-clientes.html')
  }

  const downloadExcel = (html: string) => {
    const match = html.match(/<table[\s\S]*?<\/table>/i)
    const tableHtml = match ? match[0] : ''
    const xlsHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${tableHtml}</body></html>`
    const blob = new Blob([xlsHtml], { type: 'application/vnd.ms-excel' })
    triggerDownload(blob, 'reporte-clientes.xls')
  }

  const downloadPDF = async (items: Cliente[]) => {
    Swal.fire({ title: 'Generando PDF...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } })
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 15
      const innerW = pageW - margin * 2

      const periodoStr = fechaInicio && fechaFin
        ? `${formatLongDate(fechaInicio)} - ${formatLongDate(fechaFin)}`
        : 'Todos los registros'
      const generadoStr = formatLongDate()

      // Borde exterior
      doc.setDrawColor(60)
      doc.setLineWidth(0.4)
      doc.rect(5, 5, pageW - 10, pageH - 10)

      let y = margin

      // Título
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('REPORTE DE CLIENTES', pageW / 2, y, { align: 'center' })
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text('Farmacia', pageW / 2, y, { align: 'center' })
      y += 6
      // Separador
      doc.line(margin, y, pageW - margin, y)
      y += 6

      // Info
      doc.setFontSize(10)
      doc.text(`PERÍODO: ${periodoStr}`, margin, y)
      y += 5
      doc.text(`FECHA DE GENERACIÓN: ${generadoStr}`, margin, y)
      y += 8

      // Cabecera tabla
      const headers = ['#', 'NOMBRE COMPLETO', 'CORREO', 'TELÉFONO', 'ESTADO', 'FECHA']
      const widths = [8, 48, 48, 30, 20, 26] // total 180 aprox
      const startX = margin
      const rowH = 7

      const drawTableHeader = () => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        let x = startX
        headers.forEach((h, i) => {
          doc.text(h, x + 1, y)
          x += widths[i]
        })
        // línea bajo header
        doc.setLineWidth(0.5)
        doc.line(margin, y + 2, pageW - margin, y + 2)
        y += 6
      }

      const addPageIfNeeded = () => {
        if (y + rowH > pageH - margin - 25) { // dejar espacio para firma
          doc.addPage()
          // marco
          doc.setDrawColor(60)
          doc.setLineWidth(0.4)
          doc.rect(5, 5, pageW - 10, pageH - 10)
          y = margin
          drawTableHeader()
        }
      }

      drawTableHeader()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      items.forEach((c, idx) => {
        addPageIfNeeded()
        let x = startX
        const cells = [
          String(idx + 1),
          `${c.firstName} ${c.lastName ?? ''}`.trim(),
          c.email,
          c.telefono || '-',
          c.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
          formatDate(c.createdAt),
        ]
        cells.forEach((t, i) => {
          doc.text(String(t), x + 1, y)
          x += widths[i]
        })
        // línea separadora
        doc.setDrawColor(200)
        doc.setLineWidth(0.2)
        doc.line(margin, y + 2.5, pageW - margin, y + 2.5)
        doc.setDrawColor(60)
        y += rowH
      })

      // Resumen estadístico
      const total = items.length
      const activos = items.filter(i => i.status === 'ACTIVE').length
      const pctActivos = total > 0 ? Math.round((activos / total) * 100) : 0
      let months = 1
      if (fechaInicio && fechaFin) {
        months = calcMonthsBetween(new Date(fechaInicio), new Date(fechaFin))
      } else if (items.length > 0) {
        const dates = items.map(i => new Date(i.createdAt)).sort((a, b) => +a - +b)
        months = calcMonthsBetween(dates[0], dates[dates.length - 1])
      }
      const promedio = total > 0 ? (total / months) : 0

      addPageIfNeeded()
      // separador
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageW - margin, y)
      y += 7
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('RESUMEN ESTADÍSTICO', pageW / 2, y, { align: 'center' })
      y += 7
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const statLines = [
        `• Total clientes: ${total}`,
        `• Total clientes activos: ${activos} (${pctActivos}%)`,
        `• Promedio de registros por mes: ${promedio.toFixed(1)}`,
        `• Período analizado: ${months} ${months === 1 ? 'mes' : 'meses'}`,
      ]
      statLines.forEach(s => {
        addPageIfNeeded()
        doc.text(s, margin, y)
        y += 6
      })

      // Firma al pie de la última página
      const sigY = pageH - margin - 15
      doc.setLineWidth(0.6)
      doc.setDrawColor(60)
      const lineW = innerW * 0.6
      const x1 = (pageW - lineW) / 2
      doc.line(x1, sigY, x1 + lineW, sigY)
      doc.setFontSize(10)
      doc.text('Responsable del Reporte', pageW / 2, sigY + 6, { align: 'center' })

      doc.save('reporte-clientes.pdf')
      await Swal.close()
    } catch (err) {
      console.error('Error generando PDF directo:', err)
      await Swal.close()
      Swal.fire({ title: 'Error', text: 'No se pudo generar el PDF.', icon: 'error' })
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [page])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1)
      fetchClientes()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [fechaInicio, fechaFin])

  const fetchClientes = async () => {
    try {
      let url = '/api/users/clientes'
      
      if (fechaInicio && fechaFin) {
        const params = new URLSearchParams({
          fechaInicial: fechaInicio,
          fechaFinal: fechaFin,
        })
        url = `/api/users/clientes/by-date-range?${params}`
      } else {
        const params = new URLSearchParams({
          page: page.toString(),
          size: '10',
        })
        url = `/api/users/clientes?${params}`
      }

      const response = await fetch(url, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (fechaInicio && fechaFin) {
          setClientes(data.clientes || [])
          setTotalPages(1)
        } else {
          setClientes(data.users || data)
          setTotalPages(data.totalPages || 1)
        }
      }
    } catch (error) {
      console.error('Error fetching clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName || null,
        email: formData.email,
        telefono: formData.telefono || null,
        status: formData.status,
      }

      const url = editingCliente ? `/api/users/${editingCliente.id}` : '/api/users/internal'
      const method = editingCliente ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        Swal.fire({
          title: 'Éxito',
          text: `Cliente ${editingCliente ? 'actualizado' : 'creado'} correctamente`,
          icon: 'success',
        })
        setShowModal(false)
        resetForm()
        fetchClientes()
      } else {
        const error = await response.text()
        throw new Error(error)
      }
    } catch (error) {
      console.error('Error:', error)
      Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Hubo un problema al guardar el cliente',
        icon: 'error',
      })
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      firstName: cliente.firstName,
      lastName: cliente.lastName || '',
      email: cliente.email,
      telefono: cliente.telefono || '',
      status: cliente.status,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (response.ok) {
          Swal.fire('Eliminado', 'El cliente ha sido eliminado', 'success')
          fetchClientes()
        } else {
          throw new Error('Error al eliminar')
        }
      } catch (error) {
        console.error('Error:', error)
        Swal.fire('Error', 'No se pudo eliminar el cliente', 'error')
      }
    }
  }

  const handleGenerarReporte = async () => {
    if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
      Swal.fire({
        title: 'Atención',
        text: 'Por favor selecciona ambas fechas para filtrar por rango',
        icon: 'warning',
      })
      return
    }

    setShowReportActions(true)
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      telefono: '',
      status: 'ACTIVE',
    })
    setEditingCliente(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Gestión de Clientes</h1>
      </div>

      {/* Filtros de fecha y reporte */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleGenerarReporte}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Printer size={20} />
              Generar Reporte
            </button>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => {
                setFechaInicio('')
                setFechaFin('')
                setPage(1)
                setShowReportActions(false)
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {showReportActions && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Descargar como:</span>
            <button
              onClick={async () => {
                await downloadPDF(clientes)
              }}
              className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
            >
              PDF
            </button>
            <button
              onClick={() => {
                const html = buildReportHTML(clientes)
                downloadExcel(html)
              }}
              className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
            >
              Excel
            </button>
            <button
              onClick={() => {
                const html = buildReportHTML(clientes)
                downloadHTML(html)
              }}
              className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
            >
              HTML
            </button>
          </div>
        )}
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {cliente.firstName} {cliente.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cliente.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cliente.telefono || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      cliente.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {cliente.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cliente.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={16} />
                  </button>
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
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Editar Cliente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Correo *</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}