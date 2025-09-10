import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL

  const body = await req.json().catch(() => ({}))

  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const text = await res.text()
  const headers = new Headers()
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) headers.set('set-cookie', setCookie)
  headers.set('content-type', res.headers.get('content-type') ?? 'application/json')

  return new Response(text, { status: res.status, headers })
}
