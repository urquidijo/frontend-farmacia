import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL

  const res = await fetch(`${apiBase}/auth/logout`, {
    method: 'POST',
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
  })

  const text = await res.text()
  const headers = new Headers()
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) headers.set('set-cookie', setCookie)
  headers.set('content-type', res.headers.get('content-type') ?? 'application/json')

  return new Response(text, { status: res.status, headers })
}
