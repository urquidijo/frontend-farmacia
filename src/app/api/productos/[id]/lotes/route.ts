import type { NextRequest } from "next/server"

const apiBase = process.env.NEXT_PUBLIC_API_URL

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${apiBase}/productos/${params.id}/lotes`, {
    credentials: 'include',
    headers: {
      cookie: _req.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  })

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${apiBase}/productos/${params.id}/lotes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    body: await req.text(),
  })

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  })
}

export const runtime = 'nodejs'
