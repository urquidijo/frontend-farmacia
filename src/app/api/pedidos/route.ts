import type { NextRequest } from 'next/server'

const api = process.env.NEXT_PUBLIC_API_URL

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const params = new URLSearchParams()

  for (const key of ['search', 'status', 'from', 'to', 'page', 'pageSize']) {
    const value = searchParams.get(key)
    if (value) params.set(key, value)
  }

  const res = await fetch(`${api}/pedidos?${params.toString()}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  })
  const text = await res.text()

  return new Response(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}

export const runtime = 'nodejs'
