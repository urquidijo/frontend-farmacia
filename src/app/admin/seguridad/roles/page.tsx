export default function RolesAdmin() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Roles & Permisos</h1>
      <p className="text-sm text-zinc-600">
        Aquí podrás crear roles y asignarles permisos. (Vista placeholder)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium">Roles</h2>
          <p className="text-sm text-zinc-600">Listado y creación de roles.</p>
        </div>
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium">Permisos</h2>
          <p className="text-sm text-zinc-600">
            Asignación de permisos a cada rol.
          </p>
        </div>
      </div>
    </div>
  )
}
