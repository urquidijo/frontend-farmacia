// app/api/roles/[id]/permissions/route.ts
import type { NextRequest } from 'next/server';
const api = process.env.NEXT_PUBLIC_API_URL;

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const r = await fetch(`${api}/roles/${params.id}/permissions`, {
    credentials: 'include',
    cache: 'no-store',
  });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await fetch(`${api}/roles/${params.id}/permissions`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: await req.text(),
  });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}

export const runtime = 'nodejs';
