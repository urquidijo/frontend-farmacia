"use client";

import { Producto } from "@/lib/types/producto";
import { Edit, Trash2, Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProductoTableProps {
  productos: Producto[];
  onDelete: (id: number) => void;
}

interface ProductoModalProps {
  producto: Producto | null;
  isOpen: boolean;
  onClose: () => void;
}

function ProductoModal({ producto, isOpen, onClose }: ProductoModalProps) {
  if (!isOpen || !producto) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{producto.nombre}</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                producto.activo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {producto.activo ? (
                  <>
                    <Eye size={12} className="mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <EyeOff size={12} className="mr-1" />
                    Inactivo
                  </>
                )}
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Descripción:</h4>
            <p className="text-gray-600 leading-relaxed">{producto.descripcion}</p>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductoTable({ productos, onDelete }: ProductoTableProps) {
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewProducto = (producto: Producto) => {
    setSelectedProducto(producto);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProducto(null);
  };

  return (
    <>
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Marca
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categoría
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unidad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock Mín.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {productos.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                No hay productos registrados
              </td>
            </tr>
          ) : (
            productos.map((producto) => (
              <tr key={producto.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {producto.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.marca?.nombre || `ID: ${producto.marcaId}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.categoria?.nombre || `ID: ${producto.categoriaId}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.unidad?.nombre || `ID: ${producto.unidadId}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.stockMinimo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    producto.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {producto.activo ? (
                      <>
                        <Eye size={12} className="mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} className="mr-1" />
                        Inactivo
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleViewProducto(producto)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Ver detalles del producto"
                    >
                      <Info size={16} />
                    </button>
                    <Link
                      href={`/admin/inventario/productos/${producto.id}/editar`}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar producto"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => onDelete(producto.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Eliminar producto"
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
    
    <ProductoModal 
      producto={selectedProducto}
      isOpen={isModalOpen}
      onClose={closeModal}
    />
    </>
  );
}