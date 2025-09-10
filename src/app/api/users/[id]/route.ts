import type { NextRequest } from 'next/server'
const api = process.env.NEXT_PUBLIC_API_URL

type Params = { id: string }

// PATCH /api/users/[id]
export async function PATCH(req: NextRequest, context: { params: Promise<Params> }) {
  const { id } = await context.params
  const body = await req.json().catch(() => ({}))

  const r = await fetch(`${api}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  })
}

// DELETE /api/users/[id]
export async function DELETE(req: NextRequest, context: { params: Promise<Params> }) {
  const { id } = await context.params

  const r = await fetch(`${api}/users/${id}`, {
    method: 'DELETE',
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
  })

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  })
}

export const runtime = 'nodejs'
