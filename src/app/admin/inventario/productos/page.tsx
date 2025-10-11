'use client'

import { useState, useEffect, useCallback } from 'react'
import NextImage from 'next/image'
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Info } from 'lucide-react'
import Swal from 'sweetalert2'

interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  stockMinimo: number
  stockActual: number
  activo: boolean
  imageUrl?: string
  imageKey?: string
  marca: { id: number; nombre: string }
  categoria: { id: number; nombre: string }
  unidad: { id: number; codigo: string; nombre: string }
  creadoEn: string
  actualizadoEn: string
}

interface Lote {
  id: number
  codigo?: string | null
  cantidad: number
  fechaVenc: string
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

type ProductoApi = Omit<Producto, 'stockActual'> & { stockActual?: number | null }
type ProductosResponse = {
  productos?: ProductoApi[]
  totalPages?: number
}

type LoteApi = {
  id: number
  codigo?: string | null
  cantidad?: number | null
  fechaVenc?: string | null
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

  const [lotes, setLotes] = useState<Lote[]>([])
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [lotForm, setLotForm] = useState({ codigo: '', cantidad: 0, fechaVenc: '' })
  const [initialLotEnabled, setInitialLotEnabled] = useState(false)
  const [initialLot, setInitialLot] = useState({ codigo: '', cantidad: 0, fechaVenc: '' })

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    stockMinimo: 0,
    stockActual: 0,
    activo: true,
    marcaId: '',
    categoriaId: '',
    unidadId: '',
    imageFile: null as File | null,
    imageUrl: '',
    imageKey: '',
  })

  const fetchProductos = useCallback(
    async (withSpinner = false) => {
      if (withSpinner) {
        setLoading(true)
      }
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          size: '10',
        })
        if (searchTerm) params.append('q', searchTerm)

        const response = await fetch(`/api/productos?${params}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'No se pudo obtener la lista de productos.')
        }
        const data = (await response.json()) as ProductosResponse
        const mapped = (data.productos ?? []).map((producto) => ({
          ...producto,
          stockActual: Number(producto.stockActual ?? 0),
        }))
        setProductos(mapped)
        setTotalPages(data.totalPages ?? 1)
      } catch (error) {
        console.error('Error fetching productos:', error)
        Swal.fire('Error', 'No se pudo cargar la lista de productos.', 'error')
      } finally {
        if (withSpinner) {
          setLoading(false)
        }
      }
    },
    [page, searchTerm],
  )

  useEffect(() => {
    void fetchProductos(true)
  }, [fetchProductos])

  useEffect(() => {
    fetchMarcas()
    fetchCategorias()
    fetchUnidades()
  }, [])

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

  const fetchLotes = async (productoId: number) => {
    setLoadingLotes(true)
    try {
      const response = await fetch(`/api/productos/${productoId}/lotes`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (response.ok) {
        const data = (await response.json()) as unknown
        const list: LoteApi[] = Array.isArray(data) ? (data as LoteApi[]) : []
        const mapped = list.map((lote) => ({
          id: lote.id,
          codigo: lote.codigo ?? null,
          cantidad: Number(lote.cantidad ?? 0),
          fechaVenc: lote.fechaVenc ? String(lote.fechaVenc).slice(0, 10) : '',
        }))
        setLotes(mapped)
        const total = mapped.reduce((sum, lote) => sum + lote.cantidad, 0)
        setFormData((prev) => ({ ...prev, stockActual: total }))
      }
    } catch (error) {
      console.error('Error fetching lotes:', error)
    } finally {
      setLoadingLotes(false)
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
        Swal.fire('Error', `No se pudo crear la categoria: ${error}`, 'error')
      }
    } catch (error) {
      console.error('Error creating categoria:', error)
      Swal.fire('Error', 'Hubo un problema al crear la categoria', 'error')
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

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const savedProducto: Producto = await response.json()

      if (!editingProduct && initialLotEnabled && initialLot.cantidad > 0 && initialLot.fechaVenc) {
        const loteResponse = await fetch(`/api/productos/${savedProducto.id}/lotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            codigo: initialLot.codigo || undefined,
            cantidad: initialLot.cantidad,
            fechaVenc: initialLot.fechaVenc,
          }),
        })
        if (!loteResponse.ok) {
          const message = await loteResponse.text()
          Swal.fire('Advertencia', message || 'El lote inicial no pudo registrarse.', 'warning')
        }
      }

      Swal.fire({
        title: 'Exito',
        text: `Producto ${editingProduct ? 'actualizado' : 'creado'} correctamente`,
        icon: 'success',
      })
      setShowModal(false)
      resetForm()
      await fetchProductos(true)
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
      stockActual: producto.stockActual ?? 0,
      activo: producto.activo,
      marcaId: producto.marca.id.toString(),
      categoriaId: producto.categoria.id.toString(),
      unidadId: producto.unidad.id.toString(),
      imageFile: null,
      imageUrl: producto.imageUrl || '',
      imageKey: producto.imageKey || '',
    })
    setInitialLotEnabled(false)
    setInitialLot({ codigo: '', cantidad: 0, fechaVenc: '' })
    setLotForm({ codigo: '', cantidad: 0, fechaVenc: '' })
    setShowModal(true)
    fetchLotes(producto.id)
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Estas seguro?',
      text: 'Esta accion no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
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
          await fetchProductos(true)
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
      stockActual: 0,
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
    setLotes([])
    setLotForm({ codigo: '', cantidad: 0, fechaVenc: '' })
    setInitialLotEnabled(false)
    setInitialLot({ codigo: '', cantidad: 0, fechaVenc: '' })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }))
    }
  }

  const handleCreateLote = async () => {
    if (!editingProduct) return
    if (lotForm.cantidad <= 0 || !lotForm.fechaVenc) {
      Swal.fire('Atencion', 'Define cantidad y fecha de vencimiento para el lote.', 'warning')
      return
    }

    try {
      const response = await fetch(`/api/productos/${editingProduct.id}/lotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          codigo: lotForm.codigo || undefined,
          cantidad: lotForm.cantidad,
          fechaVenc: lotForm.fechaVenc,
        }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      setLotForm({ codigo: '', cantidad: 0, fechaVenc: '' })
      await fetchLotes(editingProduct.id)
      await fetchProductos(false)
    } catch (error) {
      console.error(error)
      Swal.fire('Error', error instanceof Error ? error.message : 'No se pudo crear el lote.', 'error')
    }
  }

  const handleAdjustLote = async (lote: Lote) => {
    if (!editingProduct) return
    const { value } = await Swal.fire({
      title: `Actualizar cantidad del lote ${lote.codigo || lote.id}`,
      input: 'number',
      inputValue: lote.cantidad,
      inputAttributes: { min: '0', step: '1' },
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
    })
    if (value === undefined) return
    const cantidad = parseInt(value, 10)
    if (Number.isNaN(cantidad) || cantidad < 0) {
      Swal.fire('Atencion', 'Ingresa una cantidad valida.', 'warning')
      return
    }

    try {
      const response = await fetch(`/api/lotes/${lote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cantidad }),
      })
      if (!response.ok) throw new Error(await response.text())
      await fetchLotes(editingProduct.id)
      await fetchProductos(false)
    } catch (error) {
      console.error(error)
      Swal.fire('Error', error instanceof Error ? error.message : 'No se pudo actualizar el lote.', 'error')
    }
  }

  const handleDeleteLote = async (lote: Lote) => {
    if (!editingProduct) return
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar lote',
      text: 'Esta accion reducira el stock disponible.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    })
    if (!confirm.isConfirmed) return

    try {
      const response = await fetch(`/api/lotes/${lote.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error(await response.text())
      await fetchLotes(editingProduct.id)
      await fetchProductos(false)
    } catch (error) {
      console.error(error)
      Swal.fire('Error', error instanceof Error ? error.message : 'No se pudo eliminar el lote.', 'error')
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
        <h1 className="text-2xl font-semibold">Gestion de Productos</h1>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Busqueda */}
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
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full">
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
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Min.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Act.
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
              {productos.map((producto) => {
                const stockActual = producto.stockActual ?? 0
                const isLowStock = stockActual <= producto.stockMinimo
                return (
                  <tr key={producto.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {producto.imageUrl ? (
                        <NextImage
                          src={producto.imageUrl}
                          alt={`Imagen de ${producto.nombre}`}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                          <ImageIcon size={20} className="text-gray-400" aria-hidden="true" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-2">
                        <div className="text-sm font-medium text-gray-900 leading-5">
                          {producto.nombre}
                        </div>
                        {producto.descripcion && (
                          <div className="relative group flex-shrink-0">
                            <button
                              type="button"
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                              aria-label="Ver descripcion del producto"
                            >
                              <Info size={12} />
                            </button>
                            <div className="invisible absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                              {producto.descripcion}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producto.marca.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producto.categoria.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Bs. {Number(producto.precio).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.stockMinimo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          isLowStock ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {stockActual}
                        {isLowStock && (
                          <span className="text-[10px] uppercase tracking-wide">Reponer</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
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
                        className="mr-4 text-indigo-600 hover:text-indigo-900"
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginacion */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Pagina {page} de {totalPages}
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
                <label className="block text-sm font-medium text-gray-700">Descripcion</label>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock minimo</label>
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
                  <label className="block text-sm font-medium text-gray-700">Stock actual</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-600"
                    value={formData.stockActual}
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-500">Se calcula como la suma de los lotes registrados.</p>
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
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  required={!showNewCategoria}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={showNewCategoria ? 'new' : formData.categoriaId}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                >
                  <option value="">Seleccionar categoria</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                  ))}
                  <option value="new">+ Crear nueva categoria</option>
                </select>

                {showNewCategoria && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva categoria"
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
                      Cancelar
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
                        placeholder="Codigo (ej: KG)"
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
                  <NextImage
                    src={formData.imageUrl}
                    alt="Vista previa del producto"
                    width={80}
                    height={80}
                    className="mt-2 h-20 w-20 rounded object-cover"
                    unoptimized
                  />
                )}
              </div>

              {!editingProduct && (
                <div className="rounded border border-dashed border-emerald-300 bg-emerald-50/60 p-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={initialLotEnabled}
                      onChange={(e) => setInitialLotEnabled(e.target.checked)}
                    />
                    Registrar lote inicial
                  </label>
                  {initialLotEnabled && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        placeholder="Codigo (opcional)"
                        className="border rounded-md px-3 py-2 text-sm"
                        value={initialLot.codigo}
                        onChange={(e) => setInitialLot(prev => ({ ...prev, codigo: e.target.value }))}
                      />
                      <input
                        type="number"
                        min="0"
                        className="border rounded-md px-3 py-2 text-sm"
                        value={initialLot.cantidad}
                        onChange={(e) => setInitialLot(prev => ({ ...prev, cantidad: parseInt(e.target.value || '0', 10) }))}
                      />
                      <input
                        type="date"
                        className="border rounded-md px-3 py-2 text-sm"
                        value={initialLot.fechaVenc}
                        onChange={(e) => setInitialLot(prev => ({ ...prev, fechaVenc: e.target.value }))}
                      />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    El lote se creara automaticamente al guardar el producto.
                  </p>
                </div>
              )}

              {editingProduct && (
                <div className="space-y-4 rounded border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium text-gray-800">Lotes del producto</h3>
                    <span className="text-xs text-gray-500">Stock total: {formData.stockActual}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <input
                      type="text"
                      placeholder="Codigo"
                      className="border rounded-md px-3 py-2 text-sm"
                      value={lotForm.codigo}
                      onChange={(e) => setLotForm(prev => ({ ...prev, codigo: e.target.value }))}
                    />
                    <input
                      type="number"
                      min="0"
                      className="border rounded-md px-3 py-2 text-sm"
                      value={lotForm.cantidad}
                      onChange={(e) => setLotForm(prev => ({ ...prev, cantidad: parseInt(e.target.value || '0', 10) }))}
                    />
                    <input
                      type="date"
                      className="border rounded-md px-3 py-2 text-sm"
                      value={lotForm.fechaVenc}
                      onChange={(e) => setLotForm(prev => ({ ...prev, fechaVenc: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
                      onClick={handleCreateLote}
                    >
                      Agregar lote
                    </button>
                  </div>
                  {loadingLotes ? (
                    <p className="text-sm text-gray-500">Cargando lotes...</p>
                  ) : lotes.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-3 py-2 text-left">Codigo</th>
                            <th className="px-3 py-2 text-left">Cantidad</th>
                            <th className="px-3 py-2 text-left">Fecha venc.</th>
                            <th className="px-3 py-2 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {lotes.map(lote => (
                            <tr key={lote.id}>
                              <td className="px-3 py-2 text-gray-800">{lote.codigo || 'Sin codigo'}</td>
                              <td className="px-3 py-2 text-gray-800">{lote.cantidad}</td>
                              <td className="px-3 py-2 text-gray-800">{lote.fechaVenc}</td>
                              <td className="px-3 py-2 text-right space-x-2">
                                <button
                                  type="button"
                                  className="text-xs text-emerald-700 hover:underline"
                                  onClick={() => handleAdjustLote(lote)}
                                >
                                  Ajustar
                                </button>
                                <button
                                  type="button"
                                  className="text-xs text-rose-600 hover:underline"
                                  onClick={() => handleDeleteLote(lote)}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay lotes registrados.</p>
                  )}
                </div>
              )}

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
