'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, User } from 'lucide-react'
import Swal from 'sweetalert2'

interface Cliente {
  id: number
  nombre: string
  apellido?: string
  nit?: string
  telefono?: string
  email?: string
  direccion?: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export default function ClientesAdmin() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    nit: '',
    telefono: '',
    email: '',
    direccion: '',
    activo: true,
  })

  useEffect(() => {
    fetchClientes()
  }, [page, searchTerm])

  const fetchClientes = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      })
      if (searchTerm) params.append('q', searchTerm)

      const response = await fetch(`/api/clientes?${params}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setClientes(data.clientes)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const clienteData = {
        nombre: formData.nombre,
        apellido: formData.apellido || null,
        nit: formData.nit || null,
        telefono: formData.telefono || null,
        email: formData.email || null,
        direccion: formData.direccion || null,
        activo: formData.activo,
      }

      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : '/api/clientes'
      const method = editingCliente ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(clienteData),
      })

      if (response.ok) {
        Swal.fire({
          title: 'Éxito',
          text: `Cliente ${editingCliente ? 'actualizado' : 'creado'} correctamente`,
          icon: 'success',
        })
        setShowModal(false)
        resetForm()
        fetchClientes()
      } else {
        const error = await response.text()
        throw new Error(error)
      }
    } catch (error: any) {
      console.error('Error:', error)
      Swal.fire({
        title: 'Error',
        text: error.message || 'Hubo un problema al guardar el cliente',
        icon: 'error',
      })
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido || '',
      nit: cliente.nit || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      activo: cliente.activo,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/clientes/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (response.ok) {
          Swal.fire('Eliminado', 'El cliente ha sido eliminado', 'success')
          fetchClientes()
        } else {
          throw new Error('Error al eliminar')
        }
      } catch (error) {
        console.error('Error:', error)
        Swal.fire('Error', 'No se pudo eliminar el cliente', 'error')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      nit: '',
      telefono: '',
      email: '',
      direccion: '',
      activo: true,
    })
    setEditingCliente(null)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Gestión de Clientes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar clientes por nombre, NIT, teléfono..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NIT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {cliente.nombre} {cliente.apellido}
                      </div>
                      {cliente.direccion && (
                        <div className="text-sm text-gray-500">{cliente.direccion}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cliente.nit || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cliente.telefono || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cliente.email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      cliente.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cliente.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Página {page} de {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.apellido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">NIT</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.nit}
                  onChange={(e) => setFormData(prev => ({ ...prev, nit: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <textarea
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  rows={2}
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.activo.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.value === 'true' }))}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  {editingCliente ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
