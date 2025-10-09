'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'

interface CarritoItem {
  id: number
  cantidad: number
  producto: {
    id: number
    nombre: string
    precio: number
    imageUrl?: string
    marca: { nombre: string }
  }
}

export default function CarritoPage() {
  const [items, setItems] = useState<CarritoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include',
      })

      if (response.ok) {
        setIsAuthenticated(true)
        fetchCarrito()
      } else {
        setIsAuthenticated(false)
        setLoading(false)
        Swal.fire({
          title: 'Debes iniciar sesión',
          text: 'Para ver tu carrito de compras, inicia sesión',
          icon: 'info',
          confirmButtonText: 'Ir a login',
        }).then(() => {
          router.push('/login')
        })
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setLoading(false)
    }
  }

  const fetchCarrito = async () => {
    try {
      const response = await fetch('/api/carrito', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching carrito:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCantidad = async (itemId: number, newCantidad: number) => {
    if (newCantidad < 1) return

    try {
      const response = await fetch(`/api/carrito/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cantidad: newCantidad }),
      })

      if (response.ok) {
        fetchCarrito()
      }
    } catch (error) {
      console.error('Error updating cantidad:', error)
    }
  }

  const removeItem = async (itemId: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Se quitará del carrito',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/carrito/${itemId}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (response.ok) {
          Swal.fire('Eliminado', 'Producto quitado del carrito', 'success')
          fetchCarrito()
        }
      } catch (error) {
        console.error('Error removing item:', error)
      }
    }
  }

  const handleCheckout = async () => {
    const result = await Swal.fire({
      title: 'Procesar compra',
      text: '¿Deseas finalizar tu compra?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, procesar',
      cancelButtonText: 'Cancelar',
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/carrito/checkout', {
          method: 'POST',
          credentials: 'include',
        })

        if (response.ok) {
          Swal.fire({
            title: '¡Compra realizada!',
            text: 'Tu orden ha sido registrada exitosamente',
            icon: 'success',
          })
          setItems([])
        } else {
          throw new Error('Error al procesar')
        }
      } catch (error) {
        console.error('Error en checkout:', error)
        Swal.fire('Error', 'No se pudo procesar la compra', 'error')
      }
    }
  }

  const calcularTotal = () => {
    return items.reduce((total, item) => {
      return total + item.producto.precio * item.cantidad
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart size={32} className="text-emerald-600" />
        <h1 className="text-3xl font-bold">Mi Carrito</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-500 mb-6">
            Agrega productos para empezar tu compra
          </p>
          <button
            onClick={() => router.push('/productos')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition"
          >
            Ver productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-4 flex gap-4"
              >
                {/* Imagen */}
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.producto.imageUrl ? (
                    <img
                      src={item.producto.imageUrl}
                      alt={item.producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {item.producto.nombre}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.producto.marca.nombre}
                  </p>
                  <p className="text-emerald-600 font-bold mt-2">
                    Bs. {item.producto.precio.toFixed(2)}
                  </p>
                </div>

                {/* Controles */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateCantidad(item.id, item.cantidad - 1)
                      }
                      className="bg-gray-200 hover:bg-gray-300 rounded p-1"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-semibold">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() =>
                        updateCantidad(item.id, item.cantidad + 1)
                      }
                      className="bg-gray-200 hover:bg-gray-300 rounded p-1"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <p className="font-bold text-lg">
                    Bs. {(item.producto.precio * item.cantidad).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Resumen de compra</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">
                    Bs. {calcularTotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío:</span>
                  <span className="font-semibold">Gratis</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-emerald-600">
                      Bs. {calcularTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Procesar compra
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Al procesar tu compra, se registrará en el historial
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
