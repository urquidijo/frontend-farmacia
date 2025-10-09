import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const q = searchParams.get('q')
    const limit = searchParams.get('limit')

    const params = new URLSearchParams()
    if (categoria) params.append('categoria', categoria)
    if (q) params.append('q', q)
    if (limit) params.append('limit', limit)

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const url = `${backendUrl}/public/productos?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener productos' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en /api/public/productos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
