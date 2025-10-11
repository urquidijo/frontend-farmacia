import type { NextRequest } from 'next/server'

const apiBase = process.env.NEXT_PUBLIC_API_URL

type Params = { id: string }
type ParamsContext = { params: Params } | { params: Promise<Params> }

async function resolveParams(context: ParamsContext): Promise<Params> {
  return context.params instanceof Promise ? await context.params : context.params
}

export async function PATCH(req: NextRequest, context: ParamsContext) {
  const { id } = await resolveParams(context)

  const res = await fetch(`${apiBase}/alerts/${id}/read`, {
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
