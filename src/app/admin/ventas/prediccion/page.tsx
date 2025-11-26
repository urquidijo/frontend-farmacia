"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Package,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Brain,
  Star,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from "lucide-react";

/* ==================== TIPOS ==================== */
interface KPIs {
  productosTendenciaAlza: number;
  productosTendenciaBaja: number;
  clientesVIP: number;
  clientesFrecuentes: number;
  alertasReposicion: number;
  alertasCriticas: number;
  topCategorias: { nombre: string; cantidad: number }[];
}

interface Tendencia {
  productoId: number;
  productoNombre: string;
  tendencia: "alza" | "baja" | "estable";
  cambioPromedio: number;
  ventasUltimos30: number;
  ventasAnteriores30: number;
}

interface ClienteVIP {
  userId: number;
  segmento: string;
  recency: number;
  frequency: number;
  monetary: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface AlertaReposicion {
  id: number;
  productoId: number;
  cantidadSugerida: number;
  stockProyectado: number;
  diasCobertura: number;
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  estado: string;
  fechaReposicion: string;
  notas: string;
  producto: {
    id: number;
    nombre: string;
    stockActual: number;
    stockMinimo: number;
    proveedor: {
      id: number;
      nombre: string;
      contacto: string;
    } | null;
  };
}

interface Pronostico {
  productoId: number;
  productoNombre: string;
  categoriaNombre: string;
  categoriaId: number;
  marcaNombre: string;
  stockActual: number;
  precio: number;
  cantidadProyectada: number;
  nivelConfianza: number;
  tendencia: string;
  modelo: string;
  periodo: string;
  valorProyectado: number;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface DashboardData {
  kpis: KPIs;
  tendencias: Tendencia[];
  clientesVIP: ClienteVIP[];
  alertas: AlertaReposicion[];
}

/* ==================== COMPONENTE PRINCIPAL ==================== */
export default function PrediccionVentasPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [generatingForecasts, setGeneratingForecasts] = useState(false);
  const [analyzingRFM, setAnalyzingRFM] = useState(false);
  const [generatingReposicion, setGeneratingReposicion] = useState(false);

  // Estados para filtros
  const [filtroTendencia, setFiltroTendencia] = useState<"todas" | "alza" | "baja" | "estable">("todas");
  const [segmentoCliente, setSegmentoCliente] = useState<string>("VIP");
  const [clientesSegmento, setClientesSegmento] = useState<ClienteVIP[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Estados para pronósticos
  const [pronosticos, setPronosticos] = useState<Pronostico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("");
  const [loadingPronosticos, setLoadingPronosticos] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchCategorias();
    fetchPronosticos();
  }, []);

  useEffect(() => {
    if (segmentoCliente) {
      fetchClientesPorSegmento(segmentoCliente);
    }
  }, [segmentoCliente]);

