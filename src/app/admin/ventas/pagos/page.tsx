export default function PagosAdmin() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Gestión de pagos</h1>

      {/* Filtros placeholder */}
      <div className="rounded-xl border p-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <input className="border rounded-md px-3 py-2 w-full md:w-64" placeholder="Buscar por #transacción o cliente" />
        <select className="border rounded-md px-3 py-2 w-full md:w-48">
          <option value="">Método (todos)</option>
          <option value="CARD">Tarjeta</option>
          <option value="QR">QR</option>
          <option value="CASH">Efectivo</option>
        </select>
        <select className="border rounded-md px-3 py-2 w-full md:w-48">
          <option value="">Estado (todos)</option>
          <option value="PENDING">Pendiente</option>
          <option value="PAID">Pagado</option>
          <option value="FAILED">Fallido</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button className="px-3 py-2 rounded border hover:bg-zinc-50">Filtrar</button>
          <button className="px-3 py-2 rounded border hover:bg-zinc-50">Exportar</button>
        </div>
      </div>

      {/* Tabla placeholder (desktop) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="[&>th]:py-3 [&>th]:px-4 text-left">
              <th># Tx</th>
              <th>Pedido</th>
              <th>Método</th>
              <th>Estado</th>
              <th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t [&>td]:py-3 [&>td]:px-4">
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td><span className="px-2 py-1 rounded-full text-xs bg-zinc-100 text-zinc-600">—</span></td>
              <td className="text-right">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cards placeholder (mobile) */}
      <div className="md:hidden space-y-3">
        <article className="rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Tx: —</div>
            <span className="px-2 py-1 rounded-full text-xs bg-zinc-100 text-zinc-600">—</span>
          </div>
          <div className="text-sm text-zinc-600 mt-1">Pedido: —</div>
          <div className="text-sm text-zinc-600">Método: —</div>
          <div className="mt-2 text-right font-medium">Monto: —</div>
        </article>
      </div>
    </div>
  )
}
