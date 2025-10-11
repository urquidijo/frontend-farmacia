'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Swal from 'sweetalert2'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  productos?: Producto[]
}

interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  marca: string
  categoria: string
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente virtual de farmacia. ¿En qué puedo ayudarte hoy? Puedes contarme tus síntomas y te recomendaré productos.',
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // No mostrar el chat en rutas de administración
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar mensaje')
      }

      const data = await response.json()

      // Limpiar el texto de respuesta de los marcadores [PRODUCTO:id:nombre]
      const cleanedResponse = data.response.replace(/\[PRODUCTO:\d+:[^\]]+\]/g, '').trim()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedResponse,
        productos: data.productos,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const addToCarrito = async (productoId: number) => {
    setAddingToCart(productoId)

    try {
      // Verificar si está autenticado
      const authResponse = await fetch('/api/me', { credentials: 'include' })

      if (!authResponse.ok) {
        Swal.fire({
          title: 'Debes iniciar sesión',
          text: 'Para agregar productos al carrito, inicia sesión primero',
          icon: 'info',
          confirmButtonText: 'Ir a login',
        }).then(() => {
          router.push('/login')
        })
        setAddingToCart(null)
        return
      }

      // Agregar al carrito
      const response = await fetch('/api/carrito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productoId, cantidad: 1 }),
      })

      if (response.ok) {
        Swal.fire({
          title: '¡Agregado!',
          text: 'Producto agregado al carrito',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        })
        // Disparar evento para actualizar contador del carrito
        window.dispatchEvent(new Event('carrito:changed'))
      } else {
        throw new Error('Error al agregar')
      }
    } catch (error) {
      console.error('Error:', error)
      Swal.fire('Error', 'No se pudo agregar al carrito', 'error')
    } finally {
      setAddingToCart(null)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
          aria-label="Abrir chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-zinc-200">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                💊
              </div>
              <div>
                <h3 className="font-semibold">Asistente Farmacia</h3>
                <p className="text-xs text-emerald-100">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white border border-zinc-200'} rounded-2xl p-3 shadow-sm`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Mostrar productos recomendados */}
                  {message.productos && message.productos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-emerald-700 border-t border-zinc-200 pt-2">
                        Productos recomendados:
                      </p>
                      {message.productos.map((producto) => (
                        <div key={producto.id} className="bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                          <p className="text-xs font-semibold text-zinc-800">{producto.nombre}</p>
                          <p className="text-xs text-zinc-600">{producto.marca} • {producto.categoria}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold text-emerald-700">
                              Bs. {producto.precio.toFixed(2)}
                            </span>
                            <button
                              onClick={() => addToCarrito(producto.id)}
                              disabled={addingToCart === producto.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded-md transition disabled:opacity-50"
                            >
                              {addingToCart === producto.id ? '⏳' : '🛒 Añadir'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tus síntomas..."
                className="flex-1 resize-none border border-zinc-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
