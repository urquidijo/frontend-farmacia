"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { logOk } from "@/lib/bitacora";

const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY!);

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
  };
}

export default function CarritoPage() {
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [coupon, setCoupon] = useState("");
  const router = useRouter();

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
  const envio = useMemo(
    () => (subtotal > 200 ? 0 : items.length ? 15 : 0),
    [subtotal, items.length]
  );
  const descuento = useMemo(
    () =>
      coupon.trim().toUpperCase() === "UAGRM10"
        ? Math.min(subtotal * 0.1, 60)
        : 0,
    [coupon, subtotal]
  );
  const total = useMemo(
    () => Math.max(subtotal + envio - descuento, 0),
    [subtotal, envio, descuento]
  );

  useEffect(() => {
    checkAuth();
  }, []);

  const parseErrorMessage = async (response: Response, fallback: string) => {
    let message = fallback;
    try {
      const raw = await response.text();
      if (raw) {
        try {
          const data = JSON.parse(raw);
          const candidate = Array.isArray(data?.message)
            ? data.message[0]
            : data?.message;
          if (candidate) message = candidate;
        } catch {
          message = raw;
        }
      }
    } catch {}
    return message;
  };

  const checkAuth = async () => {
    try {
      const r = await fetch("/api/me", { credentials: "include" });
      if (r.ok) {
        setIsAuthenticated(true);
        await fetchCarrito();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        Swal.fire({
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

  const fetchCarrito = async () => {
    try {
      const r = await fetch("/api/carrito", {
        credentials: "include",
        cache: "no-store",
      });
      if (r.ok) {
        const data = await r.json();
        setItems(data as CarritoItem[]);
      }
    } catch (e) {
      console.error("Fetch carrito error:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateCantidad = async (itemId: number, newCantidad: number) => {
    const idx = items.findIndex((x) => x.id === itemId);
    if (idx === -1) return;
    if (newCantidad < 1) return removeItem(itemId, true);

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
    } catch (e) {
      console.error("Update cantidad error:", e);
      setItems(snapshot);
      const message =
        e instanceof Error ? e.message : "No se pudo actualizar la cantidad";
      Swal.fire("Atención", message, "warning");
    }
  };

  const removeItem = async (itemId: number, skipConfirmation = false) => {
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
        Swal.fire("Eliminado", "Producto quitado del carrito", "success");
      window.dispatchEvent(new Event("carrito:changed"));
    } catch (e) {
      console.error("Remove error:", e);
      setItems(snapshot);
      Swal.fire("Error", "No se pudo eliminar el producto", "error");
    }
  };

  // ✅ FLUJO DE CHECKOUT (orden + Stripe)
  const handleCheckout = async () => {
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

    try {
      setProcessing(true);

      // 1️⃣ Crear orden desde el carrito
      const ordenResponse = await fetch("/api/carrito/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!ordenResponse.ok) throw new Error("Error al crear la orden");
      const nuevaOrden = await ordenResponse.json();

      // 2️⃣ Crear sesión de pago Stripe
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
      const data = await pagoResponse.json();

      // 3️⃣ Registrar log
      const userId = Number(localStorage.getItem("auth.userId") ?? 0) || null;
      const ip = localStorage.getItem("auth.ip") ?? null;
      await logOk("Compra iniciada", { userId, ip });

      // 4️⃣ Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Stripe URL no recibida");
      }
    } catch (error) {
      console.error("Error en checkout:", error);
      Swal.fire("Error", "No se pudo procesar la compra", "error");
    } finally {
      setProcessing(false);
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p>Cargando carrito...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <ShoppingCart size={20} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mi Carrito</h1>
          <p className="text-sm text-gray-500">
            Revisa tus productos antes de pagar
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState onBrowse={() => router.push("/productos")} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <LineItem
                key={item.id}
                item={item}
                money={money}
                onInc={() => updateCantidad(item.id, item.cantidad + 1)}
                onDec={() => updateCantidad(item.id, item.cantidad - 1)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow p-5 sticky top-4">
              <h2 className="text-lg font-bold mb-4">Resumen</h2>
              <div className="space-y-3 text-sm">
                <Row label="Subtotal" value={money(subtotal)} />
                <Row
                  label="Envío"
                  value={"Gratis"}
              
                />
                <Row
                  label="Descuento"
                  value={descuento ? `- ${money(descuento)}` : "—"}
                />
                <div className="border-t pt-3">
                  <Row
                    label={<span className="font-bold">Total</span>}
                    value={
                      <span className="text-emerald-600 font-bold">
                        {money(total -15)}
                      </span>
                    }
                  />
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
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
      )}
    </div>
  );
}

// ---------- Subcomponentes ----------
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
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
              {item.producto.nombre}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {item.producto.marca.nombre}
            </p>
            <p className="text-emerald-600 font-bold mt-1">
              {money(item.producto.precio)}
            </p>
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
      <span className="w-12 text-center font-semibold select-none">
        {value}
      </span>
      <button
        aria-label="Aumentar"
        onClick={onInc}
        disabled={disableInc}
        className={`px-3 py-2 transition ${
          disableInc
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-50 active:scale-[0.98]"
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

function Badge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
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
