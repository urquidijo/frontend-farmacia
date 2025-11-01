"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  ShieldCheck,
  Truck,
  Image as ImageIcon,
  Percent,
  Info,
} from "lucide-react";
import { logOk } from "@/lib/bitacora";

/* ===== TIPOS ===== */
interface CarritoItem {
  id: number;
  cantidad: number;
  producto: {
    id: number;
    nombre: string;
    precio: number;
    imageUrl?: string;
    marca: { nombre: string };
    stockActual: number;
    requiereReceta?: boolean;
  };
}

type RxEstado = "PENDIENTE" | "APROBADA" | "RECHAZADA" | null;

interface NeedsRxResponse {
  needsRx: boolean;
}

interface VerifyMatched {
  productoId: number;
  nombreDetectado: string;
  score: number;
}
interface VerifyMissing {
  productoId: number;
  productoNombre: string;
}
interface VerifyResponse {
  ok: boolean;
  matched: VerifyMatched[];
  missing: VerifyMissing[];
  verificationId?: string;
}

interface ApiError {
  message?: string | string[];
}

interface NuevaOrden {
  id: number;
  total: number;
}

interface StripeCreateResponse {
  url?: string;
}

/* ===== CONFIG ===== */
const FREE_SHIP_THRESHOLD = 200; // Bs
const SHIP_COST = 15; // Bs

