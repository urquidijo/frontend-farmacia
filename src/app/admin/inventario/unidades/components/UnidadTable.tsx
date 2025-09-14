"use client";

import { Unidad } from "@/lib/types/unidad";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface UnidadTableProps {
  unidades: Unidad[];
  onDelete: (id: number) => void;
}

export default function UnidadTable({ unidades, onDelete }: UnidadTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Código
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {unidades.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                No hay unidades registradas
              </td>
            </tr>
          ) : (
            unidades.map((unidad) => (
              <tr key={unidad.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {unidad.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {unidad.codigo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {unidad.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/inventario/unidades/${unidad.id}/editar`}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar unidad"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => onDelete(unidad.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Eliminar unidad"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}