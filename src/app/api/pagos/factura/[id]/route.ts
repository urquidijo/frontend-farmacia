import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

    const response = await fetch(`${backendUrl}/pagos/factura/${params.id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error en /api/pagos/factura/[id]:', error)
    return NextResponse.json(
      { error: 'Error al obtener factura' },
      { status: 500 }
    )
  }
}
