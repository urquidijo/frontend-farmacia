"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Container from "@/components/Container";
import Newsletter from "@/components/Newsletter";
import Footer from "../components/Footer";
import { logOk } from "@/lib/bitacora";

/* ================== Tipos ================== */
interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number | string; // Prisma Decimal puede ser string
  imageUrl?: string;
  marca: { nombre: string };
  categoria: { nombre: string };
}

interface Categoria {
  id: number;
  nombre: string;
}

interface RecItem {
  productoId: number;
  reason?: string;
  score?: number;
}
interface RecsHomeResponse {
  ok: boolean;
  items: RecItem[];
}

/* ================== Type Guards (sin any) ================== */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

function isProductoArray(v: unknown): v is Producto[] {
  if (!Array.isArray(v)) return false;

  return v.every((p) => {
    if (!isRecord(p)) return false;

    // id y nombre
    if (typeof p.id !== "number" || typeof p.nombre !== "string") return false;

    // precio (opcional: number|string)
    const precioVal = (p as Record<string, unknown>)["precio"];
    if (
      precioVal !== undefined &&
      typeof precioVal !== "number" &&
      typeof precioVal !== "string"
    ) {
      return false;
    }

    // marca (opcional: objeto con nombre:string)
    const marcaVal = (p as Record<string, unknown>)["marca"];
    if (marcaVal !== undefined) {
      if (!isRecord(marcaVal)) return false;
      const marcaNombre = (marcaVal as Record<string, unknown>)["nombre"];
      if (typeof marcaNombre !== "string") return false;
    }

    // categoria (opcional: objeto con nombre:string)
    const catVal = (p as Record<string, unknown>)["categoria"];
    if (catVal !== undefined) {
      if (!isRecord(catVal)) return false;
      const catNombre = (catVal as Record<string, unknown>)["nombre"];
      if (typeof catNombre !== "string") return false;
    }

    // descripción (opcional)
    const descVal = (p as Record<string, unknown>)["descripcion"];
    if (descVal !== undefined && typeof descVal !== "string") return false;

    // imageUrl (opcional)
    const imgVal = (p as Record<string, unknown>)["imageUrl"];
    if (imgVal !== undefined && typeof imgVal !== "string") return false;

    return true;
  });
}


function isCategoriaArray(v: unknown): v is Categoria[] {
  return (
    Array.isArray(v) &&
    v.every(
      (c) => isRecord(c) && typeof c.id === "number" && typeof c.nombre === "string"
    )
  );
}

function isRecsHomeResponse(v: unknown): v is RecsHomeResponse {
  if (!isRecord(v)) return false;
  const okVal = (v as Record<string, unknown>).ok;
  const itemsVal = (v as Record<string, unknown>).items;
  if (typeof okVal !== "boolean" || !Array.isArray(itemsVal)) return false;
  const itemsOk = itemsVal.every(
    (it) =>
      isRecord(it) &&
      typeof it.productoId === "number" &&
      (it.reason === undefined || typeof it.reason === "string") &&
      (it.score === undefined || typeof it.score === "number")
  );
  return itemsOk;
}

/* ================== UI Helpers ================== */
function formatBs(v: number | string): string {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `Bs. ${n.toFixed(2)}`;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="h-40 bg-zinc-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-zinc-200 rounded w-24" />
        <div className="h-4 bg-zinc-200 rounded w-3/4" />
        <div className="h-4 bg-zinc-200 rounded w-1/2" />
        <div className="h-8 bg-zinc-200 rounded" />
      </div>
    </div>
  );
}

