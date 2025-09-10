
import Link from 'next/link'

export default function InventarioIndex() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Inventario</h1>
      <p className="text-sm text-zinc-600">Elige una sección:</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/admin/inventario/productos" className="rounded-xl border p-4 hover:shadow transition">
          <div className="font-medium">Gestión de productos</div>
          <div className="text-sm text-zinc-600">Crear, editar, listar productos</div>
        </Link>
        <Link href="/admin/inventario/proveedores" className="rounded-xl border p-4 hover:shadow transition">
          <div className="font-medium">Gestión de proveedores</div>
          <div className="text-sm text-zinc-600">Alta, edición y listado de proveedores</div>
        </Link>
      </div>
    </div>
  )
}
