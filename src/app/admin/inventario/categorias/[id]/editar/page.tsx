"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import CategoriaForm from "../../components/CategoriaForm";
import { CategoriaFormData } from "@/lib/validations/categoria";
import { Categoria } from "@/lib/types/categoria";
import Swal from "sweetalert2";

export default function EditarCategoriaPage() {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetchCategoria();
  }, [id]);

  const fetchCategoria = async () => {
    try {
      const response = await fetch(`/api/categorias/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Categoría no encontrada",
            text: "La categoría que buscas no existe",
          }).then(() => {
            router.push("/admin/inventario/categorias");
          });
          return;
        }
        throw new Error("Error al cargar la categoría");
      }

      const data = await response.json();
      setCategoria(data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la categoría",
      }).then(() => {
        router.push("/admin/inventario/categorias");
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CategoriaFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/categorias/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la categoría");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "La categoría ha sido actualizada correctamente",
      });

      router.push("/admin/inventario/categorias");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudo actualizar la categoría",
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

  if (!categoria) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Categoría</h1>
        <p className="text-gray-600">Modifica la información de la categoría: {categoria.nombre}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <CategoriaForm categoria={categoria} onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}