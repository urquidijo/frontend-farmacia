'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Shield,
  ShieldPlus,
  Search,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  CheckSquare,
  Square,
  ChevronRight,
  Info,
  Key,
} from 'lucide-react';

type Permission = { id: number; key: string; description?: string | null };
type Role = {
  id: number;
  name: string;
  description?: string | null;
  permissions?: { permission: Permission }[];
};

type EditingRole = { name: string; description?: string | null };

// ------------------------ Helpers ------------------------
function groupByModule(perms: Permission[]) {
  // "user.read" => módulo "user"
  const map = new Map<string, Permission[]>();
  for (const p of perms) {
    const mod = p.key.includes('.') ? p.key.split('.')[0] : 'otros';
    const arr = map.get(mod) ?? [];
    arr.push(p);
    map.set(mod, arr);
  }
  // order by module asc y por key asc dentro
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k, v.sort((x, y) => x.key.localeCompare(y.key))] as const);
}

function setEquals(a: Set<number>, b: Set<number>) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

// ------------------------ Page ------------------------
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingRight, setLoadingRight] = useState(false);

  const [qRoles, setQRoles] = useState('');
  const [qPerms, setQPerms] = useState('');

  const [editingRole, setEditingRole] = useState<EditingRole | null>(null);

  // checked = permisos seleccionados actualmente (UI)
  const [checked, setChecked] = useState<Set<number>>(new Set());
  // baseline = permisos “guardados” del rol (para detectar cambios)
  const [baseline, setBaseline] = useState<Set<number>>(new Set());

  const [savingPerms, setSavingPerms] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  // ------------------------ Load ------------------------
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [rRoles, rPerms] = await Promise.all([
        fetch('/api/roles?withPerms=true', { cache: 'no-store' }),
        fetch('/api/permissions', { cache: 'no-store' }),
      ]);
      if (!rRoles.ok) throw new Error(await rRoles.text());
      if (!rPerms.ok) throw new Error(await rPerms.text());

      const rolesJson = (await rRoles.json()) as Role[];
      const permsJson = (await rPerms.json()) as Permission[];
      setRoles(rolesJson);
      setAllPerms(permsJson);

      if (rolesJson?.length) {
        const firstId = rolesJson[0].id;
        selectRole(firstId, rolesJson[0], permsJson);
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo cargar Roles/Permisos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // ------------------------ Select Role ------------------------
  function selectRole(id: number, roleObj?: Role, permsSnapshot?: Permission[]) {
    setSelectedId(id);
    const found = roleObj ?? roles.find(r => r.id === id);
    if (!found) return;
    setEditingRole({ name: found.name, description: found.description ?? '' });

    const currentChecked = new Set<number>((found.permissions ?? []).map(p => p.permission.id));
    setChecked(currentChecked);
    setBaseline(new Set(currentChecked));

    // micro UX: carga derecha (si venimos desde otro rol)
    setLoadingRight(true);
    setTimeout(() => setLoadingRight(false), 180);
  }

  // ------------------------ Filters ------------------------
  const filteredRoles = useMemo(() => {
    const term = qRoles.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter(
      r =>
        r.name.toLowerCase().includes(term) ||
        (r.description ?? '').toLowerCase().includes(term),
    );
  }, [qRoles, roles]);

  const filteredPerms = useMemo(() => {
    const term = qPerms.trim().toLowerCase();
    if (!term) return allPerms;
    return allPerms.filter(
      p =>
        p.key.toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term),
    );
  }, [qPerms, allPerms]);

  const grouped = useMemo(() => groupByModule(filteredPerms), [filteredPerms]);

  // ------------------------ UI state helpers ------------------------
  const hasPendingChanges = useMemo(() => !setEquals(checked, baseline), [checked, baseline]);

  function togglePerm(id: number) {
    setChecked(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAllGroup(moduleKey: string) {
    const group = grouped.find(([m]) => m === moduleKey);
    if (!group) return;
    const [, list] = group;
    setChecked(prev => {
      const n = new Set(prev);
      for (const p of list) n.add(p.id);
      return n;
    });
  }

  function selectNoneGroup(moduleKey: string) {
    const group = grouped.find(([m]) => m === moduleKey);
    if (!group) return;
    const [, list] = group;
    setChecked(prev => {
      const n = new Set(prev);
      for (const p of list) n.delete(p.id);
      return n;
    });
  }

  function invertGroup(moduleKey: string) {
    const group = grouped.find(([m]) => m === moduleKey);
    if (!group) return;
    const [, list] = group;
    setChecked(prev => {
      const n = new Set(prev);
      for (const p of list) {
        if (n.has(p.id)) n.delete(p.id);
        else n.add(p.id);
      }
      return n;
    });
  }

  // ------------------------ Actions ------------------------
  async function savePermissions() {
    if (selectedId == null) return;
    try {
      setSavingPerms(true);
      const body = { permissionIds: Array.from(checked) };
      const r = await fetch(`/api/roles/${selectedId}/permissions`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());

      // refrescar roles con include perms
      const r2 = await fetch('/api/roles?withPerms=true', { cache: 'no-store' });
      if (!r2.ok) throw new Error(await r2.text());
      const newRoles = (await r2.json()) as Role[];
      setRoles(newRoles);
      const updated = newRoles.find(x => x.id === selectedId);
      if (updated) {
        selectRole(selectedId, updated, allPerms);
        setBaseline(new Set(Array.from(checked))); // baseline = lo guardado
      }

      Swal.fire('Éxito', 'Permisos guardados', 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo guardar los permisos', 'error');
    } finally {
      setSavingPerms(false);
    }
  }

  async function saveRoleBasics() {
    if (selectedId == null || !editingRole) return;
    try {
      setSavingRole(true);
      const r = await fetch(`/api/roles/${selectedId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editingRole),
      });
      if (!r.ok) throw new Error(await r.text());

      const r2 = await fetch('/api/roles?withPerms=true', { cache: 'no-store' });
      if (!r2.ok) throw new Error(await r2.text());
      const newRoles = (await r2.json()) as Role[];
      setRoles(newRoles);
      const updated = newRoles.find(x => x.id === selectedId);
      if (updated) selectRole(selectedId, updated, allPerms);

      Swal.fire('Éxito', 'Rol actualizado', 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo actualizar el rol', 'error');
    } finally {
      setSavingRole(false);
    }
  }

  async function createRole() {
    const { value: name } = await Swal.fire({
      title: 'Nuevo rol',
      input: 'text',
      inputLabel: 'Nombre del rol',
      inputPlaceholder: 'ADMIN, VENDEDOR, ...',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      inputValidator: v => (!v?.trim() ? 'Ingresa un nombre' : undefined),
    });
    if (!name) return;

    const { value: description } = await Swal.fire({
      title: 'Descripción (opcional)',
      input: 'text',
      inputPlaceholder: 'Breve descripción',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
    });

    try {
      const r = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: String(name).trim(), description: description ?? '' }),
      });
      if (!r.ok) throw new Error(await r.text());
      const newRole = (await r.json()) as Role;

      const r2 = await fetch('/api/roles?withPerms=true', { cache: 'no-store' });
      const list = (await r2.json()) as Role[];
      setRoles(list);
      selectRole(newRole.id, newRole);
      Swal.fire('Éxito', 'Rol creado', 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo crear el rol', 'error');
    }
  }

  async function deleteRole(id: number) {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar rol',
      text: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    try {
      const r = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(await r.text());

      const r2 = await fetch('/api/roles?withPerms=true', { cache: 'no-store' });
      const list = (await r2.json()) as Role[];
      setRoles(list);

      if (list.length) selectRole(list[0].id, list[0]);
      else {
        setSelectedId(null);
        setEditingRole(null);
        setChecked(new Set());
        setBaseline(new Set());
      }
      Swal.fire('Éxito', 'Rol eliminado', 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo eliminar el rol', 'error');
    }
  }

  // ------------------------ Render ------------------------
  if (loading) {
    return (
      <div className="p-6">
        <div className="h-6 w-48 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 space-y-3">
            <div className="h-10 rounded bg-gray-200 animate-pulse" />
            <div className="h-20 rounded bg-gray-200 animate-pulse" />
            <div className="h-20 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="col-span-8 space-y-3">
            <div className="h-14 rounded bg-gray-200 animate-pulse" />
            <div className="h-64 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-600" />
          <h1 className="text-xl md:text-2xl font-semibold">Roles & Permisos</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={createRole}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
          >
            <ShieldPlus size={18} />
            Nuevo rol
          </button>
          <button
            onClick={() => void fetchAll()}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
            title="Refrescar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Roles list */}
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-xl border bg-white">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full rounded-lg border px-9 py-2"
                  placeholder="Buscar rol..."
                  value={qRoles}
                  onChange={e => setQRoles(e.target.value)}
                />
              </div>
            </div>
            <ul className="divide-y">
              {filteredRoles.map(r => {
                const count = r.permissions?.length ?? 0;
                const active = selectedId === r.id;
                return (
                  <li key={r.id} className={`flex items-center justify-between px-3 py-2 ${active ? 'bg-emerald-50/60' : ''}`}>
                    <button
                      onClick={() => selectRole(r.id, r)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} className={`transition ${active ? 'rotate-90 text-emerald-700' : 'text-gray-400'}`} />
                        <div className={`font-medium ${active ? 'text-emerald-800' : 'text-gray-800'}`}>{r.name}</div>
                        {r.description && (
                          <span className="text-xs text-gray-500 truncate max-w-[10rem]">{r.description}</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                        <Key size={12} /> {count} permisos
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteRole(r.id)}
                        className="rounded p-2 text-rose-600 hover:bg-rose-50"
                        title="Eliminar rol"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
              {!filteredRoles.length && (
                <li className="px-3 py-5 text-sm text-gray-500">Sin resultados</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="col-span-12 lg:col-span-8">
          <div className="rounded-xl border bg-white p-4 space-y-6">
            {!selectedId || !editingRole ? (
              <div className="text-sm text-gray-500">Selecciona un rol para editar.</div>
            ) : (
              <>
                {/* Header / basics */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Nombre</label>
                    <div className="relative">
                      <input
                        className="w-full rounded-lg border px-3 py-2"
                        value={editingRole.name}
                        onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                      />
                      {savingRole && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={16} />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Descripción</label>
                    <input
                      className="w-full rounded-lg border px-3 py-2"
                      value={editingRole.description ?? ''}
                      onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <button
                      onClick={saveRoleBasics}
                      disabled={savingRole}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-blue-700"
                    >
                      <Save size={18} />
                      {savingRole ? 'Guardando...' : 'Guardar rol'}
                    </button>
                    {hasPendingChanges && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        Cambios de permisos pendientes
                      </span>
                    )}
                  </div>
                </div>

                {/* Permisos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Permisos</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Info size={14} /> Marca/desmarca y luego guarda.
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        className="w-full rounded-lg border px-9 py-2"
                        placeholder="Filtrar permisos por texto..."
                        value={qPerms}
                        onChange={e => setQPerms(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <span className="rounded-full bg-gray-100 px-2 py-1">{checked.size} seleccionados</span>
                      <span className="rounded-full bg-gray-100 px-2 py-1">{allPerms.length} totales</span>
                    </div>
                  </div>

                  <div className={`max-h-[520px] overflow-auto rounded-lg border ${loadingRight ? 'opacity-60 pointer-events-none' : ''}`}>
                    {loadingRight ? (
                      <div className="p-6 flex items-center gap-2 text-gray-500">
                        <Loader2 className="animate-spin" size={16} /> cargando...
                      </div>
                    ) : (
                      <div className="divide-y">
                        {grouped.map(([moduleKey, list]) => {
                          const selectedInGroup = list.filter(p => checked.has(p.id)).length;
                          const allSelected = selectedInGroup === list.length && list.length > 0;
                          const noneSelected = selectedInGroup === 0;
                          return (
                            <div key={moduleKey} className="p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold capitalize">{moduleKey}</div>
                                  <span className="text-xs text-gray-500">
                                    {selectedInGroup}/{list.length}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => selectAllGroup(moduleKey)}
                                    className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-gray-50"
                                    title="Seleccionar todo"
                                  >
                                    <CheckSquare size={14} />
                                    Todo
                                  </button>
                                  <button
                                    onClick={() => selectNoneGroup(moduleKey)}
                                    className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-gray-50"
                                    title="Seleccionar ninguno"
                                  >
                                    <Square size={14} />
                                    Ninguno
                                  </button>
                                  <button
                                    onClick={() => invertGroup(moduleKey)}
                                    className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-gray-50"
                                    title="Invertir selección"
                                  >
                                    ± Invertir
                                  </button>
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {list.map(p => (
                                  <label
                                    key={p.id}
                                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 ${
                                      checked.has(p.id) ? 'border-emerald-300 bg-emerald-50/40' : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-0.5"
                                      checked={checked.has(p.id)}
                                      onChange={() => togglePerm(p.id)}
                                    />
                                    <div>
                                      <div className="text-sm font-medium">{p.key}</div>
                                      {p.description ? (
                                        <div className="text-xs text-gray-500">{p.description}</div>
                                      ) : null}
                                    </div>
                                  </label>
                                ))}
                              </div>

                              <div className="mt-2 text-xs text-gray-500">
                                {allSelected ? 'Todos seleccionados' : noneSelected ? 'Ninguno seleccionado' : 'Selección mixta'}
                              </div>
                            </div>
                          );
                        })}
                        {!grouped.length && (
                          <div className="p-6 text-sm text-gray-500">No hay permisos que coincidan con el filtro.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sticky footer actions */}
                  <div className="sticky bottom-2 mt-2">
                    <div className="rounded-xl border bg-white p-3 shadow-sm flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        {hasPendingChanges ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                            Cambios sin guardar
                          </span>
                        ) : (
                          <span className="text-gray-500">Sin cambios pendientes</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setChecked(new Set(baseline))}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
                          disabled={!hasPendingChanges}
                        >
                          <RefreshCw size={16} />
                          Revertir
                        </button>
                        <button
                          onClick={savePermissions}
                          disabled={savingPerms || !hasPendingChanges}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-emerald-700"
                        >
                          <Save size={16} />
                          {savingPerms ? 'Guardando...' : 'Guardar permisos'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
