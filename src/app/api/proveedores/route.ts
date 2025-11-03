import type { NextRequest } from 'next/server'

const api = process.env.NEXT_PUBLIC_API_URL

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const params = new URLSearchParams()

  const search = searchParams.get('search')
  const page = searchParams.get('page')
  const pageSize = searchParams.get('pageSize')

  if (search) params.set('search', search)
  if (page) params.set('page', page)
  if (pageSize) params.set('pageSize', pageSize)

  const res = await fetch(`${api}/proveedores?${params.toString()}`, {
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

export async function POST(req: NextRequest) {
  const body = await req.text()
  const res = await fetch(`${api}/proveedores`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body,
  })
  const text = await res.text()

  return new Response(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  })
}

export const runtime = 'nodejs'
