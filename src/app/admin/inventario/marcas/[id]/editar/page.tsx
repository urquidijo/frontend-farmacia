"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import MarcaForm from "../../components/MarcaForm";
import { MarcaFormData } from "@/lib/validations/marca";
import { Marca } from "@/lib/types/marca";
import Swal from "sweetalert2";

export default function EditarMarcaPage() {
  const [marca, setMarca] = useState<Marca | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetchMarca();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMarca = async () => {
    try {
      const response = await fetch(`/api/marcas/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Marca no encontrada",
            text: "La marca que buscas no existe",
          }).then(() => {
            router.push("/admin/inventario/marcas");
          });
          return;
        }
        throw new Error("Error al cargar la marca");
      }

      const data = await response.json();
      setMarca(data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la marca",
      }).then(() => {
        router.push("/admin/inventario/marcas");
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: MarcaFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/marcas/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la marca");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "La marca ha sido actualizada correctamente",
      });

      router.push("/admin/inventario/marcas");
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudo actualizar la marca",
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

  if (!marca) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Marca</h1>
        <p className="text-gray-600">Modifica la información de la marca: {marca.nombre}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <MarcaForm marca={marca} onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}