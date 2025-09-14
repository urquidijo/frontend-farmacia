"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Marca } from "@/lib/types/marca";
import MarcaTable from "./components/MarcaTable";
import Swal from "sweetalert2";

export default function MarcasPage() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
    try {
      const response = await fetch("/api/marcas");
      if (!response.ok) throw new Error("Error al cargar marcas");

      const data = await response.json();
      // Ordenamos las marcas por ID antes de guardarlas en el estado
      setMarcas(data.sort((a: Marca, b: Marca) => a.id - b.id));
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las marcas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/marcas/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Error al eliminar marca");

        setMarcas(marcas.filter((marca) => marca.id !== id));

        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "La marca ha sido eliminada correctamente",
        });
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar la marca",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Marcas
          </h1>
          <p className="text-gray-600">Administra las marcas de productos</p>
        </div>

        <Link
          href="/admin/inventario/marcas/crear"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus size={20} className="mr-2" />
          Nueva Marca
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Lista de Marcas ({marcas.length})
          </h2>
        </div>

        <MarcaTable marcas={marcas} onDelete={handleDelete} />
      </div>
    </div>
  );
}
