"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AdminSidebar from "@/components/AdminSidebar";

type Me = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  permissions: string[];
};

type AlertSummaryItem = {
  id: number;
  type: "STOCK_BAJO" | "VENCIMIENTO";
  severity: "INFO" | "WARNING" | "CRITICAL";
  mensaje: string;
  venceEnDias?: number | null;
  producto: {
    id: number;
    nombre: string;
  };
};

type AlertsOverview = {
  unread: number;
  top: AlertSummaryItem[];
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMobile, setOpenMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertsOverview, setAlertsOverview] = useState<AlertsOverview | null>(null);
  const [alertToastShown, setAlertToastShown] = useState(false);

  const can = (p: string) => Boolean(me?.permissions?.includes(p));
  const canAlertRead = useMemo(
    () => me?.permissions?.includes("alert.read") ?? false,
    [me],
  );

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

  const fetchAlertsOverview = useCallback(async () => {
    if (!canAlertRead) return;
    try {
      const res = await fetch("/api/alerts?unreadOnly=true&pageSize=5", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      const items = Array.isArray(json?.data) ? (json.data as AlertSummaryItem[]) : [];
      setAlertsOverview({
        unread: json?.meta?.unread ?? items.length,
        top: items,
      });
      const critical = items.filter(item => item.severity === "CRITICAL");
      if (!alertToastShown && critical.length) {
        setAlertToastShown(true);
        const listHtml = critical
          .slice(0, 3)
          .map(
            item =>
              `<li style="text-align:left;margin-bottom:4px;"><strong>${item.producto.nombre}</strong> &mdash; ${
                item.type === "STOCK_BAJO" ? "Stock critico" : "Vencimiento inminente"
              }</li>`,
          )
          .join("");
        void Swal.fire({
          icon: "warning",
          title: "Alertas criticas",
          html: `<ul style="margin:0;padding-left:18px;">${listHtml}</ul>`,
          confirmButtonText: "Ver todas",
          showCancelButton: true,
          cancelButtonText: "Cerrar",
        }).then(result => {
          if (result.isConfirmed) {
            router.push("/admin/alerts");
          }
        });
      }
    } catch (error) {
      console.error("No se pudo cargar el resumen de alertas", error);
    }
  }, [alertToastShown, canAlertRead, router]);

  useEffect(() => {
    fetchMe();
    const onAuth = () => fetchMe();
    window.addEventListener("auth:changed", onAuth);
    return () => window.removeEventListener("auth:changed", onAuth);
  }, [fetchMe]);

  useEffect(() => {
    fetchAlertsOverview();
  }, [fetchAlertsOverview]);

  useEffect(() => {
    if (!canAlertRead) return;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    if (!base) return;
    const sanitizedBase = base.replace(/\/$/, "");
    const streamUrl = `${sanitizedBase}/alerts/stream`;
    let source: EventSource | null = null;
    try {
      source = new EventSource(streamUrl, { withCredentials: true });
      source.onmessage = () => {
        fetchAlertsOverview();
      };
      source.onerror = () => {
        source?.close();
      };
    } catch (error) {
      console.error("No se pudo abrir el stream de alertas", error);
    }
    return () => {
      source?.close();
    };
  }, [canAlertRead, fetchAlertsOverview]);

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
            aria-label="Abrir menu"
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
              placeholder="Buscar (usuarios, pedidos, productos...)"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {canAlertRead && (
              <button
                onClick={() => router.push("/admin/alerts")}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Ver alertas"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 6a4 4 0 0 1 4 4v1.5c0 .6.2 1.2.6 1.7l1.2 1.6c.8 1.1.1 2.7-1.3 2.7H7.5c-1.4 0-2.1-1.6-1.3-2.7l1.2-1.6c.4-.5.6-1.1.6-1.7V10a4 4 0 0 1 4-4Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M10 19a2 2 0 1 0 4 0"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
                {alertsOverview?.unread ? (
                  <span className="absolute -top-1 -right-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {Math.min(alertsOverview.unread, 99)}
                  </span>
                ) : null}
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-zinc-100"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-semibold">
                  {initials}
                </div>
                <span className="hidden sm:block max-w-[180px] truncate text-sm text-zinc-700">
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
                  className="absolute right-0 mt-2 w-48 rounded-xl border bg-white py-1 text-sm shadow-xl ring-1 ring-black/5 z-50"
                >
                  <Link
                    href="/"
                    className="block px-3 py-2 hover:bg-zinc-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Ver sitio
                  </Link>
                  <button
                    className="w-full px-3 py-2 text-left text-rose-600 hover:bg-zinc-50"
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
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
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