/* ===== COMPONENTE ===== */
export default function CarritoPage() {
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const router = useRouter();

  // Estados de receta (UI)
  const [needsRx, setNeedsRx] = useState(false);
  const [rxImage, setRxImage] = useState<string | null>(null);
  const [rxUploading, setRxUploading] = useState(false);
  const [rxAnalyzing, setRxAnalyzing] = useState(false);
  const [rxEstado, setRxEstado] = useState<RxEstado>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const money = (n: number) =>
    new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(n);

  const subtotal = useMemo(
    () => items.reduce((t, it) => t + it.producto.precio * it.cantidad, 0),
    [items]
  );

  const envio = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIP_COST;
  }, [subtotal, items.length]);

  const descuento = useMemo(() => {
    const code = coupon.trim().toUpperCase();
    if (!couponApplied) return 0;
    if (code === "UAGRM10") return Math.min(subtotal * 0.1, 60);
    return 0;
  }, [coupon, couponApplied, subtotal]);

  const total = useMemo(() => Math.max(subtotal + envio - descuento, 0), [
    subtotal,
    envio,
    descuento,
  ]);

  const progressToFree = useMemo(() => {
    if (subtotal >= FREE_SHIP_THRESHOLD) return 100;
    return Math.min(100, Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100));
  }, [subtotal]);

  useEffect(() => {
    void checkAuth();
  }, []);

  const parseErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {
    let message = fallback;
    try {
      const raw = await response.text();
      if (raw) {
        try {
          const data: unknown = JSON.parse(raw);
          const msg = (data as ApiError)?.message;
          if (Array.isArray(msg) && msg.length) message = String(msg[0]);
          else if (typeof msg === "string") message = msg;
          else message = raw; // texto plano
        } catch {
          message = raw; // no era JSON
        }
      }
    } catch {
      // ignore
    }
    return message;
  };

  const checkAuth = async (): Promise<void> => {
    try {
      const r = await fetch("/api/me", { credentials: "include" });
      if (r.ok) {
        setIsAuthenticated(true);
        await fetchCarrito();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        void Swal.fire({
          title: "Debes iniciar sesión",
          text: "Para ver tu carrito, inicia sesión",
          icon: "info",
          confirmButtonText: "Ir a login",
        }).then(() => router.push("/login"));
      }
    } catch (e) {
      console.error("Auth error:", e);
      setLoading(false);
    }
  };

  const fetchCarrito = async (): Promise<void> => {
    try {
      const r = await fetch("/api/carrito", {
        credentials: "include",
        cache: "no-store",
      });
      if (r.ok) {
        const data: CarritoItem[] = await r.json();
        setItems(data);

        // respaldo front
        const needFront = data.some((x) => x.producto.requiereReceta === true);
        setNeedsRx(needFront);

        // verificación backend
        await checkNeedsRx();
      }
    } catch (e) {
      console.error("Fetch carrito error:", e);
    } finally {
      setLoading(false);
    }
  };

  const checkNeedsRx = async (): Promise<void> => {
    try {
      const headers = new Headers({ "Content-Type": "application/json" });
      const userId = localStorage.getItem("auth.userId");
      if (userId) headers.set("x-user-id", userId);

      const r = await fetch("/api/rx/needs", {
        method: "POST",
        headers,
        credentials: "include",
      });
      if (r.ok) {
        const data: NeedsRxResponse = await r.json();
        setNeedsRx(Boolean(data?.needsRx));
        if (!data?.needsRx) {
          setRxEstado(null);
          setVerificationId(null);
          setRxImage(null);
        }
      }
    } catch (e) {
      console.warn("No se pudo verificar needsRx (usando front):", e);
    }
  };

  const toDataUrl = (file: File): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("No se pudo leer la imagen"));
      r.readAsDataURL(file);
    });

  const uploadAndVerifyReceta = async (file: File): Promise<void> => {
    setRxUploading(true);
    try {
      const dataUrl = await toDataUrl(file);
      setRxImage(dataUrl);

      const headers = new Headers({ "Content-Type": "application/json" });
      const userId = localStorage.getItem("auth.userId");
      if (userId) headers.set("x-user-id", userId);

      setRxAnalyzing(true);
      const vr = await fetch("/api/rx/verify", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      if (!vr.ok) {
        const msg = await parseErrorMessage(vr, "No se pudo validar la receta");
        throw new Error(msg);
      }

      const data: VerifyResponse = await vr.json();

      const { ok, missing = [], verificationId: vId } = data;
      setVerificationId(vId ?? null);
      setRxEstado(ok ? "APROBADA" : "RECHAZADA");

      if (ok) {
        void Swal.fire(
          "Receta aprobada",
          "Coincide con los productos del carrito.",
          "success"
        );
      } else {
        const faltan = missing.map((m: VerifyMissing) => m.productoNombre).join(
          ", "
        );
        void Swal.fire(
          "Receta rechazada",
          faltan
            ? `Faltan en receta: ${faltan}`
            : "No se pudo validar los productos.",
          "warning"
        );
      }
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "No se pudo validar la receta";
      void Swal.fire("Error", msg, "error");
      setRxEstado("RECHAZADA");
      setVerificationId(null);
    } finally {
      setRxAnalyzing(false);
      setRxUploading(false);
    }
  };

  const updateCantidad = async (
    itemId: number,
    newCantidad: number
  ): Promise<void> => {
    const idx = items.findIndex((x) => x.id === itemId);
    if (idx === -1) return;
    if (newCantidad < 1) return void removeItem(itemId, true);

    const prev = items[idx];
    const snapshot = [...items];
    const next = [...items];
    next[idx] = { ...prev, cantidad: newCantidad };
    setItems(next);

    try {
      const r = await fetch(`/api/carrito/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cantidad: newCantidad }),
      });
      if (!r.ok) {
        const message = await parseErrorMessage(
          r,
          "No se pudo actualizar la cantidad"
        );
        throw new Error(message);
      }
      window.dispatchEvent(new Event("carrito:changed"));
      await checkNeedsRx();
      if (needsRx) {
        setVerificationId(null);
        setRxEstado(null);
      }
    } catch (e) {
      console.error("Update cantidad error:", e);
      setItems(snapshot);
      const message =
        e instanceof Error ? e.message : "No se pudo actualizar la cantidad";
      void Swal.fire("Atención", message, "warning");
    }
  };

  const removeItem = async (
    itemId: number,
    skipConfirmation = false
  ): Promise<void> => {
    if (!skipConfirmation) {
      const c = await Swal.fire({
        title: "¿Eliminar producto?",
        text: "Se quitará del carrito",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (!c.isConfirmed) return;
    }

    const snapshot = [...items];
    setItems((arr) => arr.filter((x) => x.id !== itemId));

    try {
      const r = await fetch(`/api/carrito/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("DELETE failed");
      if (!skipConfirmation)
        void Swal.fire("Eliminado", "Producto quitado del carrito", "success");
      window.dispatchEvent(new Event("carrito:changed"));

      await checkNeedsRx();
      setVerificationId(null);
      setRxEstado(null);
    } catch (e) {
      console.error("Remove error:", e);
      setItems(snapshot);
      void Swal.fire("Error", "No se pudo eliminar el producto", "error");
    }
  };

  // ✅ CHECKOUT (envía verificationId si se requiere)
  const handleCheckout = async (): Promise<void> => {
    const confirm = await Swal.fire({
      title: "Procesar compra",
      text: "¿Deseas finalizar tu compra?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, procesar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    if (needsRx && rxEstado !== "APROBADA") {
      void Swal.fire(
        "Falta receta aprobada",
        "Sube y valida tu receta para continuar.",
        "info"
      );
      return;
    }

    try {
      setProcessing(true);

      // 1) Crear orden (pasa verificationId)
      const ordenResponse = await fetch("/api/carrito/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          verificationId: needsRx ? verificationId : undefined,
        }),
      });
      if (!ordenResponse.ok) {
        const msg = await parseErrorMessage(ordenResponse, "Error al crear la orden");
        throw new Error(msg);
      }
      const nuevaOrden: NuevaOrden = await ordenResponse.json();

      // 2) Crear sesión de pago Stripe
      const pagoResponse = await fetch("/api/pagos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ordenId: nuevaOrden.id,
          monto: nuevaOrden.total,
          moneda: "usd",
        }),
      });

      if (!pagoResponse.ok) throw new Error("Error al crear pago");
      const data: StripeCreateResponse = await pagoResponse.json();

      // 3) Registrar log
      const userId = Number(localStorage.getItem("auth.userId") ?? 0) || null;
      const ip = localStorage.getItem("auth.ip") ?? null;
      await logOk("Compra iniciada", { userId, ip });

      // 4) Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Stripe URL no recibida");
      }
    } catch (error) {
      console.error("Error en checkout:", error);
      const msg =
        error instanceof Error ? error.message : "No se pudo procesar la compra";
      void Swal.fire("Error", msg, "error");
    } finally {
      setProcessing(false);
    }
  };

  /* ====== UI ====== */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Header />
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-white/60 rounded-2xl border border-gray-200"/>
            ))}
          </div>
          <div className="h-64 bg-white/60 rounded-2xl border border-gray-200" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const missingForFree = Math.max(FREE_SHIP_THRESHOLD - subtotal, 0);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <Header />

      {items.length === 0 ? (
        <EmptyState onBrowse={() => router.push("/productos")} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <LineItem
                  key={item.id}
                  item={item}
                  money={money}
                  onInc={() => void updateCantidad(item.id, item.cantidad + 1)}
                  onDec={() => void updateCantidad(item.id, item.cantidad - 1)}
                  onRemove={() => void removeItem(item.id)}
                />
              ))}
            </div>

            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow p-5 sticky top-4">
                <h2 className="text-lg font-bold mb-4">Resumen</h2>

                {/* CUPÓN */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <Percent className="h-3.5 w-3.5" />
                    ¿Tienes cupón?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Ej: UAGRM10"
                      className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCouponApplied((v) => !v)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                        couponApplied
                          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {couponApplied ? "Aplicado" : "Aplicar"}
                    </button>
                  </div>
                  {couponApplied && coupon.trim().toUpperCase() !== "UAGRM10" && (
                    <p className="mt-1 text-xs text-red-600">
                      Cupón inválido. Prueba con <span className="font-semibold">UAGRM10</span>.
                    </p>
                  )}
                </div>

                {/* === BLOQUE RECETA (solo si se requiere) === */}
                {needsRx && (
                  <div className="mb-4 p-3 border rounded-xl bg-amber-50">
                    <p className="text-sm font-semibold text-amber-800 mb-2 flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5" />
                      Este pedido incluye medicamentos que requieren receta.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileRef}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadAndVerifyReceta(f);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={rxUploading || rxAnalyzing}
                        className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        {rxUploading ? "Subiendo…" : rxImage ? "Cambiar imagen" : "Subir foto de receta"}
                      </button>

                      <span className="text-xs text-gray-600">
                        {rxAnalyzing
                          ? "Validando…"
                          : rxEstado
                          ? `Estado: ${rxEstado}`
                          : "Estado: PENDIENTE"}
                      </span>
                    </div>

                    {rxImage ? (
                      <div className="mt-3">
                        <img
                          src={rxImage}
                          alt="Receta"
                          className="w-full max-h-64 object-contain rounded-lg border"
                        />
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-center rounded-lg border border-dashed p-6 text-gray-400 text-sm">
                        <ImageIcon className="h-4 w-4 mr-2" /> Sube una imagen nítida y completa
                      </div>
                    )}
                  </div>
                )}

                {/* Totales */}
                <div className="space-y-3 text-sm">
                  <Row label="Subtotal" value={money(subtotal)} />
                  <Row
                    label="Envío"
                    value={envio === 0 ? "Gratis" : money(envio)}
                    hint={subtotal < FREE_SHIP_THRESHOLD ? `Gratis desde ${money(FREE_SHIP_THRESHOLD)}` : undefined}
                  />
                  <Row
                    label="Descuento"
                    value={descuento ? `- ${money(descuento)}` : "—"}
                  />
                  <div className="border-t pt-3">
                    <Row
                      label={<span className="font-bold">Total</span>}
                      value={<span className="text-emerald-600 font-bold">{money(total)}</span>}
                    />
                  </div>
                </div>

                <button
                  onClick={() => void handleCheckout()}
                  disabled={processing || (needsRx && rxEstado !== "APROBADA")}
                  className="mt-5 w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {processing ? "Procesando…" : "Procesar compra"}
                </button>

                <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] text-gray-500">
                  <Badge icon={<Truck size={14} />}>Envío 24-48h</Badge>
                  <Badge icon={<ShieldCheck size={14} />}>Pago seguro</Badge>
                  <Badge icon={<Package size={14} />}>Devolución 7d</Badge>
                </div>
              </div>
            </aside>
          </div>

          {/* Mobile sticky footer (total + checkout) */}
          <div className="lg:hidden fixed inset-x-0 bottom-0 bg-white/90 backdrop-blur border-t p-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-emerald-600">{money(total)}</p>
              </div>
              <button
                onClick={() => void handleCheckout()}
                disabled={processing || (needsRx && rxEstado !== "APROBADA")}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {processing ? "Procesando…" : "Pagar ahora"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ===== Subcomponentes ===== */
function Header() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <ShoppingCart size={20} />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mi Carrito</h1>
        <p className="text-sm text-gray-500">Revisa tus productos antes de pagar</p>
      </div>
    </div>
  );
}

