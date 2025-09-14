"use client";

import { Marca } from "@/lib/types/marca";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface MarcaTableProps {
  marcas: Marca[];
  onDelete: (id: number) => void;
}

export default function MarcaTable({ marcas, onDelete }: MarcaTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
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
          {marcas.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                No hay marcas registradas
              </td>
            </tr>
          ) : (
            marcas.map((marca) => (
              <tr key={marca.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {marca.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {marca.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/inventario/marcas/${marca.id}/editar`}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar marca"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => onDelete(marca.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Eliminar marca"
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
