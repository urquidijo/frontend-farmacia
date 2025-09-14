"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema, type ProductoFormData } from "@/lib/validations/producto";
import { Producto } from "@/lib/types/producto";
import { Marca } from "@/lib/types/marca";
import { Categoria } from "@/lib/types/categoria";
import { Unidad } from "@/lib/types/unidad";
import { useState, useEffect } from "react";

interface ProductoFormProps {
  producto?: Producto;
  onSubmit: (data: ProductoFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function ProductoForm({ producto, onSubmit, isLoading }: ProductoFormProps) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: producto?.nombre || "",
      descripcion: producto?.descripcion || "",
      stockMinimo: producto?.stockMinimo || 0,
      activo: producto?.activo ?? true,
      marcaId: producto?.marcaId || 0,
      categoriaId: producto?.categoriaId || 0,
      unidadId: producto?.unidadId || 0,
    },
  });

  useEffect(() => {
    fetchSelectData();
  }, []);

  const fetchSelectData = async () => {
    try {
      const [marcasRes, categoriasRes, unidadesRes] = await Promise.all([
        fetch("/api/marcas"),
        fetch("/api/categorias"),
        fetch("/api/unidades"),
      ]);

      const [marcasData, categoriasData, unidadesData] = await Promise.all([
        marcasRes.json(),
        categoriasRes.json(),
        unidadesRes.json(),
      ]);

      setMarcas(Array.isArray(marcasData) ? marcasData : []);
      setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      setUnidades(Array.isArray(unidadesData) ? unidadesData : []);
    } catch (error) {
      console.error("Error cargando datos para selects:", error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del producto *
        </label>
        <input
          {...register("nombre")}
          type="text"
          id="nombre"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ingrese el nombre del producto"
        />
        {errors.nombre && (
          <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
          Descripción *
        </label>
        <textarea
          {...register("descripcion")}
          id="descripcion"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ingrese la descripción del producto"
        />
        {errors.descripcion && (
          <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="stockMinimo" className="block text-sm font-medium text-gray-700 mb-2">
          Stock mínimo *
        </label>
        <input
          {...register("stockMinimo", { valueAsNumber: true })}
          type="number"
          id="stockMinimo"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0"
        />
        {errors.stockMinimo && (
          <p className="mt-1 text-sm text-red-600">{errors.stockMinimo.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="marcaId" className="block text-sm font-medium text-gray-700 mb-2">
            Marca *
          </label>
          <select
            {...register("marcaId", { valueAsNumber: true })}
            id="marcaId"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingData}
          >
            <option value={0}>Seleccionar marca</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nombre}
              </option>
            ))}
          </select>
          {errors.marcaId && (
            <p className="mt-1 text-sm text-red-600">{errors.marcaId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700 mb-2">
            Categoría *
          </label>
          <select
            {...register("categoriaId", { valueAsNumber: true })}
            id="categoriaId"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingData}
          >
            <option value={0}>Seleccionar categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          {errors.categoriaId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoriaId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="unidadId" className="block text-sm font-medium text-gray-700 mb-2">
            Unidad *
          </label>
          <select
            {...register("unidadId", { valueAsNumber: true })}
            id="unidadId"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingData}
          >
            <option value={0}>Seleccionar unidad</option>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.nombre}
              </option>
            ))}
          </select>
          {errors.unidadId && (
            <p className="mt-1 text-sm text-red-600">{errors.unidadId.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            {...register("activo")}
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">Producto activo</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Los productos inactivos no aparecerán en el catálogo
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Guardando..." : producto ? "Actualizar" : "Crear"}
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