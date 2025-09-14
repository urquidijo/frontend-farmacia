"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarcaForm from "../components/MarcaForm";
import { MarcaFormData } from "@/lib/validations/marca";
import Swal from "sweetalert2";

export default function CrearMarcaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: MarcaFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/marcas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la marca");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "La marca ha sido creada correctamente",
      });

      router.push("/admin/inventario/marcas");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudo crear la marca",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Marca</h1>
        <p className="text-gray-600">Completa la información para crear una nueva marca</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <MarcaForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}