import { NextRequest } from 'next/server'

const api = process.env.NEXT_PUBLIC_API_URL

// PATCH /api/suscripciones/[id]/resume - Reanudar suscripción
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const r = await fetch(`${api}/suscripciones/${id}/resume`, {
    method: 'PATCH',
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  })

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  })
}
