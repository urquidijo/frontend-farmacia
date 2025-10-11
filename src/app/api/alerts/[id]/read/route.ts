import type { NextRequest } from 'next/server'

const apiBase = process.env.NEXT_PUBLIC_API_URL

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${apiBase}/alerts/${params.id}/read`, {
    method: 'PATCH',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
  })

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  })
}

export const runtime = 'nodejs'
