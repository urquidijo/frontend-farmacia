import type { NextRequest } from 'next/server'
const api = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  const r = await fetch(`${api}/carrito/checkout`, {
    method: 'POST',
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
  })
  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' }
  })
}

export const runtime = 'nodejs'
