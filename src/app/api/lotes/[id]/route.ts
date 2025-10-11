import type { NextRequest } from "next/server"

const apiBase = process.env.NEXT_PUBLIC_API_URL

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${apiBase}/lotes/${params.id}`, {
    method: 'PATCH',
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${apiBase}/lotes/${params.id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
  })

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  })
}

export const runtime = 'nodejs'
