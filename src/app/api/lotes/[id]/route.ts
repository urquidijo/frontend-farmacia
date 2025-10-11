import type { NextRequest } from "next/server"

const apiBase = process.env.NEXT_PUBLIC_API_URL

type Params = { id: string }
type Context = { params: Params } | { params: Promise<Params> }

const resolveParams = async (context: Context): Promise<Params> =>
  context.params instanceof Promise ? await context.params : context.params

export async function PATCH(req: NextRequest, context: Context) {
  const { id } = await resolveParams(context)

  const res = await fetch(`${apiBase}/lotes/${id}`, {
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

export async function DELETE(req: NextRequest, context: Context) {
  const { id } = await resolveParams(context)

  const res = await fetch(`${apiBase}/lotes/${id}`, {
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
