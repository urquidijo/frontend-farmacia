import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

    const url = `${backendUrl}/pagos/facturas`

    console.log('📡 Solicitando facturas desde:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Error en /api/pagos/facturas:', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
