import type { NextRequest } from 'next/server';

const api = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await fetch(`${api}/users/${id}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${api}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await fetch(`${api}/users/${id}`, {
    method: 'DELETE',
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  });
}

export const runtime = 'nodejs';
