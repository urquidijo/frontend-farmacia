"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { mostrarConfirmacion, mostrarExito, mostrarError } from "@/lib/alerts";
import { logOk, logFail } from "@/lib/bitacora";
type Role = { id: number; name: string; description?: string | null };
type UserRow = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INACTIVE";
  role: Role | null;
};
type Me = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  permissions: string[];
};
type CreateForm = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId?: number;
};
type UpdateForm = {
  firstName?: string;
  lastName?: string;
  status?: "ACTIVE" | "INACTIVE";
  password?: string;
  roleId?: number;
};

export default function AdminUsers() {
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<UserRow | null>(null);
  const [error, setError] = useState<string>("");
  const userId = Number(localStorage.getItem("auth.userId") ?? 0) || null;
  const ip = localStorage.getItem("auth.ip") ?? null;

  const can = (p: string) => Boolean(me?.permissions?.includes(p));

  useEffect(() => {
    (async () => {
      try {
        const [meRes, uRes, rRes] = await Promise.all([
          fetch("/api/me", { credentials: "include", cache: "no-store" }),
          fetch("/api/users", { credentials: "include", cache: "no-store" }),
          fetch("/api/roles", { credentials: "include", cache: "no-store" }),
        ]);
        setMe(meRes.ok ? await meRes.json() : null);
        setUsers(uRes.ok ? await uRes.json() : []);
        setRoles(rRes.ok ? await rRes.json() : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshUsers = useCallback(async () => {
    const r = await fetch("/api/users", {
      credentials: "include",
      cache: "no-store",
    });
    if (r.ok) setUsers(await r.json());
  }, []);

  // Crear
  async function onCreate(data: CreateForm) {
    setError("");
    const r = await fetch("/api/users/internal", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      await logFail("Crear User", { userId, ip });
      setError(await r.text());
      return;
    }
    await logOk("Crear User", { userId, ip });
    setOpenCreate(false);
    await refreshUsers();
  }

  // Actualizar
  async function onUpdate(id: number, data: UpdateForm) {
    setError("");
    const r = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      setError(await r.text());
      return;
    }
    setOpenEdit(null);
    await refreshUsers();
  }

  // Eliminar
  async function onDelete(u: UserRow) {
    // Mostrar confirmación
    const result = await mostrarConfirmacion({
      titulo: "¿Eliminar usuario?",
      texto: `Se eliminará el usuario ${u.email}`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      icono: "warning",
    });

    if (!result.isConfirmed) return;

    // Llamada al backend
    const r = await fetch(`/api/users/${u.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (r.ok) {
      await refreshUsers();
      mostrarExito("Usuario eliminado correctamente.");
    } else {
      const errorText = await r.text();
      mostrarError(errorText || "No se pudo eliminar el usuario.");
    }
  }

  if (loading) return <p>Cargando…</p>;
  if (!me || !can("user.read")) return <p>No autorizado.</p>;

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        {can("user.create") && (
          <button
            className="rounded-md bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700"
            onClick={() => setOpenCreate(true)}
          >
            Nuevo usuario
          </button>
        )}
      </header>

      {/* Desktop: tabla */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="[&>th]:py-3 [&>th]:px-4 text-left">
                <th className="w-[28%]">Email</th>
                <th className="w-[28%]">Nombre</th>
                <th className="w-[14%]">Estado</th>
                <th className="w-[14%]">Rol</th>
                <th className="w-[16%] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t [&>td]:py-3 [&>td]:px-4">
                  <td className="font-mono text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
                    {u.email}
                  </td>
                  <td className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[260px]">
                    {u.firstName} {u.lastName}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {u.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{u.role?.name ?? "—"}</td>
                  <td className="text-right space-x-2">
                    {can("user.update") && (
                      <button
                        className="px-2 py-1 rounded border hover:bg-zinc-50"
                        onClick={() => setOpenEdit(u)}
                      >
                        Editar
                      </button>
                    )}
                    {can("user.delete") && (
                      <button
                        className="px-2 py-1 rounded border text-rose-600 hover:bg-rose-50"
                        onClick={() => onDelete(u)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    Sin usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <article key={u.id} className="rounded-xl border p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {u.firstName} {u.lastName}
                </div>
                <div className="text-xs text-zinc-500 break-all">{u.email}</div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs shrink-0 ${
                  u.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {u.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-zinc-600">
                {u.role?.name ?? "—"}
              </span>
              <div className="flex gap-2">
                {can("user.update") && (
                  <button
                    className="px-2 py-1 rounded border hover:bg-zinc-50"
                    onClick={() => setOpenEdit(u)}
                    aria-label="Editar usuario"
                  >
                    Editar
                  </button>
                )}
                {can("user.delete") && (
                  <button
                    className="px-2 py-1 rounded border text-rose-600 hover:bg-rose-50"
                    onClick={() => onDelete(u)}
                    aria-label="Eliminar usuario"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Errores */}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {/* Modal Crear */}
      {openCreate && can("user.create") && (
        <UserModal
          title="Crear usuario"
          roles={roles}
          onClose={() => setOpenCreate(false)}
          onSubmit={(payload) => onCreate(payload as CreateForm)}
        />
      )}

      {/* Modal Editar */}
      {openEdit && can("user.update") && (
        <UserModal
          title={`Editar ${openEdit.email}`}
          roles={roles}
          initial={{
            firstName: openEdit.firstName,
            lastName: openEdit.lastName,
            status: openEdit.status,
            roleId: openEdit.role?.id,
          }}
          onClose={() => setOpenEdit(null)}
          onSubmit={(payload) => onUpdate(openEdit.id, payload as UpdateForm)}
          mode="edit"
        />
      )}

      {/* FAB mobile */}
      {can("user.create") && (
        <button
          onClick={() => setOpenCreate(true)}
          className="md:hidden fixed bottom-4 right-4 h-12 w-12 rounded-full bg-emerald-600 text-white text-2xl leading-none shadow-lg"
          aria-label="Nuevo usuario"
        >
          +
        </button>
      )}
    </section>
  );
}

/* ---------------- Modal reutilizable ---------------- */

type ModalProps = {
  title: string;
  roles: Role[];
  onClose: () => void;
  onSubmit: (data: CreateForm | UpdateForm) => void;
  initial?: Partial<CreateForm & UpdateForm>;
  mode?: "create" | "edit";
};

function UserModal({
  title,
  roles,
  onClose,
  onSubmit,
  initial,
  mode = "create",
}: ModalProps) {
  const [email, setEmail] = useState<string>(initial?.email ?? "");
  const [firstName, setFirstName] = useState<string>(initial?.firstName ?? "");
  const [lastName, setLastName] = useState<string>(initial?.lastName ?? "");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    initial?.status ?? "ACTIVE"
  );
  const [roleId, setRoleId] = useState<number | undefined>(initial?.roleId);

  const isEdit = mode === "edit";
  const canSubmit = useMemo(() => {
    if (isEdit) return !!firstName && !!lastName;
    return !!email && !!firstName && !!lastName && password.length >= 6;
  }, [email, firstName, lastName, password, isEdit]);

  // Esc para cerrar + bloquear scroll del fondo
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc as unknown as EventListener);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener(
        "keydown",
        onEsc as unknown as EventListener
      );
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function submit() {
    if (isEdit) {
      const payload: UpdateForm = { firstName, lastName, status, roleId };
      if (password) payload.password = password;
      onSubmit(payload);
    } else {
      const payload: CreateForm = {
        email,
        firstName,
        lastName,
        password,
        roleId,
      };
      onSubmit(payload);
    }
  }

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onBackdropClick}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5 max-h-[85svh] overflow-y-auto">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b bg-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="p-2 rounded hover:bg-zinc-100"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 grid gap-3">
          {!isEdit && (
            <input
              className="border rounded-md px-3 py-2"
              placeholder="email"
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Nombre"
              value={firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFirstName(e.target.value)
              }
              required
            />
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Apellido"
              value={lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLastName(e.target.value)
              }
              required
            />
          </div>

          <input
            className="border rounded-md px-3 py-2"
            placeholder={
              isEdit ? "Cambiar contraseña (opcional)" : "Contraseña"
            }
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            required={!isEdit}
          />

          {isEdit && (
            <select
              className="border rounded-md px-3 py-2"
              value={status}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setStatus(e.target.value as "ACTIVE" | "INACTIVE")
              }
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          )}

          <select
            className="border rounded-md px-3 py-2"
            value={roleId ?? ""}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setRoleId(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">(Sin rol)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Footer sticky */}
        <div className="sticky bottom-0 z-10 px-5 py-3 border-t bg-white flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="px-3 py-2 rounded border hover:bg-zinc-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60 hover:bg-emerald-700"
            disabled={!canSubmit}
            onClick={submit}
          >
            {isEdit ? "Guardar cambios" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
