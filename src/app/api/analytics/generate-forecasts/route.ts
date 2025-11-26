import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dias = 30, modelo = 'promedio_movil' } = body

    const url = `${process.env.NEXT_PUBLIC_API_URL}/analytics/generate-forecasts?dias=${dias}&modelo=${modelo}`

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Cookie: req.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to generate' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
