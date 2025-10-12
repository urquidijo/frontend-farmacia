import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

    const response = await fetch(`${backendUrl}/pagos/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error en /api/pagos/crear:', error)
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 })
  }
}
