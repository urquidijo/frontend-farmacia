"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useCallback, JSX } from "react";

type NavItem = { label: string; href: string };
type NavSection = { id: string; title: string; icon: JSX.Element; items: NavItem[] };

const IconBox = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M4 9h16" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);
const IconShield = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l7 3v6c0 4.5-3 8.5-7 9-4-.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);
const IconCart = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 4h2l2.4 12.3A2 2 0 0 0 9.4 18h7.9a2 2 0 0 0 2-1.6L21 8H6" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="9.5" cy="20" r="1.5" fill="currentColor" />
    <circle cx="17.5" cy="20" r="1.5" fill="currentColor" />
  </svg>
);
const IconChart = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M8 15l3-3 3 2 4-6" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);
const IconCog = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3.7a7 7 0 0 0-1.7-1l-.4-2.4H11l-.4 2.4a7 7 0 0 0-1.7 1L6.6 6l-2 3.5L6.5 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-.7a7 7 0 0 0 1.7 1l.4 2.4h3.2l.4-2.4a7 7 0 0 0 1.7-1l2.3.7 2-3.5-2-1.5c.1-.3.1-.7.1-1Z" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

const SECTIONS: NavSection[] = [
  {
    id: "inv",
    title: "Gestionar Inventario",
    icon: <IconBox />,
    items: [
      { label: "Productos", href: "/admin/inventario/productos" },
      { label: "Alertas", href: "/admin/alerts" },
      { label: "Proveedores", href: "/admin/inventario/proveedores" },
    ],
  },
  {
    id: "sec",
    title: "Gestionar Seguridad",
    icon: <IconShield />,
    items: [
      { label: "Usuarios", href: "/admin/users" },
      { label: "Roles & Permisos", href: "/admin/seguridad/roles" },
      { label: "Bitacora", href: "/admin/seguridad/bitacora" },
    ],
  },
  {
    id: "ven",
    title: "Gestionar Ventas",
    icon: <IconCart />,
    items: [
      { label: "Clientes", href: "/admin/clientes" },
      { label: "Pedidos", href: "/admin/ventas/pedidos" },
      { label: "Facturas", href: "/admin/ventas/facturas" },
    ],
  },
  {
    id: "rep",
    title: "Gestión de Reportes",
    icon: <IconChart />,
    items: [
      { label: "Reporte de ventas", href: "/admin/reportes/ventas" },
      { label: "Reporte de inventario", href: "/admin/reportes/inventario" },
    ],
  },
  {
    id: "adv",
    title: "Administración avanzada",
    icon: <IconCog />,
    items: [
      { label: "Configuración", href: "/admin/avanzado/configuracion" },
      { label: "Auditoría", href: "/admin/avanzado/auditoria" },
    ],
  },
];

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  // Sección abierta por defecto según la ruta activa
  const defaultOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const s of SECTIONS) open[s.id] = s.items.some(i => pathname.startsWith(i.href));
    return open;
  }, [pathname]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(defaultOpen);
  useEffect(() => {
    setOpenMap(prev => {
      const next = { ...prev };
      for (const s of SECTIONS)
        if (s.items.some(i => pathname.startsWith(i.href))) next[s.id] = true;
      return next;
    });
  }, [pathname]);

  const toggle = useCallback((id: string) => setOpenMap(m => ({ ...m, [id]: !m[id] })), []);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Branding + buscador (fijos) */}
      <div className="px-4 py-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center text-white text-sm font-bold">
            FA
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-800">Farmacia · Admin</div>
            <div className="text-xs text-zinc-500">Panel de control</div>
          </div>
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-emerald-500">
            <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <input
              className="w-full outline-none placeholder:text-zinc-400"
              placeholder="Buscar en el panel…"
              aria-label="Buscar en el panel"
            />
          </label>
        </div>
      </div>

      {/* Navegación (solo esto scrollea) */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        {SECTIONS.map(sec => {
          const isOpen = openMap[sec.id];
          return (
            <div key={sec.id} className="rounded-lg">
              <button
                type="button"
                onClick={() => toggle(sec.id)}
                className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-50"
                aria-expanded={isOpen}
                aria-controls={`sec-${sec.id}`}
              >
                <span className="flex items-center gap-2 font-medium text-zinc-800">
                  <span className="text-zinc-500">{sec.icon}</span>
                  {sec.title}
                </span>
                <svg
                  className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5 7l5 5 5-5" />
                </svg>
              </button>

              <div
                id={`sec-${sec.id}`}
                className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
                style={{ maxHeight: isOpen ? 800 : 0, opacity: isOpen ? 1 : 0.6 }}
              >
                <ul className="mt-1 space-y-1 pl-1">
                  {sec.items.map(it => {
                    const active =
                      pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href));
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={onNavigate}
                          className={`relative block rounded-md px-3 py-2 text-sm transition group ${
                            active
                              ? "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600"
                              : "hover:bg-zinc-50 text-zinc-700"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          {it.label}
                          <span
                            className={`absolute left-0 top-1/2 -translate-y-1/2 h-4 rounded-full transition-all ${
                              active ? "w-0" : "w-0 group-hover:w-1 bg-zinc-200"
                            }`}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer fijo dentro de la columna */}
      <div className="px-4 py-3 border-t text-xs text-zinc-500 shrink-0">
        v0.1.0 · © {new Date().getFullYear()} Farmacia
      </div>
    </div>
  );
}
