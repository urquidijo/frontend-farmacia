"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductoForm from "../components/ProductoForm";
import { ProductoFormData } from "@/lib/validations/producto";
import Swal from "sweetalert2";

export default function CrearProductoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ProductoFormData) => {
    setIsLoading(true);
    console.log("Datos del formulario:", data);
    
    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el producto");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "El producto ha sido creado correctamente",
      });

      router.push("/admin/inventario/productos");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudo crear el producto",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Producto</h1>
        <p className="text-gray-600">Completa la información para crear un nuevo producto</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <ProductoForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}