"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unidadSchema, type UnidadFormData } from "@/lib/validations/unidad";
import { Unidad } from "@/lib/types/unidad";

interface UnidadFormProps {
  unidad?: Unidad;
  onSubmit: (data: UnidadFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function UnidadForm({ unidad, onSubmit, isLoading }: UnidadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnidadFormData>({
    resolver: zodResolver(unidadSchema),
    defaultValues: {
      codigo: unidad?.codigo || "",
      nombre: unidad?.nombre || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
          Código de la unidad
        </label>
        <input
          {...register("codigo")}
          type="text"
          id="codigo"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej: KG, L, PZA"
          maxLength={10}
        />
        {errors.codigo && (
          <p className="mt-1 text-sm text-red-600">{errors.codigo.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre de la unidad
        </label>
        <input
          {...register("nombre")}
          type="text"
          id="nombre"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej: Kilogramo, Litro, Pieza"
        />
        {errors.nombre && (
          <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Guardando..." : unidad ? "Actualizar" : "Crear"}
        </button>
        
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}