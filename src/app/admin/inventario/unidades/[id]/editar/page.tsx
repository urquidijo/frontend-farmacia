"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import UnidadForm from "../../components/UnidadForm";
import { UnidadFormData } from "@/lib/validations/unidad";
import { Unidad } from "@/lib/types/unidad";
import Swal from "sweetalert2";

export default function EditarUnidadPage() {
  const [unidad, setUnidad] = useState<Unidad | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetchUnidad();
  }, [id]);

  const fetchUnidad = async () => {
    try {
      const response = await fetch(`/api/unidades/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Unidad no encontrada",
            text: "La unidad que buscas no existe",
          }).then(() => {
            router.push("/admin/inventario/unidades");
          });
          return;
        }
        throw new Error("Error al cargar la unidad");
      }

      const data = await response.json();
      setUnidad(data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la unidad",
      }).then(() => {
        router.push("/admin/inventario/unidades");
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UnidadFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/unidades/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la unidad");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "La unidad ha sido actualizada correctamente",
      });

      router.push("/admin/inventario/unidades");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudo actualizar la unidad",
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

  if (!unidad) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Unidad</h1>
        <p className="text-gray-600">Modifica la información de la unidad: {unidad.nombre} ({unidad.codigo})</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <UnidadForm unidad={unidad} onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}