"use client";

import Link from "next/link";
import { Producto } from "@/lib/types/producto";
import { Edit, Trash2 } from "lucide-react";

type ProductoTableProps = {
  productos: Producto[];
  onDelete: (id: number) => void;
};

export default function ProductoTable({ productos, onDelete }: ProductoTableProps) {
  if (productos.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <p>No se encontraron productos.</p>
        <p className="mt-2 text-sm">
          Intenta crear uno nuevo para empezar a gestionar tu inventario.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock Mínimo
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {productos.map((producto) => (
            <tr key={producto.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{producto.nombre}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500 max-w-xs truncate">{producto.descripcion}</td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">{producto.stockMinimo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    producto.activo
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {producto.activo ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end items-center gap-2">
                  <Link href={`/admin/inventario/productos/${producto.id}/editar`} className="text-indigo-600 hover:text-indigo-900" title="Editar">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => onDelete(producto.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}