'use client'

import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { Calendar, Pause, Play, Trash2, Plus, Package } from 'lucide-react'
import Container from '@/components/Container'
import { logOk } from '@/lib/bitacora'

type EstadoSuscripcion = 'ACTIVA' | 'PAUSADA' | 'SUSPENDIDA' | 'CANCELADA'
type FrecuenciaSuscripcion = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'PERSONALIZADA'

interface Suscripcion {
  id: number
  cantidad: number
  frecuencia: FrecuenciaSuscripcion
  diasPersonalizado?: number
  diaSemana?: number
  diaMes?: number
  proximaFecha: string
  estado: EstadoSuscripcion
  createdAt: string
  producto: {
    id: number
    nombre: string
    precio: number
    imageUrl?: string
    marca: { nombre: string }
    unidad: { codigo: string }
  }
}

interface Producto {
  id: number
  nombre: string
  precio: number
  imageUrl?: string
  marca: { nombre: string }
  requiereReceta: boolean
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function SuscripcionesPage() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | EstadoSuscripcion>('all')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    verificarUsuario()
  }, [])

  const verificarUsuario = async () => {
    try {
      setLoading(true)
      const meResponse = await fetch('/api/me', { credentials: 'include' })
      if (meResponse.ok) {
        setIsAuthenticated(true)
        fetchSuscripciones()
      } else {
        setIsAuthenticated(false)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error al verificar usuario:', error)
      setIsAuthenticated(false)
      setLoading(false)
    }
  }

  const fetchSuscripciones = async () => {
    try {
      const res = await fetch('/api/suscripciones')
      if (res.ok) {
        const data = await res.json()
        setSuscripciones(data)
      }
    } catch (error) {
      console.error('Error fetching suscripciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const pausarSuscripcion = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Pausar suscripción?',
      text: 'Puedes reanudarla cuando quieras',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, pausar',
      cancelButtonText: 'Cancelar',
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/suscripciones/${id}/pause`, {
          method: 'PATCH',
        })

        if (res.ok) {
          await fetchSuscripciones()
          await Swal.fire('¡Pausada!', 'La suscripción ha sido pausada', 'success')
        } else {
          throw new Error(await res.text())
        }
      } catch {
        Swal.fire('Error', 'No se pudo pausar la suscripción', 'error')
      }
    }
  }

  const reanudarSuscripcion = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Reanudar suscripción?',
      text: 'Se calculará una nueva fecha de entrega',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reanudar',
      cancelButtonText: 'Cancelar',
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/suscripciones/${id}/resume`, {
          method: 'PATCH',
        })

        if (res.ok) {
          await fetchSuscripciones()
          await Swal.fire('¡Reanudada!', 'La suscripción ha sido reactivada', 'success')
        } else {
          throw new Error(await res.text())
        }
      } catch {
        Swal.fire('Error', 'No se pudo reanudar la suscripción', 'error')
      }
    }
  }

  const cancelarSuscripcion = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Cancelar suscripción?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#ef4444',
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/suscripciones/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          await fetchSuscripciones()
          await Swal.fire('¡Cancelada!', 'La suscripción ha sido eliminada', 'success')
        } else {
          throw new Error(await res.text())
        }
      } catch {
        Swal.fire('Error', 'No se pudo cancelar la suscripción', 'error')
      }
    }
  }

  const abrirModalNuevaSuscripcion = async () => {
    try {
      // Obtener lista de productos
      const res = await fetch('/api/public/productos?limit=1000')
      if (!res.ok) throw new Error('Error al cargar productos')

      const data = await res.json()
      console.log('Datos recibidos de productos:', data)

      // Manejar diferentes estructuras de respuesta
      let productos: Producto[] = []
      if (Array.isArray(data)) {
        productos = data
      } else if (data && typeof data === 'object' && Array.isArray(data.productos)) {
        productos = data.productos
      } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
        productos = data.data
      }

      if (productos.length === 0) {
        Swal.fire('Sin productos', 'No hay productos disponibles para suscripción', 'info')
        return
      }

      // Paso 1: Seleccionar producto
      const { value: productoSeleccionado } = await Swal.fire({
        title: 'Seleccionar Producto',
        html: `
          <div class="text-left">
            <input
              id="search-producto"
              type="text"
              placeholder="Buscar producto..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div id="productos-list" class="max-h-96 overflow-y-auto space-y-2">
              ${productos.map(p => `
                <div
                  class="producto-item border border-gray-200 rounded-lg p-3 hover:bg-emerald-50 cursor-pointer transition"
                  data-id="${p.id}"
                  data-nombre="${p.nombre}"
                  data-precio="${p.precio}"
                  data-requiere-receta="${p.requiereReceta}"
                >
                  <div class="flex items-center gap-3">
                    ${p.imageUrl
                      ? `<img src="${p.imageUrl}" alt="${p.nombre}" class="w-16 h-16 object-cover rounded" />`
                      : '<div class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>'
                    }
                    <div class="flex-1">
                      <h4 class="font-semibold text-sm">${p.nombre}</h4>
                      <p class="text-xs text-gray-600">${p.marca.nombre}</p>
                      <p class="text-emerald-700 font-bold text-sm mt-1">Bs. ${p.precio.toFixed(2)}</p>
                      ${p.requiereReceta ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">⚕️ Requiere Receta</span>' : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Siguiente',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10b981',
        didOpen: () => {
          const searchInput = document.getElementById('search-producto') as HTMLInputElement
          const productosList = document.getElementById('productos-list')
          const productoItems = document.querySelectorAll('.producto-item')

          let selectedId: number | null = null

          // Búsqueda de productos
          searchInput?.addEventListener('input', (e) => {
            const search = (e.target as HTMLInputElement).value.toLowerCase()
            productoItems.forEach((item) => {
              const nombre = item.getAttribute('data-nombre')?.toLowerCase() || ''
              if (nombre.includes(search)) {
                (item as HTMLElement).style.display = 'block'
              } else {
                (item as HTMLElement).style.display = 'none'
              }
            })
          })

          // Selección de producto
          productoItems.forEach((item) => {
            item.addEventListener('click', () => {
              productoItems.forEach(i => i.classList.remove('bg-emerald-100', 'border-emerald-500'))
              item.classList.add('bg-emerald-100', 'border-emerald-500')
              selectedId = Number(item.getAttribute('data-id'))
            })
          })

          // Validación antes de confirmar
          const confirmButton = Swal.getConfirmButton()
          confirmButton?.addEventListener('click', (e) => {
            if (!selectedId) {
              e.preventDefault()
              Swal.showValidationMessage('Debes seleccionar un producto')
            }
          })
        },
        preConfirm: () => {
          const selected = document.querySelector('.producto-item.bg-emerald-100')
          if (!selected) return false

          return {
            id: Number(selected.getAttribute('data-id')),
            nombre: selected.getAttribute('data-nombre'),
            precio: Number(selected.getAttribute('data-precio')),
            requiereReceta: selected.getAttribute('data-requiere-receta') === 'true'
          }
        }
      })

      if (!productoSeleccionado) return

      // Si requiere receta, mostrar advertencia
      if (productoSeleccionado.requiereReceta) {
        const confirmacion = await Swal.fire({
          title: '⚕️ Requiere Receta Médica',
          html: `
            <p class="text-sm text-gray-600 mb-3">
              Este medicamento requiere receta médica.
            </p>
            <p class="text-sm text-gray-700 font-medium">
              Deberás subir tu receta cada vez que se procese la suscripción.
            </p>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Entiendo, continuar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#10b981',
        })

        if (!confirmacion.isConfirmed) return
      }

      // Paso 2: Configurar suscripción
      const { value: formValues } = await Swal.fire({
        title: `Suscribirse a ${productoSeleccionado.nombre}`,
        html: `
          <div class="text-left space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input id="cantidad" type="number" min="1" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
              <select id="frecuencia" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="SEMANAL">Semanal</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="MENSUAL">Mensual</option>
                <option value="PERSONALIZADA">Personalizada</option>
              </select>
            </div>

            <div id="dia-semana-container">
              <label class="block text-sm font-medium text-gray-700 mb-1">Día de la semana</label>
              <select id="diaSemana" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                ${DIAS_SEMANA.map((dia, index) => `<option value="${index}">${dia}</option>`).join('')}
              </select>
            </div>

            <div id="dia-mes-container" style="display: none;">
              <label class="block text-sm font-medium text-gray-700 mb-1">Día del mes</label>
              <input id="diaMes" type="number" min="1" max="31" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            </div>

            <div id="dias-personalizado-container" style="display: none;">
              <label class="block text-sm font-medium text-gray-700 mb-1">Cada cuántos días (7-90)</label>
              <input id="diasPersonalizado" type="number" min="7" max="90" value="30" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            </div>

            <div class="text-sm text-gray-500 bg-gray-50 p-3 rounded">
              💰 Total por entrega: <span class="font-bold text-emerald-600">Bs. ${productoSeleccionado.precio.toFixed(2)}</span> × <span id="cantidad-preview">1</span> = <span class="font-bold" id="total-preview">Bs. ${productoSeleccionado.precio.toFixed(2)}</span>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear Suscripción',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10b981',
        width: '500px',
        didOpen: () => {
          const frecuenciaSelect = document.getElementById('frecuencia') as HTMLSelectElement
          const diaSemanaContainer = document.getElementById('dia-semana-container')
          const diaMesContainer = document.getElementById('dia-mes-container')
          const diasPersonalizadoContainer = document.getElementById('dias-personalizado-container')
          const cantidadInput = document.getElementById('cantidad') as HTMLInputElement
          const cantidadPreview = document.getElementById('cantidad-preview')
          const totalPreview = document.getElementById('total-preview')

          // Actualizar preview de cantidad y total
          const actualizarTotal = () => {
            const cantidad = parseInt(cantidadInput.value) || 1
            if (cantidadPreview) cantidadPreview.textContent = cantidad.toString()
            if (totalPreview) totalPreview.textContent = `Bs. ${(productoSeleccionado.precio * cantidad).toFixed(2)}`
          }

          cantidadInput?.addEventListener('input', actualizarTotal)

          // Mostrar/ocultar campos según frecuencia
          frecuenciaSelect?.addEventListener('change', () => {
            const frecuencia = frecuenciaSelect.value

            if (diaSemanaContainer) diaSemanaContainer.style.display = frecuencia === 'SEMANAL' ? 'block' : 'none'
            if (diaMesContainer) diaMesContainer.style.display = frecuencia === 'MENSUAL' ? 'block' : 'none'
            if (diasPersonalizadoContainer) diasPersonalizadoContainer.style.display = frecuencia === 'PERSONALIZADA' ? 'block' : 'none'
          })
        },
        preConfirm: () => {
          const cantidad = parseInt((document.getElementById('cantidad') as HTMLInputElement).value)
          const frecuencia = (document.getElementById('frecuencia') as HTMLSelectElement).value
          const diaSemana = parseInt((document.getElementById('diaSemana') as HTMLSelectElement).value)
          const diaMes = parseInt((document.getElementById('diaMes') as HTMLInputElement).value)
          const diasPersonalizado = parseInt((document.getElementById('diasPersonalizado') as HTMLInputElement).value)

          if (!cantidad || cantidad < 1) {
            Swal.showValidationMessage('La cantidad debe ser al menos 1')
            return false
          }

          if (frecuencia === 'PERSONALIZADA' && (diasPersonalizado < 7 || diasPersonalizado > 90)) {
            Swal.showValidationMessage('Los días personalizados deben estar entre 7 y 90')
            return false
          }

          return {
            cantidad,
            frecuencia,
            diaSemana: frecuencia === 'SEMANAL' ? diaSemana : undefined,
            diaMes: frecuencia === 'MENSUAL' ? diaMes : undefined,
            diasPersonalizado: frecuencia === 'PERSONALIZADA' ? diasPersonalizado : undefined,
          }
        },
      })

      if (!formValues) return

      // Crear suscripción
      const response = await fetch('/api/suscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productoId: productoSeleccionado.id,
          ...formValues,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const userId = Number(localStorage.getItem('auth.userId') ?? 0) || null
        const ip = localStorage.getItem('auth.ip') ?? null
        await logOk('Suscripción Creada', { userId, ip })

        // Recargar lista de suscripciones primero
        await fetchSuscripciones()

        // Calcular texto de frecuencia
        let frecuenciaTexto = ''
        if (formValues.frecuencia === 'SEMANAL') {
          frecuenciaTexto = `Cada ${DIAS_SEMANA[formValues.diaSemana || 0]}`
        } else if (formValues.frecuencia === 'QUINCENAL') {
          frecuenciaTexto = 'Cada 15 días'
        } else if (formValues.frecuencia === 'MENSUAL') {
          frecuenciaTexto = `Día ${formValues.diaMes} de cada mes`
        } else {
          frecuenciaTexto = `Cada ${formValues.diasPersonalizado} días`
        }

        await Swal.fire({
          title: '¡Suscripción Creada!',
          html: `
            <div class="text-left space-y-2">
              <p class="text-sm text-gray-600">Tu suscripción ha sido creada exitosamente:</p>
              <ul class="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li><strong>${formValues.cantidad}</strong> unidad(es) de <strong>${productoSeleccionado.nombre}</strong></li>
                <li>${frecuenciaTexto}</li>
                <li>Próxima entrega: <strong>${new Date(data.proximaFecha).toLocaleDateString()}</strong></li>
              </ul>
              <p class="text-xs text-gray-500 mt-3 bg-emerald-50 p-2 rounded">
                Los productos se agregarán automáticamente a tu carrito en la fecha programada.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#10b981',
        })
      } else {
        const errorText = await response.text()
        throw new Error(errorText || 'Error al crear suscripción')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'No se pudo crear la suscripción'
      Swal.fire('Error', errorMessage, 'error')
    }
  }

  const getFrecuenciaTexto = (sub: Suscripcion) => {
    switch (sub.frecuencia) {
      case 'SEMANAL':
        return `Cada ${DIAS_SEMANA[sub.diaSemana ?? 0]}`
      case 'QUINCENAL':
        return 'Cada 15 días'
      case 'MENSUAL':
        return `Día ${sub.diaMes} de cada mes`
      case 'PERSONALIZADA':
        return `Cada ${sub.diasPersonalizado} días`
      default:
        return sub.frecuencia
    }
  }

  const getEstadoBadge = (estado: EstadoSuscripcion) => {
    const styles = {
      ACTIVA: 'bg-emerald-100 text-emerald-800',
      PAUSADA: 'bg-yellow-100 text-yellow-800',
      SUSPENDIDA: 'bg-orange-100 text-orange-800',
      CANCELADA: 'bg-red-100 text-red-800',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[estado]}`}>
        {estado}
      </span>
    )
  }

  const filteredSuscripciones = filter === 'all'
    ? suscripciones
    : suscripciones.filter((s) => s.estado === filter)

  const activas = suscripciones.filter((s) => s.estado === 'ACTIVA')
  const pausadas = suscripciones.filter((s) => s.estado === 'PAUSADA')

  if (loading) {
    return (
      <Container>
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-zinc-600">Cargando suscripciones...</p>
        </div>
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container>
        <div className="py-12 text-center text-zinc-600">
          Debes iniciar sesión para ver tus suscripciones.
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Mis Suscripciones</h1>
            <p className="text-zinc-600 mt-1">
              Gestiona tus entregas automáticas de medicamentos
            </p>
          </div>
          <button
            onClick={abrirModalNuevaSuscripcion}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Suscripción
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Todas ({suscripciones.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVA')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'ACTIVA'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Activas ({activas.length})
          </button>
          <button
            onClick={() => setFilter('PAUSADA')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'PAUSADA'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Pausadas ({pausadas.length})
          </button>
        </div>

        {/* Lista de suscripciones */}
        {filteredSuscripciones.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200">
            <Package size={64} className="mx-auto text-zinc-300 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              No tienes suscripciones {filter !== 'all' && filter.toLowerCase() + 's'}
            </h3>
            <p className="text-zinc-600 mb-6">
              Crea tu primera suscripción para recibir medicamentos automáticamente
            </p>
            <button
              onClick={abrirModalNuevaSuscripcion}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Suscripción
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSuscripciones.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  {/* Imagen del producto */}
                  <div className="flex-shrink-0">
                    {sub.producto.imageUrl ? (
                      <img
                        src={sub.producto.imageUrl}
                        alt={sub.producto.nombre}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-zinc-100 rounded-lg flex items-center justify-center">
                        <Package className="text-zinc-400" size={40} />
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {sub.producto.nombre}
                        </h3>
                        <p className="text-sm text-zinc-600">
                          {sub.producto.marca.nombre}
                        </p>
                      </div>
                      {getEstadoBadge(sub.estado)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-zinc-500">Cantidad</p>
                        <p className="font-medium">
                          {sub.cantidad} {sub.producto.unidad.codigo}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Frecuencia</p>
                        <p className="font-medium text-sm">{getFrecuenciaTexto(sub)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Próxima entrega</p>
                        <p className="font-medium text-sm flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(sub.proximaFecha).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Total por entrega</p>
                        <p className="font-medium">
                          Bs. {(sub.cantidad * sub.producto.precio).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    {sub.estado !== 'CANCELADA' && (
                      <div className="flex gap-2 mt-4">
                        {sub.estado === 'ACTIVA' && (
                          <button
                            onClick={() => pausarSuscripcion(sub.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm"
                          >
                            <Pause size={16} />
                            Pausar
                          </button>
                        )}
                        {sub.estado === 'PAUSADA' && (
                          <button
                            onClick={() => reanudarSuscripcion(sub.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
                          >
                            <Play size={16} />
                            Reanudar
                          </button>
                        )}
                        <button
                          onClick={() => cancelarSuscripcion(sub.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                        >
                          <Trash2 size={16} />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}
