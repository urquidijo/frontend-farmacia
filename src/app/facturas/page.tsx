'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Factura {
  id: number
  monto: number
  estado: string
  facturaUrl: string | null
  orden: {
    id: number
    total: number
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

export default function FacturasCliente() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    verificarUsuario()
  }, [])

  const verificarUsuario = async () => {
    try {
      const meResponse = await fetch('/api/me', { credentials: 'include' })
      if (meResponse.ok) {
        const user = await meResponse.json()
        setUserEmail(user.email)
        fetchFacturas(user.email)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error al verificar usuario:', error)
      setLoading(false)
    }
  }

  const fetchFacturas = async (email: string) => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${backendUrl}/pagos/facturas`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        const filtradas = data.filter(
          (factura: Factura) => factura.orden.user.email === email
        )
        setFacturas(filtradas)
      }
    } catch (error) {
      console.error('Error al cargar facturas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return <div className="p-8 text-center">Cargando facturas...</div>

  if (!userEmail)
    return (
      <div className="p-8 text-center text-gray-600">
        Debes iniciar sesión para ver tus facturas.
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Facturas</h1>
        <p className="text-gray-600">Historial de tus facturas y pagos</p>
      </div>

      {facturas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            Aún no tienes facturas registradas.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Factura
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-gray-900">
                        Bs. {factura.monto.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          factura.estado === 'PAGADA'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {factura.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {factura.facturaUrl ? (
                        <Link
                          href={factura.facturaUrl}
                          target="_blank"
                          className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                        >
                          Ver factura
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No disponible
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