function ProductCard({
  producto,
  adding,
  onAdd,
}: {
  producto: Producto;
  adding: boolean;
  onAdd: (id: number) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition group overflow-hidden">
      <div className="h-40 bg-zinc-100 rounded-t-2xl flex items-center justify-center overflow-hidden">
        {producto.imageUrl ? (
          <img
            src={producto.imageUrl}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <span className="text-zinc-400">Sin imagen</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="text-xs text-zinc-500">{producto.marca?.nombre}</div>
        <div className="font-semibold text-sm line-clamp-2">
          {producto.nombre}
        </div>
        {producto.descripcion && (
          <p className="text-xs text-zinc-600 line-clamp-2">
            {producto.descripcion}
          </p>
        )}
        <div className="text-emerald-700 font-bold text-lg mt-2">
          {formatBs(producto.precio)}
        </div>
        <button
          onClick={() => onAdd(producto.id)}
          disabled={adding}
          className="w-full mt-2 bg-emerald-600 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {adding ? "⏳ Agregando..." : "🛒 Agregar"}
        </button>
      </div>
    </div>
  );
}

/* ================== Página ================== */
export default function HomePage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [recs, setRecs] = useState<Producto[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);

  const [loadingProd, setLoadingProd] = useState<boolean>(true);
  const [loadingCats, setLoadingCats] = useState<boolean>(true);

  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const router = useRouter();

  // chips categorías (mostrar 4 con "Todos")
  const topCategorias = useMemo(() => categorias.slice(0, 3), [categorias]);

  useEffect(() => {
    void fetchCategorias();
  }, []);

  useEffect(() => {
    void fetchProductos();
  }, [selectedCategory]);

  useEffect(() => {
    void fetchRecomendaciones();
  }, []); // recs para el home al cargar

  async function fetchProductos(): Promise<void> {
    try {
      setLoadingProd(true);
      const params = new URLSearchParams({ limit: "8" });
      if (selectedCategory) params.append("categoria", selectedCategory);

      const res = await fetch(`/api/public/productos?${params}`);
      if (!res.ok) return;

      const data: unknown = await res.json();
      if (isProductoArray(data)) setProductos(data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    } finally {
      setLoadingProd(false);
    }
  }

  async function fetchCategorias(): Promise<void> {
    try {
      setLoadingCats(true);
      const res = await fetch("/api/public/categorias");
      if (!res.ok) return;

      const data: unknown = await res.json();
      if (isCategoriaArray(data)) setCategorias(data);
    } catch (error) {
      console.error("Error fetching categorias:", error);
    } finally {
      setLoadingCats(false);
    }
  }

  async function fetchRecomendaciones(): Promise<void> {
    try {
      setLoadingRecs(true);
      const userId = localStorage.getItem("auth.userId") ?? "";
      const url = userId
        ? `/api/recs/home?userId=${encodeURIComponent(userId)}`
        : "/api/recs/home";

      const res = await fetch(url);
      if (!res.ok) return;

      const data: unknown = await res.json();
      if (!isRecsHomeResponse(data) || data.items.length === 0) return;

      const ids = data.items
        .map((i) => i.productoId)
        .filter((id): id is number => typeof id === "number");

      if (!ids.length) return;

      // Resolver detalles de los recomendados
      const detallesRes = await fetch(`/api/public/productos/by-ids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!detallesRes.ok) return;

      const detalles: unknown = await detallesRes.json();
      if (isProductoArray(detalles)) setRecs(detalles);
    } catch (error) {
      console.error("Error cargando recomendaciones:", error);
    } finally {
      setLoadingRecs(false);
    }
  }

  async function addToCarrito(productoId: number): Promise<void> {
    setAddingToCart(productoId);
    try {
      const auth = await fetch("/api/me", { credentials: "include" });
      if (!auth.ok) {
        await Swal.fire({
          title: "Debes iniciar sesión",
          text: "Para agregar productos al carrito, inicia sesión",
          icon: "info",
          confirmButtonText: "Ir a login",
        });
        router.push("/login");
        return;
      }

      const res = await fetch("/api/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productoId, cantidad: 1 }),
      });

      if (res.ok) {
        const uidRaw = localStorage.getItem("auth.userId");
        const userIdNum = uidRaw ? Number(uidRaw) : null;
        const ip = localStorage.getItem("auth.ip") ?? null;
        await logOk("Producto Agregado", { userId: userIdNum, ip });

        void Swal.fire({
          title: "¡Agregado!",
          text: "Producto agregado al carrito",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        window.dispatchEvent(new Event("carrito:changed"));
      } else {
        await Swal.fire("Error", "No se pudo agregar al carrito", "error");
      }
    } catch (error) {
      console.error(error);
      await Swal.fire("Error", "No se pudo agregar al carrito", "error");
    } finally {
      setAddingToCart(null);
    }
  }

  return (
    <div className="space-y-12 md:space-y-16">
      {/* HERO */}
      <section className="border-y bg-gradient-to-b from-emerald-50 to-white">
        <Container className="py-10 md:py-14">
          <div className="rounded-3xl bg-white shadow-md border border-emerald-100 p-8 md:p-10 text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-zinc-900">
              Todo para tu salud,{" "}
              <span className="text-emerald-700">en un solo lugar</span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Medicamentos OTC, dermocosmética, bebés y bienestar. Envíos en 24 h dentro de la ciudad.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/productos"
                className="rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition-all shadow-md"
              >
                Comprar ahora
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-sm max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                🚚 <span className="font-medium text-zinc-700">Entrega rápida 24 h</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                🔒 <span className="font-medium text-zinc-700">Pago seguro</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                💬 <span className="font-medium text-zinc-700">Asesoría por WhatsApp</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CATEGORÍAS */}
      <section>
        <Container className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Explora categorías</h2>
            {!loadingCats && categorias.length > 4 && (
              <a href="/categorias" className="text-emerald-700 text-sm hover:underline">
                Ver todas →
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button
              onClick={() => setSelectedCategory("")}
              className={`group flex flex-col items-center p-6 rounded-2xl shadow-sm hover:shadow-lg transition ${
                selectedCategory === ""
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-white border"
              }`}
            >
              <div className="h-20 w-20 flex items-center justify-center rounded-full bg-emerald-100 mb-3 text-3xl">
                📦
              </div>
              <span
                className={`font-semibold ${
                  selectedCategory === "" ? "text-emerald-700" : "group-hover:text-emerald-700"
                }`}
              >
                Todos
              </span>
              <span className="text-sm text-zinc-500">Ver todos →</span>
            </button>

            {loadingCats
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`cat-skel-${i}`} />)
              : topCategorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    onClick={() => setSelectedCategory(categoria.nombre)}
                    className={`group flex flex-col items-center p-6 rounded-2xl shadow-sm hover:shadow-lg transition ${
                      selectedCategory === categoria.nombre
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-white border"
                    }`}
                  >
                    <div className="h-20 w-20 flex items-center justify-center rounded-full bg-emerald-100 mb-3 text-3xl">
                      🏷️
                    </div>
                    <span
                      className={`font-semibold ${
                        selectedCategory === categoria.nombre
                          ? "text-emerald-700"
                          : "group-hover:text-emerald-700"
                      }`}
                    >
                      {categoria.nombre}
                    </span>
                    <span className="text-sm text-zinc-500">Ver más →</span>
                  </button>
                ))}
          </div>
        </Container>
      </section>

      {/* RECOMENDACIONES */}
      <section>
        <Container className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-emerald-700">Recomendaciones para ti</h2>
              <p className="text-zinc-600 text-sm">
                Basado en tus compras recientes y categorías que te interesan.
              </p>
            </div>
            {recs.length > 0 && (
              <a href="/productos" className="text-emerald-700 text-sm hover:underline">
                Ver más →
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {loadingRecs
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`recs-skel-${i}`} />)
              : recs.length > 0
              ? recs.map((p) => (
                  <ProductCard
                    key={p.id}
                    producto={p}
                    adding={addingToCart === p.id}
                    onAdd={addToCarrito}
                  />
                ))
              : (
                <div className="col-span-full text-center py-8 text-zinc-500">
                  Aún no tenemos suficientes datos para recomendarte. Explora algunos productos y vuelve pronto. 😊
                </div>
              )}
          </div>
        </Container>
      </section>

      {/* PRODUCTOS DESTACADOS / POR CATEGORÍA */}
      <section>
        <Container className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {selectedCategory ? `Productos de ${selectedCategory}` : "Productos destacados"}
            </h2>
            {!selectedCategory && productos.length > 0 && (
              <a href="/productos" className="text-emerald-700 text-sm hover:underline">
                Ver catálogo completo →
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {loadingProd
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={`prod-skel-${i}`} />)
              : productos.length > 0
              ? productos.map((p) => (
                  <ProductCard
                    key={p.id}
                    producto={p}
                    adding={addingToCart === p.id}
                    onAdd={addToCarrito}
                  />
                ))
              : (
                <div className="col-span-full text-center py-10 text-zinc-500">
                  {selectedCategory
                    ? `No hay productos en "${selectedCategory}"`
                    : "No hay productos disponibles"}
                </div>
              )}
          </div>
        </Container>
      </section>

      {/* INFO / CONFIANZA + FOOTER */}
      <section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 text-lg">💬 Atención al cliente</h3>
              <p className="text-sm text-zinc-600 mt-2">
                Consultas por chat o WhatsApp. Te ayudamos a elegir lo que necesitas.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 text-lg">🔒 Pagos seguros</h3>
              <p className="text-sm text-zinc-600 mt-2">
                QR, tarjetas y contraentrega donde aplique.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm">
              <Newsletter />
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