  useEffect(() => {
    fetchPronosticos();
  }, [categoriaSeleccionada]);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics/dashboard", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar el dashboard");
      }

      const json = await res.json();
      setData(json);
      setClientesSegmento(json.clientesVIP || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo cargar los datos", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchClientesPorSegmento(segmento: string) {
    try {
      setLoadingClientes(true);
      const res = await fetch(`/api/analytics/clientes-segmentados?segmento=${segmento}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al cargar clientes");

      const clientes = await res.json();
      setClientesSegmento(clientes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingClientes(false);
    }
  }

  async function fetchPronosticos() {
    try {
      setLoadingPronosticos(true);
      const url = categoriaSeleccionada
        ? `/api/analytics/top-forecasts?categoria=${categoriaSeleccionada}`
        : "/api/analytics/top-forecasts";

      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al cargar pronósticos");

      const data = await res.json();
      setPronosticos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPronosticos(false);
    }
  }

  async function fetchCategorias() {
    try {
      const res = await fetch("/api/categorias", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al cargar categorías");

      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleGenerateForecasts() {
    const result = await Swal.fire({
      title: "Generar pronósticos",
      html: `
        <p>Esto analizará las ventas históricas y generará pronósticos para todos los productos.</p>
        <p class="text-sm text-gray-600 mt-2">Selecciona el periodo y modelo:</p>
      `,
      input: "select",
      inputOptions: {
        "30:promedio_movil": "30 días - Promedio Móvil",
        "30:regresion_lineal": "30 días - Regresión Lineal",
        "60:promedio_movil": "60 días - Promedio Móvil",
        "90:arima": "90 días - ARIMA Simplificado",
      },
      inputValue: "30:promedio_movil",
      showCancelButton: true,
      confirmButtonText: "Generar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const [dias, modelo] = (result.value || "30:promedio_movil").split(":");

    setGeneratingForecasts(true);
    try {
      const res = await fetch("/api/analytics/generate-forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dias: Number(dias), modelo }),
      });

      if (!res.ok) throw new Error("Error al generar pronósticos");

      const forecasts = await res.json();
      await Swal.fire({
        icon: "success",
        title: "Pronósticos generados",
        text: `Se generaron ${forecasts.length} pronósticos exitosamente`,
      });

      fetchDashboard();
      fetchPronosticos();
    } catch (error) {
      Swal.fire("Error", "No se pudieron generar los pronósticos", "error");
    } finally {
      setGeneratingForecasts(false);
    }
  }

  async function handleAnalyzeRFM() {
    const confirm = await Swal.fire({
      title: "Analizar clientes (RFM)",
      text: "Esto segmentará a los clientes en VIP, Frecuentes, Ocasionales e Inactivos.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Analizar",
    });

    if (!confirm.isConfirmed) return;

    setAnalyzingRFM(true);
    try {
      const res = await fetch("/api/analytics/analyze-rfm", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al analizar RFM");

      const segmentos = await res.json();
      await Swal.fire({
        icon: "success",
        title: "Análisis completado",
        text: `Se segmentaron ${segmentos.length} clientes`,
      });

      fetchDashboard();
      fetchClientesPorSegmento(segmentoCliente);
    } catch (error) {
      Swal.fire("Error", "No se pudo completar el análisis RFM", "error");
    } finally {
      setAnalyzingRFM(false);
    }
  }

  async function handleGenerateReposicion() {
    const confirm = await Swal.fire({
      title: "Generar alertas de reposición",
      text: "Esto analizará los pronósticos y generará recomendaciones de compra.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Generar",
    });

    if (!confirm.isConfirmed) return;

    setGeneratingReposicion(true);
    try {
      const res = await fetch("/api/analytics/generate-reposicion", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al generar alertas");

      const alertas = await res.json();
      await Swal.fire({
        icon: "success",
        title: "Alertas generadas",
        text: `Se generaron ${alertas.length} alertas de reposición`,
      });

      fetchDashboard();
    } catch (error) {
      Swal.fire("Error", "No se pudieron generar alertas", "error");
    } finally {
      setGeneratingReposicion(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Predicción de Ventas</h1>
            <p className="text-sm text-gray-600">Inteligencia Artificial & Analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 h-32 border" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Filtrar tendencias según el filtro seleccionado
  const tendenciasFiltradas =
    filtroTendencia === "todas"
      ? data.tendencias
      : data.tendencias.filter((t) => t.tendencia === filtroTendencia);

  // Ordenar tendencias por ventas últimos 30 días (descendente)
  const tendenciasOrdenadas = [...tendenciasFiltradas].sort(
    (a, b) => b.ventasUltimos30 - a.ventasUltimos30
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            Predicción de Ventas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Analítica predictiva con IA - Series temporales & RFM
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerateForecasts}
            disabled={generatingForecasts}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {generatingForecasts ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            Generar pronósticos
          </button>

          <button
            onClick={handleAnalyzeRFM}
            disabled={analyzingRFM}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {analyzingRFM ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            Analizar RFM
          </button>

          <button
            onClick={handleGenerateReposicion}
            disabled={generatingReposicion}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
          >
            {generatingReposicion ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Alertas reposición
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Productos en alza"
          value={data.kpis.productosTendenciaAlza}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
        <KPICard
          title="Productos en baja"
          value={data.kpis.productosTendenciaBaja}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          bgColor="bg-red-50"
          textColor="text-red-600"
        />
        <KPICard
          title="Clientes VIP"
          value={data.kpis.clientesVIP}
          icon={<Star className="h-5 w-5 text-yellow-600" />}
          bgColor="bg-yellow-50"
          textColor="text-yellow-600"
        />
        <KPICard
          title="Alertas de reposición"
          value={data.kpis.alertasReposicion}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          bgColor="bg-orange-50"
          textColor="text-orange-600"
          subtitle={`${data.kpis.alertasCriticas} críticas`}
        />
      </div>

      {/* Pronósticos de Productos - NUEVA SECCIÓN */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Pronósticos de Ventas (Próximos 30 días)
          </h2>
          <div className="relative">
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {loadingPronosticos ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : pronosticos.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No hay pronósticos disponibles. Genera pronósticos primero.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3 font-semibold">#</th>
                  <th className="p-3 font-semibold">Producto</th>
                  <th className="p-3 font-semibold">Categoría</th>
                  <th className="p-3 font-semibold">Demanda proyectada</th>
                  <th className="p-3 font-semibold">Valor proyectado</th>
                  <th className="p-3 font-semibold">Stock actual</th>
                  <th className="p-3 font-semibold">Confianza</th>
                  <th className="p-3 font-semibold">Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pronosticos.slice(0, 20).map((p, idx) => (
                  <tr key={p.productoId} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                        {idx + 1}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{p.productoNombre}</p>
                        <p className="text-xs text-gray-500">{p.marcaNombre}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {p.categoriaNombre}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-indigo-600 text-base">
                        {p.cantidadProyectada}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">unidades</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-emerald-600">
                        Bs. {p.valorProyectado.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`${
                          p.stockActual < p.cantidadProyectada
                            ? "text-red-600 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {p.stockActual}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${p.nivelConfianza}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {p.nivelConfianza.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {p.tendencia === "alza" && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <ArrowUp className="h-3 w-3" />
                          Alza
                        </span>
                      )}
                      {p.tendencia === "baja" && (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                          <ArrowDown className="h-3 w-3" />
                          Baja
                        </span>
                      )}
                      {p.tendencia === "estable" && (
                        <span className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
                          <Minus className="h-3 w-3" />
                          Estable
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Categorías top */}
      {data.kpis.topCategorias.length > 0 && (
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Top 5 Categorías (últimos 30 días)
          </h2>
          <div className="space-y-3">
            {data.kpis.topCategorias.map((cat, idx) => {
              const maxCantidad = data.kpis.topCategorias[0]?.cantidad || 1;
              const porcentaje = (cat.cantidad / maxCantidad) * 100;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.nombre}</span>
                    <span className="text-gray-600">{cat.cantidad} unidades</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Productos con más demanda
            </h2>
            <div className="relative">
              <select
                value={filtroTendencia}
                onChange={(e) => setFiltroTendencia(e.target.value as "todas" | "alza" | "baja" | "estable")}
                className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="todas">Todas</option>
                <option value="alza">En alza</option>
                <option value="baja">En baja</option>
                <option value="estable">Estables</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tendenciasOrdenadas.length === 0 ? (
              <p className="text-sm text-gray-500">
                {filtroTendencia === "todas"
                  ? "No hay datos de tendencias. Genera pronósticos primero."
                  : `No hay productos con tendencia "${filtroTendencia}"`}
              </p>
            ) : (
              tendenciasOrdenadas.map((t, idx) => (
                <div
                  key={t.productoId}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.productoNombre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {t.tendencia === "alza" && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <ArrowUp className="h-3 w-3" />
                            Alza
                          </span>
                        )}
                        {t.tendencia === "baja" && (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                            <ArrowDown className="h-3 w-3" />
                            Baja
                          </span>
                        )}
                        {t.tendencia === "estable" && (
                          <span className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
                            <Minus className="h-3 w-3" />
                            Estable
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {t.cambioPromedio > 0 ? "+" : ""}
                          {t.cambioPromedio.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">Ventas</p>
                    <p className="text-sm font-bold text-purple-600">{t.ventasUltimos30}</p>
                    <p className="text-xs text-gray-400">últimos 30d</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clientes segmentados */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Segmentación de clientes
            </h2>
            <div className="relative">
              <select
                value={segmentoCliente}
                onChange={(e) => setSegmentoCliente(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VIP">VIP</option>
                <option value="FRECUENTE">Frecuentes</option>
                <option value="OCASIONAL">Ocasionales</option>
                <option value="INACTIVO">Inactivos</option>
                <option value="NUEVO">Nuevos</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loadingClientes ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : clientesSegmento.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay clientes en el segmento &quot;{segmentoCliente}&quot;. Ejecuta el análisis RFM primero.
              </p>
            ) : (
              clientesSegmento.map((c) => {
                const colorSegmento =
                  c.segmento === "VIP"
                    ? "from-yellow-50 to-white border-yellow-100"
                    : c.segmento === "FRECUENTE"
                    ? "from-blue-50 to-white border-blue-100"
                    : c.segmento === "OCASIONAL"
                    ? "from-green-50 to-white border-green-100"
                    : c.segmento === "INACTIVO"
                    ? "from-gray-50 to-white border-gray-200"
                    : "from-purple-50 to-white border-purple-100";

                const badgeColor =
                  c.segmento === "VIP"
                    ? "bg-yellow-100 text-yellow-800"
                    : c.segmento === "FRECUENTE"
                    ? "bg-blue-100 text-blue-800"
                    : c.segmento === "OCASIONAL"
                    ? "bg-green-100 text-green-800"
                    : c.segmento === "INACTIVO"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-purple-100 text-purple-800";

                return (
                  <div
                    key={c.userId}
                    className={`p-3 bg-gradient-to-r rounded-lg border ${colorSegmento}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {c.user.firstName} {c.user.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{c.user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">
                          Bs. {Number(c.monetary).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{c.frequency} compras</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${badgeColor}`}>
                        {c.segmento}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        Última: {c.recency} días
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Alertas de Reposición */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-600" />
          Alertas de reposición pendientes
        </h2>

        <div className="overflow-x-auto">
          {data.alertas.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay alertas de reposición. Genera alertas primero.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3 font-semibold">Producto</th>
                  <th className="p-3 font-semibold">Stock actual</th>
                  <th className="p-3 font-semibold">Stock proyectado</th>
                  <th className="p-3 font-semibold">Cobertura</th>
                  <th className="p-3 font-semibold">Cantidad sugerida</th>
                  <th className="p-3 font-semibold">Prioridad</th>
                  <th className="p-3 font-semibold">Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.alertas.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-3">{a.producto.nombre}</td>
                    <td className="p-3">{a.producto.stockActual}</td>
                    <td className="p-3">
                      <span
                        className={`font-semibold ${
                          a.stockProyectado <= 0 ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {a.stockProyectado}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`${
                          a.diasCobertura <= 7
                            ? "text-red-600"
                            : a.diasCobertura <= 15
                            ? "text-orange-600"
                            : "text-gray-700"
                        }`}
                      >
                        {a.diasCobertura} días
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{a.cantidadSugerida}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          a.prioridad === "CRITICA"
                            ? "bg-red-100 text-red-800"
                            : a.prioridad === "ALTA"
                            ? "bg-orange-100 text-orange-800"
                            : a.prioridad === "MEDIA"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {a.prioridad}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      {a.producto.proveedor?.nombre || "Sin proveedor"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== SUBCOMPONENTES ==================== */
function KPICard({
  title,
  value,
  icon,
  bgColor,
  textColor,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${textColor}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
      </div>
    </div>
  );
}
