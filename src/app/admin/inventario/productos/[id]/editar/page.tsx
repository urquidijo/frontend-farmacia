"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductoForm from "../../components/ProductoForm";
import { ProductoFormData } from "@/lib/validations/producto";
import { Producto } from "@/lib/types/producto";
import Swal from "sweetalert2";

export default function EditarProductoPage() {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetchProducto();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducto = async () => {
    try {
      const response = await fetch(`/api/productos/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Producto no encontrado",
            text: "El producto que buscas no existe",
          }).then(() => {
            router.push("/admin/inventario/productos");
          });
          return;
        }
        throw new Error("Error al cargar el producto");
      }

      const data = await response.json();
      setProducto(data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar el producto",
      }).then(() => {
        router.push("/admin/inventario/productos");
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ProductoFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/productos/${id}`, {
        method: "PATCH", // <-- ¡Este es el cambio clave! Usamos PATCH.
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el producto");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "El producto ha sido actualizado correctamente",
      });

      router.push("/admin/inventario/productos");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el producto",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!producto) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
        <p className="text-gray-600">
          Modifica la información del producto: {producto.nombre}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <ProductoForm
          producto={producto}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
