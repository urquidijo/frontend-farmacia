import { NextRequest } from 'next/server'

const api = process.env.NEXT_PUBLIC_API_URL

// GET /api/suscripciones - Obtener suscripciones del usuario
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')

  const queryString = estado ? `?estado=${estado}` : ''
  const url = `${api}/suscripciones/mis-suscripciones${queryString}`

  const r = await fetch(url, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  })

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  })
}

// POST /api/suscripciones - Crear nueva suscripción
export async function POST(req: NextRequest) {
  const body = await req.json()

  const r = await fetch(`${api}/suscripciones`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  })
}
