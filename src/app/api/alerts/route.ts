import type { NextRequest } from 'next/server'

const apiBase = process.env.NEXT_PUBLIC_API_URL

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search
  const res = await fetch(`${apiBase}/alerts${search}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  })

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  })
}

export const runtime = 'nodejs'
