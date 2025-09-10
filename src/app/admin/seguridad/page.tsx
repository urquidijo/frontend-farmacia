import Link from 'next/link'

export default function SeguridadIndex() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Seguridad</h1>
      <p className="text-sm text-zinc-600">Elige una sección:</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/admin/users"
          className="rounded-2xl border p-4 hover:shadow transition"
        >
          <div className="font-medium">Usuarios</div>
          <div className="text-sm text-zinc-600">
            Crear, editar y eliminar usuarios.
          </div>
        </Link>

        <Link
          href="/admin/seguridad/roles"
          className="rounded-2xl border p-4 hover:shadow transition"
        >
          <div className="font-medium">Roles &amp; Permisos</div>
          <div className="text-sm text-zinc-600">
            Definir roles y asignar permisos.
          </div>
        </Link>
      </div>
    </div>
  )
}
