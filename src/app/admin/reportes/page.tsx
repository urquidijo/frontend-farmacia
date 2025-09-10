import Link from 'next/link'

export default function ReportesIndex() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Reportes</h1>
      <p className="text-sm text-zinc-600">Elige un reporte:</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/admin/reportes/ventas"
          className="rounded-2xl border p-4 hover:shadow transition"
        >
          <div className="font-medium">Reporte de ventas</div>
          <div className="text-sm text-zinc-600">
            Totales, tickets, métodos de pago, por período.
          </div>
        </Link>

        <Link
          href="/admin/reportes/inventario"
          className="rounded-2xl border p-4 hover:shadow transition"
        >
          <div className="font-medium">Reporte de inventario</div>
          <div className="text-sm text-zinc-600">
            Rotación, quiebres de stock, top productos.
          </div>
        </Link>
      </div>
    </div>
  )
}
