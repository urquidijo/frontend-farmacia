"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AlertType = "STOCK_BAJO" | "VENCIMIENTO";
type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

type AlertItem = {
  id: number;
  type: AlertType;
  severity: AlertSeverity;
  mensaje: string;
  venceEnDias?: number | null;
  stockActual?: number | null;
  stockMinimo?: number | null;
  windowDias: number;
  leida: boolean;
  createdAt: string;
  resolvedAt?: string | null;
  producto: {
    id: number;
    nombre: string;
    marca?: string | null;
    categoria?: string | null;
    stockActual: number | null;
    stockMinimo: number | null;
  };
  lote?: {
    id: number;
    codigo?: string | null;
    cantidad?: number | null;
    fechaVenc?: string | null;
  };
};

type AlertsResponse = {
  data: AlertItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    unread: number;
  };
};

const TYPE_OPTIONS = [
  { value: "all", label: "Todos los tipos" },
  { value: "stock", label: "Stock bajo" },
  { value: "expiry", label: "Vencimiento" },
] as const;

const SEVERITY_OPTIONS = [
  { value: "all", label: "Todas las severidades" },
  { value: "CRITICAL", label: "Criticas" },
  { value: "WARNING", label: "Advertencias" },
  { value: "INFO", label: "Informativas" },
] as const;

const WINDOW_OPTIONS = [7, 15, 30] as const;

const STREAM_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
    : "";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [meta, setMeta] = useState<AlertsResponse["meta"]>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    unread: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]["value"]>("all");
  const [severityFilter, setSeverityFilter] = useState<(typeof SEVERITY_OPTIONS)[number]["value"]>(
    "all",
  );
  const [windowDays, setWindowDays] = useState<(typeof WINDOW_OPTIONS)[number]>(30);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [canManage, setCanManage] = useState(false);

  const severityBadge = useCallback((severity: AlertSeverity) => {
    const base =
      severity === "CRITICAL"
        ? "bg-rose-100 text-rose-700 border border-rose-200"
        : severity === "WARNING"
        ? "bg-amber-100 text-amber-700 border border-amber-200"
        : "bg-sky-100 text-sky-700 border border-sky-200";
    const label =
      severity === "CRITICAL" ? "Critica" : severity === "WARNING" ? "Advertencia" : "Informativa";
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${base}`}>{label}</span>;
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const perms: string[] = json?.permissions || [];
      setCanManage(perms.includes("alert.manage"));
    } catch (err) {
      console.error("No se pudo obtener el perfil", err);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("windowDays", String(windowDays));
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      if (unreadOnly) params.set("unreadOnly", "true");
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/alerts?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Error al obtener alertas");
      }
      const data = (await res.json()) as AlertsResponse;
      setAlerts(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudo cargar las alertas");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, windowDays, typeFilter, severityFilter, unreadOnly, search]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (!autoRefresh || !STREAM_BASE) return;
    const source = new EventSource(`${STREAM_BASE}/alerts/stream`, { withCredentials: true });
    source.onmessage = () => {
      fetchAlerts();
    };
    source.onerror = () => {
      source.close();
    };
    return () => source.close();
  }, [autoRefresh, fetchAlerts]);

  const unreadCount = meta.unread;
  const emptyState = !loading && !alerts.length;

  const handleMarkRead = async (id: number) => {
    try {
      const res = await fetch(`/api/alerts/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("No se pudo marcar como leida");
      }
      await fetchAlerts();
    } catch (err) {
      console.error(err);
      setError("No se pudo marcar la alerta como leida");
    }
  };

  const handleMarkAll = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter === "stock" || typeFilter === "expiry") {
        params.set("type", typeFilter);
      }
      const res = await fetch(`/api/alerts/read-all?${params.toString()}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("No se pudieron marcar las alertas");
      }
      await fetchAlerts();
    } catch (err) {
      console.error(err);
      setError("No se pudieron marcar las alertas como leidas");
    }
  };

  const totalPages = meta.totalPages || 1;

  const summaryText = useMemo(() => {
    if (!meta.total) return "Sin alertas registradas.";
    return `${meta.total} alerta${meta.total === 1 ? "" : "s"} registradas (${unreadCount} sin leer)`;
  }, [meta.total, unreadCount]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Alertas de inventario</h1>
          <p className="text-sm text-zinc-600">{summaryText}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refrescar
          </label>
          {canManage && (
            <button
              onClick={handleMarkAll}
              className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Marcar todas como leidas
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-1">
          <label className="text-xs font-medium text-zinc-600">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as typeof TYPE_OPTIONS[number]["value"]);
              setPage(1);
            }}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label className="text-xs font-medium text-zinc-600">Severidad</label>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value as typeof SEVERITY_OPTIONS[number]["value"]);
              setPage(1);
            }}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label className="text-xs font-medium text-zinc-600">Ventana (dias)</label>
          <select
            value={windowDays}
            onChange={(e) => {
              setWindowDays(Number(e.target.value) as (typeof WINDOW_OPTIONS)[number]);
              setPage(1);
            }}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            {WINDOW_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} dias
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1 flex items-end">
          <label className="flex gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
            />
            Solo sin leer
          </label>
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-zinc-600">Buscar</label>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Producto, categoria o lote"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Lote</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Dias restantes</th>
              <th className="px-4 py-3 text-left">Severidad</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                  Cargando alertas...
                </td>
              </tr>
            )}
            {!loading &&
              alerts.map((alert) => {
                const dias = alert.venceEnDias ?? null;
                const createdAt = new Date(alert.createdAt);
                return (
                  <tr key={alert.id} className={alert.leida ? "" : "bg-emerald-50/40"}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{alert.producto.nombre}</div>
                      <div className="text-xs text-zinc-500">
                        {alert.type === "STOCK_BAJO" ? "Stock" : "Vencimiento"} ·{" "}
                        {createdAt.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {alert.lote ? (
                        <div className="space-y-1">
                          <div className="text-sm text-zinc-800">
                            {alert.lote.codigo || `Lote ${alert.lote.id}`}
                          </div>
                          {alert.lote.fechaVenc && (
                            <div className="text-xs text-zinc-500">
                              Vence: {new Date(alert.lote.fechaVenc).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-zinc-800">
                        {alert.stockActual ?? alert.producto.stockActual ?? 0} uds
                      </div>
                      <div className="text-xs text-zinc-500">
                        Minimo: {alert.stockMinimo ?? alert.producto.stockMinimo ?? 0}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {dias !== null ? (
                        <div className="text-sm text-zinc-800">
                          {dias >= 0 ? `${dias} dia${dias === 1 ? "" : "s"}` : `Vencido ${Math.abs(dias)}d`}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{severityBadge(alert.severity)}</td>
                    <td className="px-4 py-3">
                      {alert.leida ? (
                        <span className="text-xs text-zinc-500">Leida</span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600">Sin leer</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canManage && !alert.leida && (
                          <button
                            onClick={() => handleMarkRead(alert.id)}
                            className="rounded-md border px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                          >
                            Marcar leida
                          </button>
                        )}
                        <Link
                          href={`/admin/inventario/productos?highlight=${alert.producto.id}`}
                          className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Ajustar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {emptyState && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No hay alertas para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-zinc-600">
          Pagina {meta.page} de {totalPages}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-600">
            Tamaño
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="ml-2 rounded-md border px-2 py-1 text-sm"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={meta.page >= totalPages}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
