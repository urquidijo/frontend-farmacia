// app/api/roles/[id]/route.ts
import type { NextRequest } from 'next/server';
const api = process.env.NEXT_PUBLIC_API_URL;

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const r = await fetch(`${api}/roles/${params.id}`, { credentials: 'include', cache: 'no-store' });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await fetch(`${api}/roles/${params.id}`, {
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await fetch(`${api}/roles/${params.id}`, {
    method: 'DELETE',
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
  });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}

export const runtime = 'nodejs';
