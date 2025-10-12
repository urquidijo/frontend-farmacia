"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { logOk } from "@/lib/bitacora";

type Props = {
  productoId: number;
  nombre: string;
  precio: number;
  imagen?: string;
  marca?: string;
};

export default function ProductCard({
  productoId,
  nombre,
  precio,
  imagen,
  marca,
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addToCarrito = async () => {
    setLoading(true);

    try {
      // Verificar si está autenticado
      const authResponse = await fetch("/api/me", { credentials: "include" });

      if (!authResponse.ok) {
        Swal.fire({
          title: "Debes iniciar sesión",
          text: "Para agregar productos al carrito, inicia sesión",
          icon: "info",
          confirmButtonText: "Ir a login",
        }).then(() => {
          router.push("/login");
        });
        setLoading(false);
        return;
      }

      // Agregar al carrito
      const response = await fetch("/api/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productoId, cantidad: 1 }),
      });

      if (response.ok) {
        const userId = Number(localStorage.getItem("auth.userId") ?? 0) || null;
        const ip = localStorage.getItem("auth.ip") ?? null;
        await logOk("Producto Agregado", { userId, ip });
        Swal.fire({
          title: "¡Agregado!",
          text: "Producto agregado al carrito",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        // Disparar evento para actualizar contador del carrito
        window.dispatchEvent(new Event("carrito:changed"));
      } else {
        throw new Error("Error al agregar");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "No se pudo agregar al carrito", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition overflow-hidden group flex flex-col">
      {/* Imagen */}
      <div className="h-40 bg-zinc-100 flex items-center justify-center overflow-hidden">
        {imagen ? (
          <img
            src={imagen}
            alt={nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-xs text-zinc-500">Imagen no disponible</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 space-y-2">
        <span className="text-xs text-emerald-700 font-medium bg-emerald-50 rounded px-2 py-0.5 self-start">
          {marca || "Genérico"}
        </span>

        <h3 className="text-sm font-semibold text-zinc-800 line-clamp-2 flex-1">
          {nombre}
        </h3>

        <p className="text-emerald-700 font-bold text-base">
          Bs. {precio.toFixed(2)}
        </p>

        <button
          className="mt-auto w-full bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 active:bg-emerald-800 transition disabled:opacity-50"
          onClick={addToCarrito}
          disabled={loading}
        >
          {loading ? "⏳ Agregando..." : "🛒 Agregar"}
        </button>
      </div>
    </div>
  );
}
