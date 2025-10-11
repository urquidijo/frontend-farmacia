// app/api/roles/[id]/permissions/route.ts
import type { NextRequest } from 'next/server';
const api = process.env.NEXT_PUBLIC_API_URL;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await fetch(`${api}/roles/${id}/permissions`, {
    credentials: 'include',
    cache: 'no-store',
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const r = await fetch(`${api}/roles/${id}/permissions`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: await req.text(),
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}

export const runtime = 'nodejs';
