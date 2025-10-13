'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Loader2, Search, CheckCircle2, XCircle, Calendar, RotateCcw, Download, Printer,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { jsPDF } from 'jspdf'

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
  const header = ['Fecha', 'Hora', 'Usuario', 'Email', 'IP', 'Acción', 'Estado']
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

// --------- Reporte utils (reuso estilo Clientes) ---------
const formatDate = (isoOrYmd: string) => {
  try {
    // admite 'YYYY-MM-DD' (de tu bitácora) o ISO
    const d = isoOrYmd.length === 10 ? new Date(`${isoOrYmd}T00:00:00`) : new Date(isoOrYmd)
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return isoOrYmd
  }
}

const formatLongDate = (isoOrYmd?: string) => {
  try {
    const d = isoOrYmd
      ? (isoOrYmd.length === 10 ? new Date(`${isoOrYmd}T00:00:00`) : new Date(isoOrYmd))
      : new Date()
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(d)
  } catch {
    return isoOrYmd ?? ''
  }
}

const calcMonthsBetween = (start: Date, end: Date) => {
  const years = end.getFullYear() - start.getFullYear()
  const months = end.getMonth() - start.getMonth()
  const total = years * 12 + months + 1
  return Math.max(1, total)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function buildBitacoraReportHTML(
  items: BitacoraRow[],
  periodoStr: string,
  generadoStr: string,
) {
  // KPIs
  const total = items.length
  const exitosos = items.filter(i => i.estado === 'EXITOSO').length
  const fallidos = items.filter(i => i.estado === 'FALLIDO').length
  const tasaExito = total ? Math.round((exitosos / total) * 100) : 0

  // usuarios e IPs únicos
  const usuariosUnicos = new Set(items.map(i => i.user?.id).filter(Boolean)).size
  const ipsUnicas = new Set(items.map(i => i.ip).filter(Boolean)).size

  // promedio por mes (usa rango si hay; sino min/max de datos)
  let months = 1
  if (items.length > 0) {
    const ymdToDate = (ymd: string) => new Date(`${ymd}T00:00:00`)
    const sorted = [...items].sort((a, b) => a.fecha_entrada.localeCompare(b.fecha_entrada))
    const start = ymdToDate(sorted[0].fecha_entrada)
    const end = ymdToDate(sorted[sorted.length - 1].fecha_entrada)
    months = calcMonthsBetween(start, end)
  }
  const promedio = total > 0 ? (total / months) : 0

  const rows = items.map((r, idx) => `
    <tr>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${idx + 1}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${formatDate(r.fecha_entrada)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${r.hora_entrada}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${r.user ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() : '-'}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${r.user?.email ?? '-'}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${r.ip ?? '-'}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${r.acciones ?? '-'}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #ccc;">${r.estado}</td>
    </tr>
  `).join('')

  const css = `
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; }
    .report { width: 210mm; min-height: 297mm; margin: 0 auto; border: 2px solid #333; padding: 16px; display: flex; flex-direction: column; }
    .report-content { flex: 1 1 auto; }
    .report-footer { flex: 0 0 auto; text-align: center; margin-top: auto; padding-top: 8mm; }
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
      <title>Reporte de Bitácora</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="report">
        <div class="report-content">
          <div class="title">REPORTE DE BITÁCORA</div>
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
                  <th>FECHA</th>
                  <th>HORA</th>
                  <th>USUARIO</th>
                  <th>CORREO</th>
                  <th>IP</th>
                  <th>ACCIÓN</th>
                  <th>ESTADO</th>
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
              <li>Total registros: ${total}</li>
              <li>EXITOSOS: ${exitosos}</li>
              <li>FALLIDOS: ${fallidos}</li>
              <li>Tasa de éxito: ${tasaExito}%</li>
              <li>Usuarios únicos: ${usuariosUnicos}</li>
              <li>IPs únicas: ${ipsUnicas}</li>
              <li>Promedio de registros por mes: ${promedio.toFixed(1)}</li>
              <li>Período analizado (aprox.): ${months} ${months === 1 ? 'mes' : 'meses'}</li>
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

function downloadHTML(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  triggerDownload(blob, 'reporte-bitacora.html')
}

function downloadExcel(html: string) {
  const match = html.match(/<table[\s\S]*?<\/table>/i)
  const tableHtml = match ? match[0] : ''
  const xlsHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${tableHtml}</body></html>`
  const blob = new Blob([xlsHtml], { type: 'application/vnd.ms-excel' })
  triggerDownload(blob, 'reporte-bitacora.xls')
}

async function downloadPDF(
  items: BitacoraRow[],
  periodoStr: string,
  generadoStr: string,
) {
  Swal.fire({ title: 'Generando PDF...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } })
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 15
    const innerW = pageW - margin * 2

    // Marco
    doc.setDrawColor(60)
    doc.setLineWidth(0.4)
    doc.rect(5, 5, pageW - 10, pageH - 10)

    let y = margin

    // Título
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('REPORTE DE BITÁCORA', pageW / 2, y, { align: 'center' })
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text('Farmacia', pageW / 2, y, { align: 'center' })
    y += 6
    doc.line(margin, y, pageW - margin, y)
    y += 6

    // Info período
    doc.setFontSize(10)
    doc.text(`PERÍODO: ${periodoStr}`, margin, y); y += 5
    doc.text(`FECHA DE GENERACIÓN: ${generadoStr}`, margin, y); y += 8

    // Cabecera de tabla
    const headers = ['#','FECHA','HORA','USUARIO','CORREO','IP','ACCIÓN','ESTADO']
    // Anchos pensados para A4: suma ~180
    const widths = [8, 18, 16, 36, 38, 24, 28, 12]
    const startX = margin
    const rowH = 6.5

    const drawHeader = () => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      let x = startX
      headers.forEach((h, i) => { doc.text(h, x + 1, y); x += widths[i] })
      doc.setLineWidth(0.5)
      doc.line(margin, y + 2, pageW - margin, y + 2)
      y += 6
    }

    const addPageIfNeeded = () => {
      if (y + rowH > pageH - margin - 30) {
        doc.addPage()
        doc.setDrawColor(60)
        doc.setLineWidth(0.4)
        doc.rect(5, 5, pageW - 10, pageH - 10)
        y = margin
        drawHeader()
      }
    }

    drawHeader()
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)

    const textInCell = (txt: string, x: number, yy: number, w: number) => {
      // Simple recorte si es muy largo (para PDF sin autoTable)
      const maxChars = Math.floor(w / 2.5) // heurística
      const t = (txt ?? '').length > maxChars ? (txt ?? '').slice(0, maxChars - 1) + '…' : (txt ?? '')
      doc.text(String(t || '-'), x + 1, yy)
    }

    items.forEach((r, idx) => {
      addPageIfNeeded()
      let x = startX
      const cells: string[] = [
        String(idx + 1),
        formatDate(r.fecha_entrada),
        r.hora_entrada,
        r.user ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() : '-',
        r.user?.email ?? '-',
        r.ip ?? '-',
        r.acciones ?? '-',
        r.estado,
      ]
      cells.forEach((t, i) => { textInCell(t, x, y, widths[i]); x += widths[i] })
      doc.setDrawColor(200); doc.setLineWidth(0.2)
      doc.line(margin, y + 2.2, pageW - margin, y + 2.2)
      doc.setDrawColor(60)
      y += rowH
    })

    // KPIs
    const total = items.length
    const exitosos = items.filter(i => i.estado === 'EXITOSO').length
    const fallidos = items.filter(i => i.estado === 'FALLIDO').length
    const tasaExito = total ? Math.round((exitosos / total) * 100) : 0
    const usuariosUnicos = new Set(items.map(i => i.user?.id).filter(Boolean)).size
    const ipsUnicas = new Set(items.map(i => i.ip).filter(Boolean)).size
    let months = 1
    if (items.length > 0) {
      const sorted = [...items].sort((a, b) => a.fecha_entrada.localeCompare(b.fecha_entrada))
      const start = new Date(`${sorted[0].fecha_entrada}T00:00:00`)
      const end = new Date(`${sorted[sorted.length - 1].fecha_entrada}T00:00:00`)
      months = calcMonthsBetween(start, end)
    }
    const promedio = total > 0 ? (total / months) : 0

    addPageIfNeeded()
    doc.setLineWidth(0.5); doc.line(margin, y, pageW - margin, y); y += 7
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text('RESUMEN ESTADÍSTICO', pageW / 2, y, { align: 'center' }); y += 7
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    const statLines = [
      `• Total registros: ${total}`,
      `• EXITOSOS: ${exitosos}`,
      `• FALLIDOS: ${fallidos}`,
      `• Tasa de éxito: ${tasaExito}%`,
      `• Usuarios únicos: ${usuariosUnicos}`,
      `• IPs únicas: ${ipsUnicas}`,
      `• Promedio de registros por mes: ${promedio.toFixed(1)}`,
      `• Período analizado (aprox.): ${months} ${months === 1 ? 'mes' : 'meses'}`,
    ]
    statLines.forEach(s => { addPageIfNeeded(); doc.text(s, margin, y); y += 6 })

    // Firma
    const sigY = pageH - margin - 15
    doc.setLineWidth(0.6); doc.setDrawColor(60)
    const lineW = innerW * 0.6; const x1 = (pageW - lineW) / 2
    doc.line(x1, sigY, x1 + lineW, sigY)
    doc.setFontSize(10); doc.text('Responsable del Reporte', pageW / 2, sigY + 6, { align: 'center' })

    doc.save('reporte-bitacora.pdf')
    await Swal.close()
  } catch (err) {
    console.error(err)
    await Swal.close()
    Swal.fire({ title: 'Error', text: 'No se pudo generar el PDF.', icon: 'error' })
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

  // acciones de reporte
  const [showReportActions, setShowReportActions] = useState(false)

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
    setShowReportActions(false)
  }

  // helpers para período/generado
  const periodoStr = from && to
    ? `${formatLongDate(from)} - ${formatLongDate(to)}`
    : 'Todos los registros'
  const generadoStr = formatLongDate()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Bitácora</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if ((from && !to) || (!from && to)) {
                Swal.fire({ title: 'Atención', text: 'Selecciona ambas fechas para el período', icon: 'warning' })
                return
              }
              setShowReportActions(true)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Printer size={18} /> Generar reporte
          </button>
        </div>
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

          <div className="md:col-span-12 flex justify-between items-center">
            {showReportActions ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">Descargar como:</span>
                <button
                  onClick={async () => {
                    await downloadPDF(rows, periodoStr, generadoStr)
                  }}
                  className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
                >
                  PDF
                </button>
                <button
                  onClick={() => {
                    const html = buildBitacoraReportHTML(rows, periodoStr, generadoStr)
                    downloadExcel(html)
                  }}
                  className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                >
                  Excel
                </button>
                <button
                  onClick={() => {
                    const html = buildBitacoraReportHTML(rows, periodoStr, generadoStr)
                    downloadHTML(html)
                  }}
                  className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                >
                  HTML
                </button>
              </div>
            ) : <div />}

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
