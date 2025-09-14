"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoriaForm from "../components/CategoriaForm";
import { CategoriaFormData } from "@/lib/validations/categoria";
import Swal from "sweetalert2";

export default function CrearCategoriaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: CategoriaFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la categoría");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "La categoría ha sido creada correctamente",
      });

      router.push("/admin/inventario/categorias");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudo crear la categoría",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Categoría</h1>
        <p className="text-gray-600">Completa la información para crear una nueva categoría</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <CategoriaForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}