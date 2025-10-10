'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Image } from 'lucide-react'
import Swal from 'sweetalert2'

interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  stockMinimo: number
  activo: boolean
  imageUrl?: string
  imageKey?: string
  marca: { id: number; nombre: string }
  categoria: { id: number; nombre: string }
  unidad: { id: number; codigo: string; nombre: string }
  creadoEn: string
  actualizadoEn: string
}

interface Marca {
  id: number
  nombre: string
}

interface Categoria {
  id: number
  nombre: string
}

interface Unidad {
  id: number
  codigo: string
  nombre: string
}

export default function ProductosAdmin() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Estados para elementos nuevos
  const [newMarcaName, setNewMarcaName] = useState('')
  const [newCategoriaName, setNewCategoriaName] = useState('')
  const [newUnidadData, setNewUnidadData] = useState({ codigo: '', nombre: '' })
  const [showNewMarca, setShowNewMarca] = useState(false)
  const [showNewCategoria, setShowNewCategoria] = useState(false)
  const [showNewUnidad, setShowNewUnidad] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    stockMinimo: 0,
    activo: true,
    marcaId: '',
    categoriaId: '',
    unidadId: '',
    imageFile: null as File | null,
    imageUrl: '',
    imageKey: '',
  })

  useEffect(() => {
    fetchProductos()
    fetchMarcas()
    fetchCategorias()
    fetchUnidades()
  }, [page, searchTerm])

  const fetchProductos = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      })
      if (searchTerm) params.append('q', searchTerm)

      const response = await fetch(`/api/productos?${params}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setProductos(data.productos)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMarcas = async () => {
    try {
      const response = await fetch('/api/marcas', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setMarcas(data)
      }
    } catch (error) {
      console.error('Error fetching marcas:', error)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error('Error fetching categorias:', error)
    }
  }

  const fetchUnidades = async () => {
    try {
      const response = await fetch('/api/unidades', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setUnidades(data)
      }
    } catch (error) {
      console.error('Error fetching unidades:', error)
    }
  }

  // Funciones para crear nuevos elementos
  const createNewMarca = async () => {
    if (!newMarcaName.trim()) return

    try {
      const response = await fetch('/api/marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre: newMarcaName.trim() }),
      })

      if (response.ok) {
        const newMarca = await response.json()
        setMarcas(prev => [...prev, newMarca])
        setFormData(prev => ({ ...prev, marcaId: newMarca.id.toString() }))
        setNewMarcaName('')
        setShowNewMarca(false)
      } else {
        const error = await response.text()
        Swal.fire('Error', `No se pudo crear la marca: ${error}`, 'error')
      }
    } catch (error) {
      console.error('Error creating marca:', error)
      Swal.fire('Error', 'Hubo un problema al crear la marca', 'error')
    }
  }

  const createNewCategoria = async () => {
    if (!newCategoriaName.trim()) return

    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre: newCategoriaName.trim() }),
      })

      if (response.ok) {
        const newCategoria = await response.json()
        setCategorias(prev => [...prev, newCategoria])
        setFormData(prev => ({ ...prev, categoriaId: newCategoria.id.toString() }))
        setNewCategoriaName('')
        setShowNewCategoria(false)
      } else {
        const error = await response.text()
        Swal.fire('Error', `No se pudo crear la categoría: ${error}`, 'error')
      }
    } catch (error) {
      console.error('Error creating categoria:', error)
      Swal.fire('Error', 'Hubo un problema al crear la categoría', 'error')
    }
  }

  const createNewUnidad = async () => {
    if (!newUnidadData.codigo.trim() || !newUnidadData.nombre.trim()) return

    try {
      const response = await fetch('/api/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          codigo: newUnidadData.codigo.trim().toUpperCase(),
          nombre: newUnidadData.nombre.trim(),
        }),
      })

      if (response.ok) {
        const newUnidad = await response.json()
        setUnidades(prev => [...prev, newUnidad])
        setFormData(prev => ({ ...prev, unidadId: newUnidad.id.toString() }))
        setNewUnidadData({ codigo: '', nombre: '' })
        setShowNewUnidad(false)
      } else {
        const error = await response.text()
        Swal.fire('Error', `No se pudo crear la unidad: ${error}`, 'error')
      }
    } catch (error) {
      console.error('Error creating unidad:', error)
      Swal.fire('Error', 'Hubo un problema al crear la unidad', 'error')
    }
  }

  const uploadImage = async (file: File) => {
    try {
      const response = await fetch(
        `/api/productos/presign?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
        { credentials: 'include' }
      )
      const { uploadUrl, publicUrl, key } = await response.json()

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      return { imageUrl: publicUrl, imageKey: key }
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let imageData = { imageUrl: formData.imageUrl, imageKey: formData.imageKey }

      if (formData.imageFile) {
        imageData = await uploadImage(formData.imageFile)
      }

      const productData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: formData.precio,
        stockMinimo: formData.stockMinimo,
        activo: formData.activo,
        marcaId: parseInt(formData.marcaId),
        categoriaId: parseInt(formData.categoriaId),
        unidadId: parseInt(formData.unidadId),
        ...imageData,
      }

      const url = editingProduct ? `/api/productos/${editingProduct.id}` : '/api/productos'
      const method = editingProduct ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        Swal.fire({
          title: 'Éxito',
          text: `Producto ${editingProduct ? 'actualizado' : 'creado'} correctamente`,
          icon: 'success',
        })
        setShowModal(false)
        resetForm()
        fetchProductos()
      } else {
        throw new Error('Error al guardar el producto')
      }
    } catch (error) {
      console.error('Error:', error)
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al guardar el producto',
        icon: 'error',
      })
    }
  }

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto)
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: Number(producto.precio),
      stockMinimo: producto.stockMinimo,
      activo: producto.activo,
      marcaId: producto.marca.id.toString(),
      categoriaId: producto.categoria.id.toString(),
      unidadId: producto.unidad.id.toString(),
      imageFile: null,
      imageUrl: producto.imageUrl || '',
      imageKey: producto.imageKey || '',
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
        const response = await fetch(`/api/productos/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (response.ok) {
          Swal.fire('Eliminado', 'El producto ha sido eliminado', 'success')
          fetchProductos()
        } else {
          throw new Error('Error al eliminar')
        }
      } catch (error) {
        console.error('Error:', error)
        Swal.fire('Error', 'No se pudo eliminar el producto', 'error')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: 0,
      stockMinimo: 0,
      activo: true,
      marcaId: '',
      categoriaId: '',
      unidadId: '',
      imageFile: null,
      imageUrl: '',
      imageKey: '',
    })
    setEditingProduct(null)
    setShowNewMarca(false)
    setShowNewCategoria(false)
    setShowNewUnidad(false)
    setNewMarcaName('')
    setNewCategoriaName('')
    setNewUnidadData({ codigo: '', nombre: '' })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }))
    }
  }

  const handleMarcaChange = (value: string) => {
    if (value === 'new') {
      setShowNewMarca(true)
      setFormData(prev => ({ ...prev, marcaId: '' }))
    } else {
      setShowNewMarca(false)
      setFormData(prev => ({ ...prev, marcaId: value }))
    }
  }

  const handleCategoriaChange = (value: string) => {
    if (value === 'new') {
      setShowNewCategoria(true)
      setFormData(prev => ({ ...prev, categoriaId: '' }))
    } else {
      setShowNewCategoria(false)
      setFormData(prev => ({ ...prev, categoriaId: value }))
    }
  }

  const handleUnidadChange = (value: string) => {
    if (value === 'new') {
      setShowNewUnidad(true)
      setFormData(prev => ({ ...prev, unidadId: '' }))
    } else {
      setShowNewUnidad(false)
      setFormData(prev => ({ ...prev, unidadId: value }))
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Gestión de Productos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar productos..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marca
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Mín.
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
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {producto.imageUrl ? (
                    <img
                      src={producto.imageUrl}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                      <Image size={20} className="text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                  <div className="text-sm text-gray-500">{producto.descripcion}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.marca.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.categoria.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Bs. {Number(producto.precio).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.stockMinimo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      producto.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(producto)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(producto.id)}
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
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.precio}
                  onChange={(e) => setFormData(prev => ({ ...prev, precio: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockMinimo: parseInt(e.target.value) }))}
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
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <select
                  required={!showNewMarca}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={showNewMarca ? 'new' : formData.marcaId}
                  onChange={(e) => handleMarcaChange(e.target.value)}
                >
                  <option value="">Seleccionar marca</option>
                  {marcas.map(marca => (
                    <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                  ))}
                  <option value="new">+ Crear nueva marca</option>
                </select>

                {showNewMarca && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva marca"
                      className="flex-1 border rounded-md px-3 py-2"
                      value={newMarcaName}
                      onChange={(e) => setNewMarcaName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={createNewMarca}
                      className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                    >
                      Crear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewMarca(false)
                        setNewMarcaName('')
                      }}
                      className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select
                  required={!showNewCategoria}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={showNewCategoria ? 'new' : formData.categoriaId}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                  ))}
                  <option value="new">+ Crear nueva categoría</option>
                </select>

                {showNewCategoria && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva categoría"
                      className="flex-1 border rounded-md px-3 py-2"
                      value={newCategoriaName}
                      onChange={(e) => setNewCategoriaName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={createNewCategoria}
                      className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                    >
                      Crear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoria(false)
                        setNewCategoriaName('')
                      }}
                      className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Unidad</label>
                <select
                  required={!showNewUnidad}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={showNewUnidad ? 'new' : formData.unidadId}
                  onChange={(e) => handleUnidadChange(e.target.value)}
                >
                  <option value="">Seleccionar unidad</option>
                  {unidades.map(unidad => (
                    <option key={unidad.id} value={unidad.id}>
                      {unidad.codigo} - {unidad.nombre}
                    </option>
                  ))}
                  <option value="new">+ Crear nueva unidad</option>
                </select>

                {showNewUnidad && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Código (ej: KG)"
                        className="w-24 border rounded-md px-3 py-2"
                        value={newUnidadData.codigo}
                        onChange={(e) => setNewUnidadData(prev => ({ ...prev, codigo: e.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Nombre completo (ej: Kilogramos)"
                        className="flex-1 border rounded-md px-3 py-2"
                        value={newUnidadData.nombre}
                        onChange={(e) => setNewUnidadData(prev => ({ ...prev, nombre: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={createNewUnidad}
                        className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                      >
                        Crear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewUnidad(false)
                          setNewUnidadData({ codigo: '', nombre: '' })
                        }}
                        className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  onChange={handleImageChange}
                />
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    className="mt-2 h-20 w-20 object-cover rounded"
                  />
                )}
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
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}