function LineItem({
  item,
  onInc,
  onDec,
  onRemove,
  money,
}: {
  item: CarritoItem;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
  money: (n: number) => string;
}) {
  const disponible = item.producto.stockActual ?? 0;
  const disableInc = disponible === 0 || item.cantidad >= disponible;

  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-28 h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
        {item.producto.imageUrl ? (
          <img
            src={item.producto.imageUrl}
            alt={item.producto.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            <span className="inline-flex items-center gap-1"><ImageIcon className="h-4 w-4"/> Sin imagen</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
              {item.producto.nombre}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">{item.producto.marca.nombre}</p>
            <p className="text-emerald-600 font-bold mt-1">
              {money(item.producto.precio)}
            </p>
            {item.producto.requiereReceta && (
              <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Requiere receta
              </span>
            )}
          </div>
          <button
            aria-label="Quitar"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
            title="Eliminar del carrito"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="mt-3 sm:mt-4 flex items-center justify-between gap-3">
          <QuantityStepper
            value={item.cantidad}
            onInc={onInc}
            onDec={onDec}
            disableInc={disableInc}
          />
          <p className="font-bold text-base sm:text-lg">
            {money(item.producto.precio * item.cantidad)}
          </p>
        </div>

        {/* Info stock */}
        <p className="mt-2 text-xs text-gray-500">
          {disponible > 0
            ? `Disponible: ${disponible} u.`
            : "Sin stock temporalmente"}
        </p>
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  onInc,
  onDec,
  disableInc,
}: {
  value: number;
  onInc: () => void;
  onDec: () => void;
  disableInc?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border bg-white overflow-hidden">
      <button
        aria-label="Disminuir"
        onClick={onDec}
        className="px-3 py-2 hover:bg-gray-50 active:scale-[0.98] transition"
      >
        <Minus size={16} />
      </button>
      <span className="w-12 text-center font-semibold select-none" aria-live="polite">
        {value}
      </span>
      <button
        aria-label="Aumentar"
        onClick={onInc}
        disabled={disableInc}
        className={`px-3 py-2 transition ${
          disableInc ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 active:scale-[0.98]"
        }`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="text-gray-600 flex items-center gap-2">
        <span>{label}</span>
        {hint && <span className="text-[11px] text-gray-400">({hint})</span>}
      </div>
      <div className="text-gray-900 font-semibold">{value}</div>
    </div>
  );
}

function Badge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="text-center py-14">
      <div className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-2xl bg-gray-100 text-gray-400">
        <ShoppingCart />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold">Tu carrito está vacío</h2>
      <p className="text-gray-500 mt-1 max-w-sm mx-auto">
        Explora nuestros productos y agrega tus favoritos.
      </p>
      <button
        onClick={onBrowse}
        className="mt-6 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700"
      >
        Ver productos
      </button>
    </div>
  );
}
