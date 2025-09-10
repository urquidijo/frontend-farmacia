"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

type Me = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  permissions: string[];
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMobile, setOpenMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const can = (p: string) => Boolean(me?.permissions?.includes(p));

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch("/api/me", {
        credentials: "include",
        cache: "no-store",
      });
      setMe(r.ok ? await r.json() : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    const onAuth = () => fetchMe();
    window.addEventListener("auth:changed", onAuth);
    return () => window.removeEventListener("auth:changed", onAuth);
  }, [fetchMe]);

  const initials = useMemo(() => {
    if (!me) return "??";
    const a = (me.firstName || "").trim()[0] || "";
    const b = (me.lastName || "").trim()[0] || "";
    return (a + b || me.email[0] || "?").toUpperCase();
  }, [me]);

  if (loading) return <p className="p-6">Cargando…</p>;

  if (!me || !can("user.read")) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">No autorizado</h1>
        <p className="text-sm text-zinc-600">
          Tu usuario no tiene permisos para acceder al panel.
        </p>
        <Link className="text-emerald-700" href="/">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header fijo */}
      <header className="fixed inset-x-0 top-0 z-50 h-14 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="h-full px-4 flex items-center gap-3">
          {/* Toggle mobile */}
          <button
            className="md:hidden p-2 rounded hover:bg-zinc-100"
            onClick={() => setOpenMobile((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={openMobile}
            aria-controls="mobile-sidebar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>

          <Link href="/admin" className="font-semibold tracking-tight">
            Panel Admin
          </Link>
          <span className="ml-2 rounded-full bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5">
            Farmacia
          </span>

          {/* Buscador top */}
          <div className="hidden md:flex items-center gap-2 ml-6 flex-1 max-w-2xl rounded-lg border bg-white px-3 py-1.5 text-sm focus-within:ring-1 focus-within:ring-emerald-500">
            <svg
              className="h-4 w-4 text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
            <input
              className="w-full outline-none placeholder:text-zinc-400"
              placeholder="Buscar (usuarios, pedidos, productos…)"
            />
          </div>

          {/* Perfil */}
          <div className="ml-auto relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full hover:bg-zinc-100 px-2 py-1"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-semibold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm text-zinc-700 max-w-[180px] truncate">
                {me?.firstName} {me?.lastName}
              </span>
              <svg
                className="h-4 w-4 text-zinc-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 7l5 5 5-5" />
              </svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-xl ring-1 ring-black/5 py-1 text-sm z-50"
              >
                <Link
                  href="/"
                  className="block px-3 py-2 hover:bg-zinc-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Ver sitio
                </Link>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-zinc-50 text-rose-600"
                  onClick={async () => {
                    setMenuOpen(false);
                    await fetch("/api/auth/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    window.dispatchEvent(new Event("auth:changed"));
                    location.assign("/");
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar fijo en desktop */}
      <aside
        className="hidden md:block fixed top-14 bottom-0 left-0 w-72 border-r bg-white overflow-y-auto z-40"
        aria-label="Barra lateral de administración"
      >
        <AdminSidebar />
      </aside>

      {/* Contenido: empuja por header y sidebar (desktop) */}
      <main className="pt-14 md:pl-72 p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Sidebar móvil (overlay) */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition ${
          openMobile ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            openMobile ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpenMobile(false)}
        />
        <div
          id="mobile-sidebar"
          className={`absolute top-14 bottom-0 left-0 w-72 max-w-[80%] bg-white shadow-xl transform transition-transform ${
            openMobile ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar onNavigate={() => setOpenMobile(false)} />
        </div>
      </div>
    </div>
  );
}
