import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

    // Llamada al backend NestJS
    const response = await fetch(`${backendUrl}/pagos/facturas`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json()

    // Responder al frontend con lo que devolvió el backend
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Error en /api/pagos/facturas (Next.js):', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}
